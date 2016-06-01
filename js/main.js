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

  /**
   * Get file from gist
   *
   * @param {string} path - gist path {id}|{https://xxx/{github id}/{gist id}|{https://xxx/{github id}/{gist id}/}
   */
  function gist(path) {
    var id = _.findLast(path.split('/'));
    var url = 'https://api.github.com/gists/' + id;
    var xhr= new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.send();
    xhr.onreadystatechange = function() {
      if (xhr.readyState !== 4) {
        return;
      }
      var status = xhr.status;
      if (status !== 200 && status !== 304) {
        throw new Error('Invalid http status, status:' + status);
      }
      var data = JSON.parse(xhr.responseText);
      _.forEach(data.files, function(data, file) {
        console.log('[gist] %s executing...', file);
        try {
          new Function('', data.content).call(root);
        } catch(e) {
          throw new Error('Invalid gist file');
        }
      });
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
          console.log('[%d]\t"%s"\t%sms\t[%s]', ++index, name, mean.toPrecision(3), diff.toPrecision(5));
        })
        .value({ async: info.async });
    })
    .run();
    return root;
  }

  root.gist = gist;
  root.clean = init;
  root.async = async;
  root.setup = setup;
  root.set = set;
  root.execute = execute;

}.call(this));
