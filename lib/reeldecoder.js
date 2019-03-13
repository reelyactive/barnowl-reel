/**
 * Copyright reelyActive 2014-2018
 * We believe in an open Internet of Things
 */


const reelPacketDecoder = require('./reelpacketdecoder');
const ReelPacketQueue = require('./reelpacketqueue');


/**
 * ReelDecoder Class
 * Decodes data streams from one or more reelyActive reels and forwards the
 * packets to the given ReelManager instance.
 */
class ReelDecoder {

  /**
   * ReelDecoder constructor
   * @param {Object} options The options as a JSON object.
   * @constructor
   */
  constructor(options) {
    options = options || {};

    this.reelManager = options.reelManager;
    this.queuesByOrigin = {};
  }

  /**
   * Handle data from a given reel, specified by the origin
   * @param {String} data The reel data as a hexadecimal string.
   * @param {String} origin The unique origin identifier of the reel.
   * @param {Number} time The time of the data capture.
   * @param {Object} decodingOptions The packet decoding options.
   */
  handleReelData(data, origin, time, decodingOptions) {
    let self = this;
    let isNewOrigin = (!this.queuesByOrigin.hasOwnProperty(origin));
    if(isNewOrigin) {
      this.queuesByOrigin[origin] = new ReelPacketQueue(data);
    }
    else {
      this.queuesByOrigin[origin].addData(data);
    }
    let packets = reelPacketDecoder.decode(this.queuesByOrigin[origin],
                                           origin, time, decodingOptions);
    packets.forEach(function(packet) {
      self.reelManager.handleReelPacket(packet);
    });
  }
}


module.exports = ReelDecoder;
