'use strict';

const fs = require('fs');
const path = require('path');

(function resolve(dirpath, _exports) {
  fs.readdirSync(dirpath).forEach((filename) => {
    if (path.extname(filename) === '.js' && filename !== 'index.js') {
      let jsname = path.basename(filename, '.js');
      _exports[jsname] = require('./' + filename);
    } else if (fs.statSync(__dirname + '/' + filename).isDirectory()) {
      _exports[filename] = {};
      resolve(__dirname + '/' + filename, _exports[filename]);
    }
  });
})(__dirname, exports);
