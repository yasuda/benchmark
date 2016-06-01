(function() {

  'use strict';

  console.log('実行方法はexample.jsを見てネ！');
  console.log('If you are interested, please check example.js!');
  console.log('example() // execute example code.');
  console.log('example2() // execute example code from gist.');

  var root = this;

  var setup = function() {
    this.array1 = Array(100);
    this.array2 = Array(100);
  };
  var funcs = {
    'array#cocnat': function() {
      return this.array1.concat(this.array2);
    },
    'array#push': function() {
      Array.prototype.push.apply(this.array1, this.array2);
      return this.array1;
    }
  };

  root.example = function() {
    root
      .setup(setup)
      .set(funcs)
      .execute();
  };

  root.example2 = function() {
    var id = 'b35074cd74e132ffdd7cb10940b3b873';
    var url1 = 'https://gist.github.com/suguru03/b35074cd74e132ffdd7cb10940b3b873';
    var url2 = 'https://gist.github.com/suguru03/b35074cd74e132ffdd7cb10940b3b873/';
    root.gist(id || url1 || url2);
  };

}.call(this));
