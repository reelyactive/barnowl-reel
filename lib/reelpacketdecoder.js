/**
 * Copyright reelyActive 2014-2018
 * We believe in an open Internet of Things
 */


const ReelPacket = require('./reelpacket');
const advlib = require('advlib-identifier');


/**
 * Convert a chunk of hexadecimal string into an integer.
 * @param {String} string The hexadecimal string from which to read.
 * @param {Number} start Index of the first byte.
 * @param {Number} length Number of bytes to read.
 */
function toInt(string, start, length) {
  return parseInt(string.substr(start * 2, length * 2), 16);
}


/**
 * Convert a byte of hexadecimal string from an 8-bit 2's complement integer
 * to a value in the range of 0-255.
 * @param {String} string The hexadecimal string from which to read.
 * @param {Number} start Index of the byte.
 * @param {Number} length The packet length in bytes.
 */
function toRssi(string, start, length) {
  let isReelyActive = ((length === 4) || (length === 6));
  let isBluetoothLowEnergy = ((length >= 9) && (length <= 39));

  let unsignedValue = parseInt(string.substr(start * 2, 2), 16);
  if(unsignedValue === ReelPacket.INVALID_DECODING_RSSI) {
    return null;
  }

  let signedValue = unsignedValue;
  if(unsignedValue > 127) {
    signedValue = unsignedValue - 256;
  }

  if(isReelyActive) {
    return Math.round((signedValue / ReelPacket.CC1110_RSSI_DIVISOR) +
                      ReelPacket.CC1110_RSSI_OFFSET_DBM);
  }
  if(isBluetoothLowEnergy) {
    return Math.round((signedValue / ReelPacket.CC2541_RSSI_DIVISOR) +
                      ReelPacket.CC2541_RSSI_OFFSET_DBM);
  }
}


/**
 * Convert the hexadecimal string to an EUI-64 identifier, prefixing the
 * reelyActive OUI-36.
 * @param {String} string The hexadecimal string from which to read.
 * @param {Number} start Index of the first byte.
 */
function toEui64(string, start) {
  return advlib.identifiers.REELYACTIVE_OUI36 +
         string.substr((start * 2) + 1, 7);
}


/**
 * Grab a chunk of hexadecimal string.
 * @param {String} string The hexadecimal string from which to read.
 * @param {Number} start Index of the first byte.
 * @param {Number} length Number of bytes to read.
 */
function toHexString(string, start, length) {
  return string.substr(start * 2, length * 2);
}


/**
 * Extract the transmitter identifier from the given packet.
 * @param {String} packet The packet as a hexadecimal string.
 * @param {Number} length The packet length in bytes.
 */
function toTransmitterIdentifier(packet, length) {
  let isReelyActive = ((length === 4) || (length === 6));
  let isBluetoothLowEnergy = ((length >= 9) && (length <= 39));

  if(isReelyActive) {
    return advlib.reelyactive.extractIdentifier(packet);
  }
  if(isBluetoothLowEnergy) {
    return advlib.ble.extractIdentifier(packet);
  }

  return { identifier: null, identifierType: advlib.identifiers.TYPE_UNKNOWN };
}


/**
 * Decode a radio signal packet.
 * @param {String} data The reel data as a hexadecimal string.
 * @param {String} origin Origin of the data stream.
 * @param {Number} time The time of the data capture.
 */
function decodeRadioSignal(data, origin, time) {
  let type = ReelPacket.TYPE_DECODED_RADIO_SIGNAL;
  let payloadLengthBytes = toInt(data, 0, 1);
  let reelceiverCount = toInt(data, 1, 1);
  let packetLengthBytes = 2 + payloadLengthBytes + (reelceiverCount * 2);
  let isInvalidReelceiverCount = (reelceiverCount === 0);
  let isTooShort = (data.length < (packetLengthBytes * 2));

  if(isInvalidReelceiverCount) {
    let err = new Error('Invalid reelceiver count in Decoded Radio Signal');
    return new ReelPacket(ReelPacket.TYPE_UNDEFINED, null, origin, time);
  }
  else if(isTooShort) {
    return new ReelPacket(type, { isIncomplete: true }, origin, time);
  }
  else { 
    let packet = toHexString(data, 2, payloadLengthBytes);
    let rssiSignature = [];
    let reelOffsetStart = 2 + payloadLengthBytes;
    let rssiStart = 3 + payloadLengthBytes;
    let lastReelOffset = -1;

    for(let index = 0; index < reelceiverCount; index++) {
      let decodingOffset = index * 2;
      let reelOffset = toInt(data, reelOffsetStart + decodingOffset, 1);
      let rssi = toRssi(data, rssiStart + decodingOffset, payloadLengthBytes);
      let isValidRssi = (rssi !== null);
      let isReelOffsetSequenceError = (reelOffset <= lastReelOffset);
      if(isReelOffsetSequenceError) {
        let err = new Error('Decoded Radio Signal reel offset not ' +
                            'monotonically increasing');
        return new ReelPacket(ReelPacket.TYPE_UNDEFINED, null, origin, time);
      }
      lastReelOffset = reelOffset;
      if(isValidRssi) {
        rssiSignature.push( { reelOffset: reelOffset, rssi: rssi } );
      }
    }

    let transmitter = toTransmitterIdentifier(packet, payloadLengthBytes);
    let isUnknownTransmitterType = (transmitter.identifierType ===
                                    advlib.identifiers.TYPE_UNKNOWN);
    if(isUnknownTransmitterType) {
      let err = new Error('Unknown transmitter type');
      return new ReelPacket(ReelPacket.TYPE_UNDEFINED, null, origin, time);
    }

    let radioDecoding = {
        transmitterId: transmitter.identifier,
        transmitterIdType: transmitter.identifierType,
        packets: [ packet ],
        rssiSignature: rssiSignature,
        receiverCount: reelceiverCount,
        payloadLength: payloadLengthBytes
    };

    return new ReelPacket(type, radioDecoding, origin, time);
  }
}


/**
 * Decode a reel announce packet.
 * @param {String} data The reel data as a hexadecimal string.
 * @param {String} origin Origin of the data stream.
 * @param {Number} time The time of the data capture.
 * @param {callback} callback Function to call on completion.
 */
function decodeReelAnnounce(data, origin, time, callback) {
  let type = ReelPacket.TYPE_REEL_ANNOUNCE;
  let isTooShort = (data.length < (ReelPacket.REEL_ANNOUNCE_LENGTH_BYTES * 2));

  if(isTooShort) {
    return new ReelPacket(type, { isIncomplete: true }, origin, time);
  }
  else {
    let reelAnnounce = {};
    reelAnnounce.deviceCount = toInt(data, 1, 1);
    reelAnnounce.identifier = toEui64(data, 2);
    reelAnnounce.nonce = toHexString(data, 6, 16);

    return new ReelPacket(type, reelAnnounce, origin, time);
  }
}


/**
 * Decode a reelceiver statistics packet.
 * @param {String} data The reel data as a hexadecimal string.
 * @param {String} origin Origin of the data stream.
 * @param {Number} time The time of the data capture.
 * @param {callback} callback Function to call on completion.
 */
function decodeReelceiverStatistics(data, origin, time, callback) {
  let type = ReelPacket.TYPE_REELCEIVER_STATISTICS;
  let isTooShort = (data.length < 
                         (ReelPacket.REELCEIVER_STATISTICS_LENGTH_BYTES * 2));

  if(isTooShort) {
    return new ReelPacket(type, { isIncomplete: true }, origin, time);
  }
  else {
    let reelceiverStatistics = {};
    reelceiverStatistics.reelOffset = toInt(data, 1, 1);
    reelceiverStatistics.receiverId = toEui64(data, 2);
    reelceiverStatistics.uptimeSeconds = toInt(data, 6, 2);
    reelceiverStatistics.sendCount = toInt(data, 8, 2);
    reelceiverStatistics.crcPass = toInt(data, 10, 2);
    reelceiverStatistics.crcFail = toInt(data, 12, 2);
    reelceiverStatistics.maxRSSI = toRssi(data, 14);
    reelceiverStatistics.avgRSSI = toRssi(data, 15);
    reelceiverStatistics.minRSSI = toRssi(data, 16);
    reelceiverStatistics.maxLQI = toInt(data, 17, 1);  
    reelceiverStatistics.avgLQI = toInt(data, 18, 1);  
    reelceiverStatistics.minLQI = toInt(data, 19, 1);  
    reelceiverStatistics.temperatureCelcius = (toInt(data, 20, 1) - 80) / 2;
    reelceiverStatistics.radioVoltage = 1.8 + (toInt(data, 21, 1) / 34);
    reelceiverStatistics.serialVoltage = toInt(data, 22, 1); // TODO: fix

    return new ReelPacket(type, reelceiverStatistics, origin, time);
  }
}


/**
 * Decode a reel packet stripped of prefix from the given hexadecimal string.
 * @param {ReelPacketQueue} queue The queue of packets as hexadecimal strings.
 * @param {String} origin Origin of the data stream.
 * @param {String} time The time of the data capture.
 * @param {Number} indexOfPacket Index of the start of packet in the string.
 */
function decodeReelPacket(queue, origin, time, indexOfPacket) {
  let code = parseInt(queue.data.substr(indexOfPacket, 2), 16);
  let data;
  let isTooShort = ((queue.data.length - indexOfPacket) <
                    (ReelPacket.MIN_PACKET_LENGTH_BYTES * 2));

  if(isTooShort) {
    return new ReelPacket(null, { isIncomplete: true }, origin, time);
  }
  else {
    switch(ReelPacket.convertCodeToType(code)) {
      case ReelPacket.TYPE_DECODED_RADIO_SIGNAL:
        data = queue.data.substr(indexOfPacket,
                                 (ReelPacket.MAX_PACKET_LENGTH_BYTES * 2));
        return decodeRadioSignal(data, origin, time);
      case ReelPacket.TYPE_REEL_ANNOUNCE:
        data = queue.data.substr(indexOfPacket,
                                 (ReelPacket.REEL_ANNOUNCE_LENGTH_BYTES * 2));
        return decodeReelAnnounce(data, origin, time);
      case ReelPacket.TYPE_REELCEIVER_STATISTICS:
        data = queue.data.substr(indexOfPacket,
                          (ReelPacket.REELCEIVER_STATISTICS_LENGTH_BYTES * 2));
        return decodeReelceiverStatistics(data, origin, time);
      default:
        return new ReelPacket(null, null, origin, time);
    }    
  }
}


/**
 * Decode all the reel packets from the hexadecimal string.
 * @param {ReelPacketQueue} queue The queue of packets as hexadecimal strings.
 * @param {String} origin Origin of the data stream.
 * @param {Number} time The time of the data capture.
 */
function decode(queue, origin, time) {
  let packets = [];
  let prefix = ReelPacket.PREFIX;
  let indexOfPacket = queue.indexAfter(prefix);
  let isPrefixPresent = (indexOfPacket >= 0);

  while(isPrefixPresent) {
    let packet = decodeReelPacket(queue, origin, time, indexOfPacket);

    // Too short, wait for more data
    if(packet.isIncomplete === true) {
      return packets;
    }

    // Recognised and complete packet, add to packets
    if(packet.type !== ReelPacket.TYPE_UNDEFINED) {
      let indexOfPacketEnd = indexOfPacket + (packet.lengthBytes * 2);
      queue.sliceAtIndex(indexOfPacketEnd);
      packets.push(packet);
    }

    // Undecodable packet, ignore and slice to look for next prefix
    else {
      queue.sliceAtIndex(indexOfPacket);
    }

    indexOfPacket = queue.indexAfter(prefix);
    isPrefixPresent = (indexOfPacket >= 0);
  }

  return packets;
}


module.exports.decode = decode;
