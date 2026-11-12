// Jest 28+ compatible replacement for react-scripts' config/jest/cssTransform.js
// (which still returns a string, the Jest 27 transformer API).
// Turns plain style imports (e.g. 'leaflet/dist/leaflet.css') into empty modules.
// CSS Modules are not affected: they are mapped to identity-obj-proxy via moduleNameMapper.
module.exports = {
  process() {
    return { code: 'module.exports = {};' };
  },
  getCacheKey() {
    return 'cssTransform';
  },
};
