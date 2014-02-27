# tart-probing

_Stability: 1 - [Experimental](https://github.com/tristanls/stability-index#stability-1---experimental)_

[![NPM version](https://badge.fury.io/js/tart-probing.png)](http://npmjs.org/package/tart-probing)

Probing configuration implementation for [Tiny Actor Run-Time in JavaScript](https://github.com/organix/tartjs).

## Contributors

[@dalnefre](https://github.com/dalnefre), [@tristanls](https://github.com/tristanls)

## Overview

Probing configuration implementation for [Tiny Actor Run-Time in JavaScript](https://github.com/organix/tartjs).

  * [Usage](#usage)
  * [Tests](#tests)
  * [Documentation](#documentation)
  * [Sources](#sources)

## Usage

To run the below example run:

    npm run readme

```javascript
"use strict";

var tart = require('../index.js');
var util = require('util');

var probing = tart.probing();

probing.events.on('created', function (data) {
    console.log('created', data);
});

probing.events.on('send', function (data) {
    console.log('sending', data);
});

probing.events.on('delivered', function (data) {
    console.log('delievered', data);
});

probing.events.on('duration', function (data) {
    console.log('duration', data);
});

probing.events.on('exception', function (data) {
    console.log('exception', data);
});

probing.events.on('probe', function (data) {
    console.log('probe', data);
});

var createdBeh = function createdBeh(message) {};
var becomeBeh = function becomeBeh(message) {
    throw new Error('boom!');
};

var oneTimeBeh = function oneTimeBeh(message) {
    var start = process.hrtime();
    var actor = this.sponsor(createdBeh); // create
    this.self('explode'); // send to self
    actor('foo'); // send
    actor('foo2');
    this.config({
        event: 'probe', 
        data: {value: true}
    });
    actor('foo3');
    this.behavior = becomeBeh; // become
};

var oneTime = probing.sponsor(oneTimeBeh);
oneTime('bar');
```

## Tests

    npm test

## Documentation

TODO

## Sources

  * [Tiny Actor Run-Time](https://github.com/organix/tart)