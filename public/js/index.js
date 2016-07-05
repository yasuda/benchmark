/* global _, Vue */

(function() {

  'use strict';

  var root = this;

  var indexComponent = {
    init: function() {
      var self = this;

      // constant
      self.C = {
        method: {
          none: 0,
          code: 1,
          gist: 2
        }
      };
    },

    data: function() {
      var self = this;

      return {
        method: self.C.method,

        selectedMethod: self.C.method.none,

        code: null,

        gistId: null
      }
    },

    created: function() {
      var self = this;

      // private cache
      self.c = {
      };
    },

    beforeDestroy: function() {
      var self = this;

      // clear all cache
      self.c = {};
    },

    methods: {
      executeWithCode: function() {
        var self = this;

        console.log(self.code);
      },

      executeWithGist: function() {
        var self = this;

        if (self.gistId) {
          root
            .clean()
            .gist(self.gistId)
            .node()
            .execute();
        }
      }
    },

    el: '#container'
  };

  new Vue(indexComponent);

}.call(this));
