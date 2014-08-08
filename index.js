'use strict';

module.exports = extendShould;
try {
    var should = require('should');
    extendShould(should);
} catch (e) {
}

function extendShould(should) {
    var Assertion = should.Assertion,
        AssertionError = should.AssertionError,
        inspect = require('util').inspect;

    function wrapAssertion(proxyObj, propName, storedAssertions) {
        var prop = { enumerable: true }
        
        var descriptor = Object.getOwnPropertyDescriptor(Assertion.prototype, propName);
        var isGetter = descriptor.hasOwnProperty('get');
        
        prop[isGetter ? 'get' : 'value'] = function () {
            var i = arguments.length, args = new Array(i);
            while (i--) { args[i] = arguments[i]; }
            
            var arr = [propName];
            if (!isGetter) { arr.push(args); }
            
            storedAssertions.push(arr);
            
            return this;
        }
        
        Object.defineProperty(proxyObj, propName, prop);
    };

    // transition from synchronous assertions to promise-based assertions
    Object.defineProperty(Assertion.prototype, 'eventually', {
        enumerable: true,
        get: function () {
            // .eventually should only be called on a thenable
            this.obj.then.should.be.a.Function;
            
            // this will hold any assertions that get chained to the object we return
            // so they may be called later, after the promise is resolved
            var storedAssertions = [ ],
                negate = !!this.negate,
                caught = false;
            
            // this function will kick off the new chain of assertions on the setttled
            // result of the promise
            var handle = function (resolved, val) {
                var should = (negate ?
                    (new Assertion(val)).not :
                    (new Assertion(val))
                )
                
                var result = storedAssertions.reduce(function (accum, cur) {
                    // 'throw' must immediately follow 'eventually' if it is used
                    if (cur[0] === 'throw') {
                        // should.throw is a special case; it expects a function
                        // that it will then call to discern whether an error was thrown
                        // or not, but we have a (potentially) rejected value of a promise,
                        // so we need to wrap that value in a function for should.throw to call
                        var obj = accum.obj;
                        accum.obj = function () {
                            if (resolved) { return obj; }
                            else { throw obj; }
                        };
                    }
                    
                    // this block is separated from the above intentionally;
                    // the above deals with putting the data in the expected format,
                    // while this deals with whether or not to throw an error
                    if (cur[0] === 'throw') {
                        // these conditions are acceptable:
                        // resolved === true && negate === true - promise succeeded, throw check is negated
                        // resolved === false && negate !== true - promise rejected, throw check is not negated
                        if (resolved === !!accum.negate) {
                            caught = true;
                        } else {
                            throw new AssertionError({
                                message: 'Expected promise to be ' + (negate ? 'rejected' : 'resolved') +
                                    ' but instead it was ' + (resolved ? 'resolved' : 'rejected') + ' with ' + inspect(val),
                                actual: val
                            });
                        }
                    }
                    
                    if (cur.length === 1) {
                        // assertion was a getter, apply to current value
                        return accum[cur[0]];
                    } else {
                        // assertion was a function, apply to current value
                        return accum[cur[0]].apply(accum, cur[1]);
                    }
                }, should); // call .should on our resolved value to begin the assertion chain
                
                if (!resolved && !caught) {
                    throw new AssertionError({
                        message: 'Promise was rejected unexpectedly with ' + inspect(val),
                        actual: val
                    });
                }
                return result;
            };

            // this will be an implicitly created promise of the same kind we
            // were called on, which we will use to enable us to run any
            // saved chained methods on the return value of this promise
            // before passing it to any further promise handlers
            var promise = this.obj.then(
                handle.bind(null, true),
                handle.bind(null, false)
            );
            
            // this will hold proxy functions to store any assertions
            // called on it for later use; its prototype is set to
            // the promise we are chaining to so that we can also
            // allow further promise methods to be chained instead
            // of assertions
            //var proxy = Object.create(promise);
            
            Object.getOwnPropertyNames(Assertion.prototype)
            .forEach(function (propName) {
                wrapAssertion(promise, propName, storedAssertions);
            });

            return promise;
        }
    });
};