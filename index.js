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
    const locationStack = [];
    if (req.entities && req.entities.location) {
      const rawLocation = req.entities.location.filter(loc => loc.confidence > this.config.min_confidence);
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
      locationStack.unshift(location);
      if (req.memory && req.memoryContext) {
        const path = req.memoryContext.path;
        if (path > 0) {
          await req.memory.memorize(path[path.length - 1], { location });
        }
      }
    }
    if (req.memory && req.memory.location) {
      locationStack.unshift(req.memory.location);
    }

    req.location = new Proxy(locationStack, {
      get: (list, name) => {
        for (const item of list) {
          if (item[name]) {
            return item[name];
          }
        }
        return;
      }
    });
  }

  use(fn) {
    throw new Error('You cannot use something on location router, excepted to be used only as middleware')
  }
};