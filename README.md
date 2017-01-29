### Deprecated
should.js has promise support directly now, you should use it instead.

### Should-Eventually
---
Add chai-as-promised style 'eventually' verb to should.js assertions.

#### Why?
Because chai doesn't support all of should.js's methods in its 'should' interface, and should's 'promised' extension didn't behave how I wanted (and made the unfortunate choice of using 'finally')

#### How?
Just add `.eventually` in your assertion chain after a promise. Examples:

    Promise.resolve('foo').should.eventually.equal('foo');
    Promise.reject('bar').should.eventually.throw('bar');
    Promise.resolve('foo').should.not.eventually.throw();
    Promise.resolve('foo').should.eventually.not.throw();

The value returned from `.eventually` has the original promise as its prototype and inherits parasitically from `Assertion.prototype`. This means that you can chain either assertions or promise methods onto it. The test methods should also reflect whatever promise library you choose to use.

Behavior of methods chained before `.eventually` and after `.should` is undefined; these methods will be applied against the promise object itself, which serves little purpose. The `.not` method's negation is propagated, however, for more natural phrasing (as demonstrated above).

Methods chained after `.eventually` will be stored up and applied to the resolved or rejected value of the promise. These values are wrapped in a function when given to the `.throw` method so that its expected input is satisfied.

An expression with a rejected promise that is not caught with a `.throw` assertion will simply return a rejected promise. An expression with a resolved promise whose value fails its assertions will return a promise rejected with the error provided by should.js.

#### Install
    npm install --save-dev should-eventually

In your test scripts:

    require('should-eventually')

You may also inject the instance of 'should' to modify:

    var should = require('should');
    require('should-eventually')(should);

#### Test

    npm test

You may also run the latest should.js test suite with should-eventually loaded like so:

    npm run test-should

#### Troubleshoot

If you manage to require a separately-sourced copy of 'should' in your test script, it can overwrite the extended prototypes and cause this extension to fail. This may happen if you've installed the dev dependencies and are using `should-eventually` to instantiate `should` (non-injection pattern).
