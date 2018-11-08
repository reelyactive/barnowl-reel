/**
 * Copyright reelyActive 2014-2018
 * We believe in an open Internet of Things
 */


const ReelPacket = require('./reelpacket');
const Raddec = require('raddec');
const advlib = require('advlib-identifier');


const DEFAULT_INCLUDE_UNKNOWN_RECEIVERS = false;
const DISCONNECTION_MILLISECONDS = 60000;
const REEL_MAP_STATE_INTERVAL_MILLISECONDS = 60000;
const INACTIVITY_INTERVAL_MILLISECONDS = DISCONNECTION_MILLISECONDS;


/**
 * ReelManager Class
 * Manages the composition of reels.
 * @constructor
 */
class ReelManager {

  /**
   * ReelManager constructor
   * @param {Object} options The options as a JSON object.
   * @constructor
   */
  constructor(options) {
    this.barnowl = options.barnowl;
    this.includeUnknownReceivers = options.includeUnknownReceivers ||
                                   DEFAULT_INCLUDE_UNKNOWN_RECEIVERS;
    this.reelsByOrigin = {};
    this.latestAnnounceTimes = {};

    setTimeout(produceReelMapState, REEL_MAP_STATE_INTERVAL_MILLISECONDS,
               this);
    setTimeout(manageReelceiverInactivity, INACTIVITY_INTERVAL_MILLISECONDS,
               this);
  }

  /**
   * Handle the given reel packet
   * @param {Object} packet The reel packet to handle.
   */
  handleReelPacket(packet) {
    switch(packet.type) {
      case ReelPacket.TYPE_DECODED_RADIO_SIGNAL:
        handleDecodedRadioSignal(this, packet);
        break;
      case ReelPacket.TYPE_REELCEIVER_STATISTICS:
        handleReelceiverStatistics(this, packet);
        break;
      case ReelPacket.TYPE_REEL_ANNOUNCE:
        handleReelAnnounce(this, packet);
        break;
    }
  }
}


/**
 * Translate and produce the given decoded radio signal as a Raddec.
 * @param {ReelManager} instance The given ReelManager instance.
 * @param {ReelPacket} packet The decoded radio signal packet.
 */
function handleDecodedRadioSignal(instance, packet) {
  let isKnownOrigin = instance.reelsByOrigin.hasOwnProperty(packet.origin);

  if(isKnownOrigin) {
    let reel = instance.reelsByOrigin[packet.origin];
    packet.rssiSignature.forEach(function(entry, index) {
      let isKnownReelceiver = (
                (typeof reel.reelOffsets[entry.reelOffset] !== 'undefined') &&
                (reel.reelOffsets[entry.reelOffset] !== null));
      if(isKnownReelceiver) {
        entry.receiverId = reel.reelOffsets[entry.reelOffset];
        entry.receiverIdType = advlib.identifiers.TYPE_EUI64;
      }
      else if(instance.includeUnknownReceivers) {
        entry.receiverId = null;
        entry.receiverIdType = advlib.identifiers.TYPE_UNKNOWN;
      }
      else {
        packet.rssiSignature.splice(index, 1);
      }
    });
  }

  let includesValidDecoding = (packet.rssiSignature.length > 0);
  if(includesValidDecoding) {
    let raddec = new Raddec(packet);
    instance.barnowl.handleRaddec(raddec);
  }
}


/**
 * Produce the given ReelceiverStatistics packet.
 * @param {ReelManager} instance The given ReelManager instance.
 * @param {ReelPacket} packet The ReelceiverStatistics packet.
 */
function handleReelceiverStatistics(instance, packet) {
  instance.barnowl.handleInfrastructureMessage({
      type: packet.type,
      time: packet.time,
      receiverId: packet.receiverId,
      uptimeSeconds: packet.uptimeSeconds,
      sendCount: packet.sendCount,
      crcPass: packet.crcPass,
      crcFail: packet.crcFail,
      maxRSSI: packet.maxRSSI,
      avgRSSI: packet.avgRSSI,
      minRSSI: packet.minRSSI,
      temperatureCelcius: packet.temperatureCelcius,
      radioVoltage: packet.radioVoltage
  });
}


/**
 * Update the reel status based on the given ReelAnnounce packet.
 * @param {ReelManager} instance The given ReelManager instance.
 * @param {Packet} packet The ReelAnnounce packet.
 */
function handleReelAnnounce(instance, packet) {
  let isNewOrigin = (!instance.reelsByOrigin.hasOwnProperty(packet.origin));

  if(isNewOrigin) {
    instance.reelsByOrigin[packet.origin] = {
        reelOffsets: [],
        deviceCounts: []
    };
  }

  let deviceCounts = instance.reelsByOrigin[packet.origin].deviceCounts;
  let reelOffsets = instance.reelsByOrigin[packet.origin].reelOffsets;
  updateAnnounceTimes(instance, packet);

  // Furthest device from the hub so far
  if(packet.deviceCount >= deviceCounts.length) {
    for(let index = deviceCounts.length; index < packet.deviceCount; index++) {
      deviceCounts[index] = null;     // Fill any reel gaps 
      reelOffsets.splice(0, 0, null);  //   with 'unknown' (null) devices
    }
    deviceCounts[packet.deviceCount] = packet.identifier;
    reelOffsets.splice(0, 0, packet.identifier);
    produceReelMapState(instance);
  }

  else {
    let expectedIdentifier = deviceCounts[packet.deviceCount];

    // The device fills in one of the gaps in the reel
    if(expectedIdentifier === null) {
      let reelOffset = reelOffsets.length - packet.deviceCount - 1;
      deviceCounts[packet.deviceCount] = packet.identifier;
      reelOffsets[reelOffset] = packet.identifier;
      produceReelMapState(instance);
    }

    // Device identifier conflict, physical change to reel detected!
    else if(expectedIdentifier !== packet.identifier) {
      instance.reelsByOrigin[packet.origin].reelOffsets = [];  // Reset and
      instance.reelsByOrigin[packet.origin].deviceCounts = []; //   handle it
      handleReelAnnounce(instance, packet);                    //   once again
    }
  }
}


/**
 * Produce a reelceiverConnection based on the given ReelAnnounce packet.
 * @param {ReelManager} instance The given ReelManager instance.
 * @param {ReelPacket} packet The given reelAnnounce packet.
 */
function produceReelceiverConnection(instance, packet) {
  instance.barnowl.handleInfrastructureMessage({
      type: 'reelceiverConnection',
      time: packet.time,
      receiverId: packet.identifier,
      origin: packet.origin
  });
}


/**
 * Produce a reelceiverDisconnection based on the given receiver id and time.
 * @param {ReelManager} instance The given ReelManager instance.
 * @param {String} receiverId The given receiver id.
 * @param {Number} time The time of the last activity.
 */
function produceReelceiverDisconnection(instance, receiverId, time) {
  instance.barnowl.handleInfrastructureMessage({
      type: 'reelceiverDisconnection',
      time: time,
      receiverId: receiverId
  });
}


/**
 * Produce a reelMapState reelEvent.
 * @param {ReelManager} instance The given ReelManager instance.
 */
function produceReelMapState(instance) {
  let origins = {};
  for(origin in instance.reelsByOrigin) {
    origins[origin] = {
        reelOffsets: instance.reelsByOrigin[origin].reelOffsets
    };
  }

  instance.barnowl.handleInfrastructureMessage({
      type: 'reelMapState',
      time: new Date().getTime(),
      origins: origins
  });

  setTimeout(produceReelMapState, REEL_MAP_STATE_INTERVAL_MILLISECONDS,
             instance);
}


/**
 * Update the latest announce time of the given reelceiver, produce
 *   reelceiverConnection event if it's new in the list.
 * @param {ReelManager} instance The given ReelManager instance.
 * @param {ReelPacket} packet The given reelAnnounce packet.
 */
function updateAnnounceTimes(instance, packet) {
  let exists = instance.latestAnnounceTimes.hasOwnProperty(packet.identifier);

  instance.latestAnnounceTimes[packet.identifier] = packet.time;
  if(!exists) {
    produceReelceiverConnection(instance, packet);
  }
}


/**
 * Produce reelceiverDisconnection event for reelceivers not having announced
 *   within the specified delay and remove them from the list.
 * @param {ReelManager} instance The given ReelManager instance.
 */
function manageReelceiverInactivity(instance) {
  let cutoffTime = new Date().getTime() - DISCONNECTION_MILLISECONDS;
  for(reelceiverId in instance.latestAnnounceTimes) {
    let latestAnnounceTime = instance.latestAnnounceTimes[reelceiverId];
    if(latestAnnounceTime < cutoffTime) {
      removeReelceiver(instance, reelceiverId);
      produceReelceiverDisconnection(instance, reelceiverId,
                                     latestAnnounceTime);
      delete instance.latestAnnounceTimes[reelceiverId];
    }
  }

  setTimeout(manageReelceiverInactivity, INACTIVITY_INTERVAL_MILLISECONDS,
             instance);
}


/**
 * Remove the given reelceiver from the origin records, tidying up the records
 *   as required to ensure the reel ordering is correctly represented.
 * @param {ReelManager} instance The given ReelManager instance.
 * @param {String} reelceiverId The identifier of the reelceiver to remove.
 */
function removeReelceiver(instance, reelceiverId) {
  for(origin in instance.reelsByOrigin) {
    let reel = instance.reelsByOrigin[origin];
    let isReelAnchor = (reel.reelOffsets[0] === reelceiverId);

    // Reelceiver is the anchor, remove and trim away until the next valid one
    if(isReelAnchor) {
      reel.reelOffsets[0] = null;
      while((reel.reelOffsets.length > 0) && (reel.reelOffsets[0] === null)) {
        reel.reelOffsets.shift();
        reel.deviceCounts.pop();
      }
    }

    // Reelceiver is mid-reel, simply nullify
    else if(reel.reelOffsets.includes(reelceiverId)) {
      let reelOffsetIndex = reel.reelOffsets.indexOf(reelceiverId);
      let deviceCountsIndex = reel.deviceCounts.indexOf(reelceiverId);
      reel.reelOffsets[reelOffsetIndex] = null;
      reel.deviceCounts[deviceCountsIndex] = null;
    }
  }
}


module.exports = ReelManager;
