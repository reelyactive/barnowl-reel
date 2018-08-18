/**
 * Copyright reelyActive 2014-2018
 * We believe in an open Internet of Things
 */

// Constants (Prefix)
const PREFIX = 'aaaa';

// Constants (Packet)
const MIN_PACKET_LENGTH_BYTES = 4;   // TODO: make these take a max
const MAX_PACKET_LENGTH_BYTES = 551; //       from all packet types

// Constants (Type)
const TYPE_DECODED_RADIO_SIGNAL = 'decodedRadioSignal';
const TYPE_REEL_ANNOUNCE = 'reelAnnounce';
const TYPE_REELCEIVER_STATISTICS = 'reelceiverStatistics';
const TYPE_UNDEFINED = 'undefined';

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

// Constants (RSSI offsets and divisors)
const CC1110_RSSI_OFFSET_DBM = -70;  // Based on nominal sensitivity
const CC2541_RSSI_OFFSET_DBM = -100; //   and observed values
const CC1110_RSSI_DIVISOR = 2;
const CC2541_RSSI_DIVISOR = 1;
const INVALID_DECODING_RSSI = 0x80;


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
   * @param {String} time The time of the data capture.
   * @constructor
   */
  constructor(type, content, origin, time) {
    content = content || {};

    // DecodedRadioSignal
    if(type === TYPE_DECODED_RADIO_SIGNAL) {
      this.type = TYPE_DECODED_RADIO_SIGNAL;
      this.lengthBytes = DECODED_RADIO_SIGNAL_OVERHEAD_BYTES +
                         content.payloadLength + (content.receiverCount *
                         DECODED_RADIO_SIGNAL_BYTES_PER_DECODING);
      this.receiverCount = content.receiverCount;
      this.transmitterId = content.transmitterId;
      this.transmitterIdType = content.transmitterIdType;
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
      this.receiverId = content.receiverId;
      this.uptimeSeconds = content.uptimeSeconds || 0;
      this.sendCount = content.sendCount || 0;
      this.crcPass = content.crcPass || 0;
      this.crcFail = content.crcFail || 0;
      this.maxRSSI = content.maxRSSI || 0;
      this.avgRSSI = content.avgRSSI || 0;
      this.minRSSI = content.minRSSI || 0;
      this.maxLQI = content.maxLQI || 0;
      this.avgLQI = content.avgLQI || 0;
      this.minLQI = content.minLQI || 0;
      this.temperatureCelcius = content.temperatureCelcius || 0;
      this.radioVoltage = content.radioVoltage || 0;
      this.serialVoltage = content.serialVoltage || 0;
    }

    // Undefined
    else {
      this.type = TYPE_UNDEFINED;
    }

    this.isIncomplete = content.isIncomplete || false;
    this.origin = origin;
    this.time = time;
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
module.exports.MIN_PACKET_LENGTH_BYTES = MIN_PACKET_LENGTH_BYTES;
module.exports.MAX_PACKET_LENGTH_BYTES = MAX_PACKET_LENGTH_BYTES;
module.exports.TYPE_DECODED_RADIO_SIGNAL = TYPE_DECODED_RADIO_SIGNAL;
module.exports.TYPE_REEL_ANNOUNCE = TYPE_REEL_ANNOUNCE;
module.exports.REEL_ANNOUNCE_LENGTH_BYTES = REEL_ANNOUNCE_PACKET_LENGTH_BYTES;
module.exports.TYPE_REELCEIVER_STATISTICS = TYPE_REELCEIVER_STATISTICS;
module.exports.REELCEIVER_STATISTICS_LENGTH_BYTES = 
                                    REELCEIVER_STATISTICS_PACKET_LENGTH_BYTES;
module.exports.CC1110_RSSI_OFFSET_DBM = CC1110_RSSI_OFFSET_DBM;
module.exports.CC2541_RSSI_OFFSET_DBM = CC2541_RSSI_OFFSET_DBM;
module.exports.CC1110_RSSI_DIVISOR = CC1110_RSSI_DIVISOR;
module.exports.CC2541_RSSI_DIVISOR = CC2541_RSSI_DIVISOR;
