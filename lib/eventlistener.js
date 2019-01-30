/**
 * Copyright reelyActive 2014-2019
 * We believe in an open Internet of Things
 */


/**
 * EventListener Class
 * Listens for reel data as events.
 */
class EventListener {

  /**
   * EventListener constructor
   * @param {Object} options The options as a JSON object.
   * @constructor
   */
  constructor(options) {
    let self = this;
    options = options || {};

    this.decoder = options.decoder;

    options.path.on('data', function (data, origin, time) {
      time = time || new Date().getTime();
      origin = origin || 'event';

      if(data instanceof Buffer) {
        self.decoder.handleReelData(data.toString('hex'), origin, time);
      }
      else if(typeof data === 'string') {
        self.decoder.handleReelData(data, origin, time);
      }
      else {
        console.log('barnowl-reel: event listener expects reel data as Buffer or hex string');
      }
    });
  }
}


module.exports = EventListener;
