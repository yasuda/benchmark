/* global _, Benchmark, dcp */

(function() {

  'use strict';

  var root = this;
  var info;
  init();

  function init() {
    info = {
      async: false,
      setup: [],
      funcs: {},
      self: null,
      data: null,
      clone: {}
    };
    return root;
  }

  function async(bool) {
    info.async = bool !== false;
    return root;
  }

  function setup(func) {
    info.setup.push(func);
    return root;
  }

  function set(key, func) {
    if (_.isPlainObject(key)) {
      _.forEach(key, function(func, key) {
        set(key, func);
      });
      return root;
    }
    info.funcs[key] = func;
    return root;
  }

  /**
   * Check all functions return same results
   *
   * @private
   */
  function test() {
    console.log('[test] checking functions...');
    if(_.isEmpty(info.funcs)) {
      throw new Error('functions are empty.');
    }
    var pre;
    var sameResult = _.every(info.funcs, function(func) {
      var _pre = pre;
      var current = func.call(info.clone.self(info.self), info.clone.data(info.data));
      pre = current;
      if (!_pre) {
        return true;
      }
      return _.isEqual(_pre, current);
    });
    if (!sameResult) {
      throw new Error('Didn\'t get same results.');
    }
    console.log('[test] passed.');
  }

  function execute() {
    console.log('[execute] waiting...');
    var self = {};
    var data = {};
    _.forEach(info.setup, function(func) {
      var d = func.call(self, data);
      if (d) {
        data = d;
      }
    });
    dcp.clean();
    info.self = self;
    info.data = data;
    info.clone = {
      self: dcp.define('self', self),
      data: dcp.define('data', data)
    };
    test();
    console.log('[execute] executing...');
    var suite = new Benchmark.Suite();
    _.forEach(info.funcs, function(func, key) {
      suite.add(key, function() {
        func.call(info.clone.self(self), info.clone.data(data));
      });
    });
    suite
    .on('complete', function() {
      _.chain(this)
        .map(function(data) {
          console.log(data);
          return {
            name: data.name,
            mean: data.stats.mean
          };
        })
        .sortBy('mean')
        .forEach(function(data, index, array) {
          var name = data.name;
          var mean = data.mean * 1000;
          var diff = mean / (_.first(array).mean * 1000);
          console.log('[' + (++index) + ']', '"' + name + '"', (mean.toPrecision(2)) + 'ms', '[' + diff.toPrecision(3) + ']');
        })
        .value();
    })
    .run();
  }

  root.clean = init;
  root.async = async;
  root.setup = setup;
  root.set = set;
  root.execute = execute;

}.call(this));
