/**
 * Copyright reelyActive 2014-2018
 * We believe in an open Internet of Things
 */


const EventEmitter = require('events').EventEmitter;
const TestListener = require('./testlistener.js');
const UdpListener = require('./udplistener.js');
const SerialListener = require('./seriallistener.js');
const ReelDecoder = require('./reeldecoder.js');
const ReelManager = require('./reelmanager.js');


/**
 * Barnowl Class
 * Converts reel radio decodings into standard raddec events.
 * @param {Object} options The options as a JSON object.
 * @constructor
 */
class Barnowl extends EventEmitter {

  /**
   * Barnowl constructor
   * @param {Object} options The options as a JSON object.
   * @constructor
   */
  constructor(options) {
    super();
    options = options || {};

    this.listeners = [];
    this.reelManager = new ReelManager({ barnowl: this});
    this.reelDecoder = new ReelDecoder({ reelManager: this.reelManager });
  }

  /**
   * Add a listener to the given hardware interface.
   * @param {Class} ListenerClass The (uninstantiated) listener class.
   * @param {Object} options The options as a JSON object.
   */
  addListener(ListenerClass, options) {
    options = options || {};
    options.decoder = this.reelDecoder;

    let listener = new ListenerClass(options);
    this.listeners.push(listener);
  }

  /**
   * Handle and emit the given raddec.
   * @param {Raddec} raddec The given Raddec instance.
   */
  handleRaddec(raddec) {
    // TODO: observe options to normalise raddec
    this.emit("raddec", raddec);
  }

  /**
   * Handle and emit the given infrastructure message.
   * @param {Object} message The given infrastructure message.
   */
  handleInfrastructureMessage(message) {
    this.emit("infrastructureMessage", message);
  }
}


module.exports = Barnowl;
module.exports.TestListener = TestListener;
module.exports.UdpListener = UdpListener;
module.exports.SerialListener = SerialListener;
