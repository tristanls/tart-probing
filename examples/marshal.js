/*

marshal.js - example from tart-marshal README

The MIT License (MIT)

Copyright (c) 2014 Dale Schumacher, Tristan Slominski

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

*/
"use strict";

var tart = require('../index.js');
var marshal = require('tart-marshal');

var probing = tart.probing();
var sponsor = probing.sponsor;

probing.events.on('created', function (data) {
    console.log('~probe:', 'created', data);
});
probing.events.on('send', function (data) {
    console.log('~probe:', 'send', data);
});
probing.events.on('delivered', function (data) {
    console.log('~probe:', 'delievered', data);
});
probing.events.on('duration', function (data) {
    console.log('~probe:', 'duration', data);
});
probing.events.on('exception', function (data) {
    console.log('~probe', 'exception', data);
});

var network = marshal.router(sponsor);
var domain0 = network.domain('ocap:zero');
var domain1 = network.domain('ocap:one');

var pingBeh = function pingBeh(message) {
    if (message.value === undefined) {
        var pong = message.pong;
        pong({ ping:this.self, pong:pong, value:"pinging" });
    } else {
        console.log('ping', message.value);
        console.log('(ping === message.ping)', (ping === message.ping));
    }
};
var pongBeh = function pongBeh(message) {
    var ping = message.ping;
    ping({ ping:ping, pong:this.self, value:"ponging" });
    console.log('pong', message.value);
};

var ping = domain0.sponsor(pingBeh);
var pong = domain1.sponsor(pongBeh);

var pingToken = domain0.localToRemote(ping);
var pingProxy = domain1.remoteToLocal(pingToken);

pingProxy({ pong: pong });  // send message between domains