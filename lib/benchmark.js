'use strict';

const _ = require('lodash');
const dcp = require('dcp');
const Benchmark = require('benchmark');

function resolveFunc(obj) {
  return _.transform(obj, (result, funcStr, key) => {
    result[key] = new Function(`return ${funcStr}`)();
  });
}

class Executor {

  constructor(info, res) {
    this._async = info.async;
    this._setup = resolveFunc(info.setup);
    this._funcs = resolveFunc(info.funcs);
    this._suite = new Benchmark.Suite();
    this._res = res;
    this._self = {};
    this._data = {};
    this._clone = {};
    this._resolved = false;
  }

  setup() {
    _.forEach(this._setup, (func) => {
      const data = func.call(this._self, this._data);
      if (data) {
        this._data = data;
      }
    });
    dcp.clean();
    this._clone = {
      self: dcp.define('self', this._self),
      data: dcp.define('data', this._data)
    };
    return this;
  }

  test() {
    if(_.isEmpty(this._funcs)) {
      return this.error(new Error('functions are empty.'));
    }
    let pre;
    let checkResult = _.every(this.funcs, func => {
      let _pre = pre;
      let current = func.call(this._clone.self(this._self), this._clone.data(this._data));
      pre = current;
      if (!_pre) {
        return true;
      }
      return _.isEqual(_pre, current);
    });
    if (!checkResult) {
      return this.error(new Error('Didn\'t get same results.'));
    }
    this._resolved = true;
    return this;
  }

  error(err) {
    this._res.status(500);
    this._res.send(err.message);
    return this;
  }

  execute() {
    if (!this._resolved) {
      return this;
    }
    const suite = new Benchmark.Suite();
    _.forEach(this._funcs, (func, key) => {
      suite.add(key, () => {
        func.call(this._clone.self(this._self), this._clone.data(this._data));
      });
    });
    const opts = { async: this._async };
    const res = this._res;
    suite
      .on('complete', () => {
        const result = _.chain(suite)
          .map(data => {
            return {
              name: data.name,
              mean: data.stats.mean
            };
          })
          .sortBy('mean')
          .map((data, index, array) => {
            const name = data.name;
            const mean = data.mean * 1000;
            const diff = mean / (_.first(array).mean * 1000);
            console.log(`[${++index}]\t${name}\t${mean.toPrecision(3)}ms\t[${diff.toPrecision(5)}]`);
            return {
              name: name,
              mean: mean,
              diff: diff
            };
          })
          .value(opts);

        res.status(200);
        res.json(result);
      })
      .run();

    return this;
  }
}

module.exports = (req, res) => {
  const info = _.pick(req.body, 'async', 'setup', 'funcs');
  console.log(info);
  const executor = new Executor(info, res);
  executor
    .setup()
    .test()
    .execute();
};
