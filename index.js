const AbstractRouter = require('ticelli-bot/router');
const GoogleMaps = require('@google/maps');

module.exports = class LocationRouter extends AbstractRouter {
  constructor(...params) {
    super(...params);
    this.config.min_confidence = this.config.min_confidence || 0.5;
    this.googleMapsClient = GoogleMaps.createClient({
      key: this.config.google_key,
      Promise,
    });
  }

  async run(req) {
    if (req.entities && req.entities.location) {
      const location = req.entities.location.filter(loc => loc.confidence > this.config.min_confidence);
      const address = location.map(l => l.value).join(', ');
      const { json: { results: [geoResults] } } = await this.googleMapsClient.geocode({
        language: 'fr_FR',
        region: 'FR',
        address,
      }).asPromise();
      const data = geoResults;
      req.location = {
        full: data.formatted_address,
        original: address,
        latitude: data.geometry.location.lat,
        longitude: data.geometry.location.lng,
      };
    }
  }

  use(fn) {
    throw new Error('You cannot use something on location router, excepted to be used only as middleware')
  }
};