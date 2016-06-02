'use strict';

const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 8000;
const useBenchmark = process.env.BENCHMARK || false;

const lib = require('./lib');

app.use(bodyParser.json());
app.use(express.static(path.resolve(__dirname, 'public')));

if (useBenchmark) {
  app.post('/benchmark', lib.benchmark);
}

app.listen(port);

console.info('**** server start [%s] ****', port);
