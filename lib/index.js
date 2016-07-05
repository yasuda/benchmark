'use strict';

const fs = require('fs');
const path = require('path');

(function resolve(dirpath, _exports) {
  fs.readdirSync(dirpath).forEach(filename => {
    if (fs.statSync(__dirname + '/' + filename).isDirectory()) {
      _exports[filename] = {};
      return resolve(__dirname + '/' + filename, _exports[filename]);
    }
    if (path.extname(filename) === '.js' && filename !== 'index.js') {
      const jsname = path.basename(filename, '.js');
      _exports[jsname] = require('./' + filename);
    }
  });
})(__dirname, exports);
