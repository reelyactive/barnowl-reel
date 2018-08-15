/**
 * Copyright reelyActive 2014-2018
 * We believe in an open Internet of Things
 */

// Constants (Prefix)
const PREFIX = 'aaaa';

// Constants (Identifiers)
const REELYACTIVE_OUI36 = '001bc5094';

// Constants (Packet)
const MIN_PACKET_LENGTH_BYTES = 4;   // TODO: make these take a max
const MAX_PACKET_LENGTH_BYTES = 551; //       from all packet types

// Constants (Type)
const TYPE_DECODED_RADIO_SIGNAL = 'DecodedRadioSignal';
const TYPE_REEL_ANNOUNCE = 'ReelAnnounce';
const TYPE_REELCEIVER_STATISTICS = 'ReelceiverStatistics';
const TYPE_UNDEFINED = 'Undefined';

// Constants (DecodedRadioSignal Packet)
const DECODED_RADIO_SIGNAL_MIN_PACKET_LENGTH_BYTES = 0;
const DECODED_RADIO_SIGNAL_MAX_PACKET_LENGTH_BYTES = 39;
const DECODED_RADIO_SIGNAL_OVERHEAD_BYTES = 2;
const DECODED_RADIO_SIGNAL_BYTES_PER_DECODING = 2;

// Constants (ReelAnnounce Packet)
const REEL_ANNOUNCE_PACKET_LENGTH_BYTES = 22;
const REEL_ANNOUNCE_REEL_PACKET_CODE = 0x70;

// Constants (ReelceiverStatistics Packet)
const REELCEIVER_STATISTICS_PACKET_LENGTH_BYTES = 23;
const REELCEIVER_STATISTICS_REEL_PACKET_CODE = 0x78;


/**
 * ReelPacket Class
 * Represents a reelyActive reel packet
 */
class ReelPacket {

  /**
   * ReelPacket constructor
   * @param {String} type Type of reel packet.
   * @param {Object} content Content of the given packet type.
   * @param {Object} origin Origin of the data stream.
   * @param {String} timestamp Timestamp of packet.
   * @constructor
   */
  constructor(type, content, origin, timestamp) {
    content = content || {};

    // DecodedRadioSignal
    if(type === TYPE_DECODED_RADIO_SIGNAL) {
      this.type = TYPE_DECODED_RADIO_SIGNAL;
      this.lengthBytes = DECODED_RADIO_SIGNAL_OVERHEAD_BYTES +
                         content.payloadLength + (content.receiverCount *
                         DECODED_RADIO_SIGNAL_BYTES_PER_DECODING);
      this.receiverCount = content.receiverCount;
      this.packets = content.packets;
      this.rssiSignature = content.rssiSignature;
    }

    // ReelAnnounce
    else if(type === TYPE_REEL_ANNOUNCE) {
      this.type = TYPE_REEL_ANNOUNCE;
      this.lengthBytes = REEL_ANNOUNCE_PACKET_LENGTH_BYTES;
      this.identifier = content.identifier;
      this.deviceCount = content.deviceCount;
      this.nonce = content.nonce;
    }

    // ReelceiverStatistics
    else if(type = TYPE_REELCEIVER_STATISTICS) {
      this.type = TYPE_REELCEIVER_STATISTICS;
      this.lengthBytes = REELCEIVER_STATISTICS_PACKET_LENGTH_BYTES;
      this.reelOffset = content.reelOffset;
      this.identifier = content.identifier;
      this.uptime = content.uptime;
      this.sendCount = content.sendCount;
      this.crcPass = content.crcPass;
      this.crcFail = content.crcFail;
      this.maxRSSI = content.maxRSSI;
      this.avgRSSI = content.avgRSSI;
      this.minRSSI = content.minRSSI;
      this.maxLQI = content.maxLQI;
      this.avgLQI = content.avgLQI;
      this.minLQI = content.minLQI;
      this.temperature = content.temperature;
      this.radioVoltage = content.radioVoltage;
      this.serialVoltage = content.serialVoltage;
    }

    // Undefined
    else {
      this.type = TYPE_UNDEFINED;
    }

    this.isIncomplete = content.isIncomplete || false;
    this.origin = origin;
    this.timestamp = timestamp;
  }

  /**
   * Convert the given reel packet code to its corresponding type.
   * @return {String} Packet type.
   */
  static convertCodeToType(code) {
    if(code === REEL_ANNOUNCE_REEL_PACKET_CODE) {
      return TYPE_REEL_ANNOUNCE;
    }
    if(code === REELCEIVER_STATISTICS_REEL_PACKET_CODE) {
      return TYPE_REELCEIVER_STATISTICS;
    }
    if((code > DECODED_RADIO_SIGNAL_MIN_PACKET_LENGTH_BYTES) &&
       (code <= DECODED_RADIO_SIGNAL_MAX_PACKET_LENGTH_BYTES)) {
      return TYPE_DECODED_RADIO_SIGNAL;
    }
    return TYPE_UNDEFINED;
  }
}


module.exports = ReelPacket;
module.exports.PREFIX = PREFIX;
module.exports.REELYACTIVE_OUI36 = REELYACTIVE_OUI36;
module.exports.MIN_PACKET_LENGTH_BYTES = MIN_PACKET_LENGTH_BYTES;
module.exports.MAX_PACKET_LENGTH_BYTES = MAX_PACKET_LENGTH_BYTES;
module.exports.TYPE_DECODED_RADIO_SIGNAL = TYPE_DECODED_RADIO_SIGNAL;
module.exports.TYPE_REEL_ANNOUNCE = TYPE_REEL_ANNOUNCE;
module.exports.REEL_ANNOUNCE_LENGTH_BYTES = REEL_ANNOUNCE_PACKET_LENGTH_BYTES;
module.exports.TYPE_REELCEIVER_STATISTICS = TYPE_REELCEIVER_STATISTICS;
module.exports.REELCEIVER_STATISTICS_LENGTH_BYTES = 
                                    REELCEIVER_STATISTICS_PACKET_LENGTH_BYTES;
