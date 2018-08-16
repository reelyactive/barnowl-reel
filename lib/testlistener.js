/**
 * Copyright reelyActive 2014-2018
 * We believe in an open Internet of Things
 */


const DEFAULT_RADIO_DECODINGS_PERIOD_MILLISECONDS = 1000;
const DEFAULT_REEL_ANNOUNCE_PERIOD_MILLISECONDS = 5000;
const DEFAULT_REEL_STATISTICS_PERIOD_MILLISECONDS = 60000;
const DEFAULT_RSSI = 0;
const MIN_RSSI = 0;
const MAX_RSSI = 18;
const RSSI_RANDOM_DELTA = 5;
const TEST_ORIGIN = 'test';


/**
 * TestListener Class
 * Provides a consistent stream of artificially generated reel packets.
 */
class TestListener {

  /**
   * TestListener constructor
   * @param {Object} options The options as a JSON object.
   * @constructor
   */
  constructor(options) {
    options = options || {};

    this.decoder = options.decoder;
    this.radioDecodingPeriod = options.radioDecodingPeriod ||
                               DEFAULT_RADIO_DECODINGS_PERIOD_MILLISECONDS;
    this.reelAnnouncePeriod = options.reelAnnouncePeriod ||
                              DEFAULT_REEL_ANNOUNCE_PERIOD_MILLISECONDS;
    this.reelStatisticsPeriod = options.reelStatisticsPeriod ||
                                DEFAULT_REEL_STATISTICS_PERIOD_MILLISECONDS;
    this.rssi = [ DEFAULT_RSSI, DEFAULT_RSSI, DEFAULT_RSSI, DEFAULT_RSSI ];

    setInterval(emitRadioDecodings, this.radioDecodingPeriod, this);
    setInterval(emitReelAnnounce, this.reelAnnouncePeriod, this);
    setInterval(emitReelceiverStatistics, this.reelStatisticsPeriod, this);
  }

}


/**
 * Emit simulated radio decoding packets
 * @param {TestListener} instance The given instance.
 */
function emitRadioDecodings(instance) {
  let time = new Date().getTime();
  let simulatedReelData =
      'aaaa04020100000000' + toHexString(instance.rssi[0]) +
                      '02' + toHexString(instance.rssi[2]) +
      'aaaa1802421655daba50e1fe0201050c097265656c79416374697665' +
                      '01' + toHexString(instance.rssi[1]) +
                      '03' + toHexString(instance.rssi[3]);
  updateSimulatedRssi(instance);
  instance.decoder.handleReelData(simulatedReelData, TEST_ORIGIN, time);
}


/**
 * Emit simulated reel announce packets
 * @param {TestListener} instance The given instance.
 */
function emitReelAnnounce(instance) {
  let time = new Date().getTime();
  let simulatedReelData =
      'aaaa70030080000000000000000000000000000000000000' +
      'aaaa70020081000000000000000000000000000000000000' +
      'aaaa70010080000100000000000000000000000000000000' +
      'aaaa70000081000100000000000000000000000000000000';
  instance.decoder.handleReelData(simulatedReelData, TEST_ORIGIN, time);
}


/**
 * Emit simulated reelceiver statistics packets
 * @param {TestListener} instance The given instance.
 */
function emitReelceiverStatistics(instance) {
  let time = new Date().getTime();
  let simulatedReelData =
      'aaaa7800008000000000000000000000000000000000503300' +
      'aaaa7801008100000000000000000000000000000000503300' +
      'aaaa7802008000010000000000000000000000000000503300' +
      'aaaa7803008100010000000000000000000000000000503300';
  instance.decoder.handleReelData(simulatedReelData, TEST_ORIGIN, time);
}


/**
 * Update the simulated RSSI values
 * @param {TestListener} instance The given instance.
 */
function updateSimulatedRssi(instance) {
  for(let index = 0; index < instance.rssi.length; index++) {
    instance.rssi[index] += Math.floor((Math.random() * RSSI_RANDOM_DELTA) -
                                       (RSSI_RANDOM_DELTA / 2));
    if(instance.rssi[index] > MAX_RSSI) {
      instance.rssi[index] = MAX_RSSI;
    }
    else if(instance.rssi[index] < MIN_RSSI) {
      instance.rssi[index] = MIN_RSSI;
    }
  }
}


/**
 * Convert an integer to a two-character hexadecimal string
 * @param {Number} integer The given integer.
 */
function toHexString(integer) {
  return ('0' + integer.toString(16)).substr(-2);
}


module.exports = TestListener;
