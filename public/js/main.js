/* global _, Benchmark, dcp */

(function() {

  'use strict';

  var root = this;
  var info;
  init();

  /**
   * initialize information
   */
  function init() {
    info = {
      run: false,
      node: false,
      async: false,
      setup: [],
      funcs: {},
      self: null,
      data: null,
      clone: {},
      queue: []
    };
    return root;
  }

  /**
   * @private
   */
  function setInfo(key, bool) {
    info[key] = bool !== false;
    return root;
  }

  /**
   * Set async option
   * @param {boolean} bool
   */
  function async(bool) {
    return setInfo('async', bool);
  }

  /**
   * Set node option
   * @param {boolean} bool
   */
  function node(bool) {
    return setInfo('node', bool);
  }

  /**
   * Set setup function
   */
  function setup(func) {
    info.setup.push(func);
    return root;
  }

  /**
   * Set functions
   */
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
   * @private
   */
  function request(method, url, params, callback) {
    var xhr= new XMLHttpRequest();
    xhr.open(method, url);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(params);
    xhr.onreadystatechange = function() {
      if (xhr.readyState !== 4) {
        return;
      }
      var status = xhr.status;
      if (status !== 200 && status !== 304) {
        return callback(new Error('Invalid http request, status:' + status));
      }
      var data = JSON.parse(xhr.responseText);
      callback(null, data);
    };
  }

  /**
   * Get file from gist
   *
   * @param {string} path - gist path {id}|{https://xxx/{github id}/{gist id}|{https://xxx/{github id}/{gist id}/}
   */
  function gist(path) {
    var id = _.findLast(path.split('/'));
    var url = 'https://api.github.com/gists/' + id;
    info.run = true;
    request('GET', url, {}, function(err, data) {
      if (err) {
        throw err;
      }
      _.forEach(data.files, function(data, file) {
        console.log('[gist] %s resolving...', file);
        try {
          new Function('', data.content).call(root);
        } catch(e) {
          throw new Error('Invalid gist file');
        }
        console.log('[gist] %s resolved.', file);
      });
      info.run = false;
      resolve();
    });
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

  /**
   * @private
   */
  function resolve() {
    if (info.run) {
      return false;
    }
    var event = info.queue.shift();
    if (!event) {
      return true;
    }
    event();
    return resolve();
  }

  function toJson(str) {
    return JSON.stringify(str, function(key, value) {
      if (typeof value === 'function') {
        return value.toString();
      }
      return value;
    });
  }

  /**
   * @private
   */
  function execNode() {
    var url = location.origin + '/benchmark';
    var params = toJson(_.pick(info, 'async', 'setup', 'funcs'));
    request('POST', url, params, function(err, data) {
      if (err) {
        throw err;
      }
      _.forEach(data, function(data, index) {
        var name = data.name;
        var mean = data.mean;
        var diff = data.diff;
        console.log('[%d]\t"%s"\t%sms\t[%s]', ++index, name, mean.toPrecision(3), diff.toPrecision(5));
      });
    });
    return root;
  }

  function execute() {
    if (!resolve()) {
      info.queue.push(execute);
      return root;
    }
    if (info.node) {
      return execNode();
    }
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
  root.node = node;
  root.async = async;
  root.setup = setup;
  root.set = set;
  root.execute = execute;

}.call(this));
