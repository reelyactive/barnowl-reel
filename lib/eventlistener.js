/**
 * Copyright reelyActive 2014-2018
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
      self.decoder.handleReelData(data, origin, time);
    });
  }
}


module.exports = EventListener;
