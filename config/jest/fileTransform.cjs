// Jest 28+ compatible replacement for react-scripts' config/jest/fileTransform.js
// (which still returns a string, the Jest 27 transformer API).
// Turns file imports (e.g. images) into their file name, like the original.
const path = require('node:path');

module.exports = {
  process(src, filename) {
    return {
      code: `module.exports = ${JSON.stringify(path.basename(filename))};`,
    };
  },
};
