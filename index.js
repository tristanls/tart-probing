/*

index.js - "tart-probing": Probing configuration implementation

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

var _events = require('events');
var tart = require('tart');

module.exports.probing = function probing(options) {
    options = options || {};

    var events = [];
    var _effect = {
        created: [],
        sent: []
    };

    var emitter = new _events.EventEmitter();

    options.behavior = function probingBeh(message) {
        emitter.emit(message.event, message.data);
    };

    options.enqueue = options.enqueue || function enqueue(eventQueue, events) {
        eventQueue.push(events.slice());  // clone step batch
    };    

    options.dequeue = options.dequeue || function dequeue(eventQueue) {
        while (eventQueue.length > 0) {
            var batch = eventQueue[0];
            if (batch.length > 0) {
                var next = batch.shift(); // return next event
                emitter.emit('delivered', {event: next});
                
                return next;
            }
            eventQueue.shift();
        }
        return false;
    };

    var applyExternalEffect = function applyExternalEffect(effect) {
        var changed = false;
        if (effect.sent.length > 0) {
            options.enqueue(events, effect.sent);
            changed = true;
        }
        if (effect.created.length > 0) {
            changed = true;
        }
        if (changed) {
            initEffect(effect);
        }
    };

    var applyBehaviorEffect = function applyBehaviorEffect(effect) {
        if (effect.sent.length > 0) {
            options.enqueue(events, effect.sent);
        }
        initEffect(effect);
    };

    var initEffect = function initEffect(effect) {
        _effect = {
            created: [],
            sent: []
        };
    };

    var steppingDispatch = function steppingDispatch() {
        applyExternalEffect(_effect);  // WARNING: may change `_effect`
        var event = options.dequeue(events);
        if (!event) {
            return false;
        }
        var effect = _effect;
        effect.event = event;
        try {
            var behavior = event.context.behavior;
            effect.behavior = behavior;
            var start = _events.EventEmitter.listenerCount(emitter, 'duration');
            if (start) {
                start = process.hrtime();
            }
            event.context.behavior(event.message);  // execute actor behavior
            if (start) {
                var diff = process.hrtime(start);
                emitter.emit('duration', {
                    event: event,
                    seconds: diff[0],
                    nanoseconds: diff[1]
                });
            }
            if (behavior !== event.context.behavior) {
                effect.became = event.context.behavior;
            }
        } catch (exception) {
            emitter.emit('exception',
                {exception: exception, event: event});
            effect.exception = exception;
        }
        applyBehaviorEffect(effect);  // WARNING: will change `_effect`
        return effect;
    };

    var defaultLog = function log(effect) {
        /* no logging */
    };
    var defaultFail = function fail(exception) {
        throw exception;
    };

    options.constructConfig = options.constructConfig || function constructConfig(options) {
        var config = function create(behavior) {
            var actor = function send(message) {
                var event = {
                    cause: _effect.event,
                    message: message,
                    context: context
                };
                _effect.sent.push(event);
                emitter.emit('send', {event: event});
                setImmediate(steppingDispatch);
            };
            var context = {
                self: actor,
                behavior: behavior,
                sponsor: config,
                config: sendToConfig
            };
            _effect.created.push(context);
            emitter.emit('created', {event: _effect.event, context: context});
            return actor;
        };

        var sendToConfig = function sendToConfig(message) {
            setImmediate(function deliver() {
                try {
                    configContext.behavior(message);
                } catch (exception) {
                    options.fail(exception);
                };
            });
        };

        var configContext = {
            self: sendToConfig,
            behavior: options.behavior,
            sponsor: config,
            config: sendToConfig
        };

        return config;
    };

    var unused = function unused() {
        throw new Error('This pluggable hook should not be called');
    };    

    options.dispatch = unused;
    options.deliver = unused; 

    return {
        sponsor: tart.pluggable(options),
        events: emitter
    };
};