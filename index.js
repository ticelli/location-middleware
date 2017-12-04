const AbstractRouter = require('ticelli-bot');
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

  async run(train) {
    if (train.entities && train.entities.location) {
      const rawLocation = train.entities.location.filter(loc => loc.confidence > this.config.min_confidence);
      const address = rawLocation.map(l => l.value).join(', ');
      const { json: { results: [geoResults] } } = await this.googleMapsClient.geocode({
        language: 'fr_FR',
        region: 'FR',
        address,
      }).asPromise();

      const location = {
        full: geoResults.formatted_address,
        original: address,
        latitude: geoResults.geometry.location.lat,
        longitude: geoResults.geometry.location.lng,
      };
      train.location = location;
      if (train.memory) {
        await train.memory.set('location', location);
      }
    } else {
      if (train.memory) {
        train.location = await train.memory.get('location');
      }
    }
  }
};
