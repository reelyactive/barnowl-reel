/**
 * Copyright reelyActive 2014-2018
 * We believe in an open Internet of Things
 */


const dgram = require('dgram');


/**
 * UdpListener Class
 * Listens for reel data on a UDP port.
 */
class UdpListener {

  /**
   * UdpListener constructor
   * @param {Object} options The options as a JSON object.
   * @constructor
   */
  constructor(options) {
    options = options || {};

    this.decoder = options.decoder;
    let host = options.path.split(':')[0];
    let port = options.path.split(':')[1];

    this.server = dgram.createSocket('udp4');
    handleServerEvents(this);
    this.server.bind(port, host);
  }
}


/**
 * Handle events from the UDP server.
 * @param {UdpListener} instance The UdpListener instance.
 */
function handleServerEvents(instance) {
  instance.server.on('listening', function() {
    let address = instance.server.address();
    console.log('BarnowlReel UDP listening on ' + address.address + ':' +
                address.port);
  });

  instance.server.on('message', function(data, remote) {
    let origin = remote.address + ':' + remote.port;
    let time = new Date().getTime();
    instance.decoder.handleReelData(data.toString('hex'), origin, time);
  });

  instance.server.on('error', function(err) {
    instance.server.close();
    console.log('BarnowlReel UDP error:', err);
    // TODO: error handling
  });
}


module.exports = UdpListener;
