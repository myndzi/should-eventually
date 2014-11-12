var should = require('../')();

var Promise = require('bluebird');
describe('Should - Eventually', function () {
    it('should attach assertion methods to the input promise, but return the promise itself', function () {
        var result = Promise.resolve(1).should.eventually.be.ok;
        Promise.is(result).should.equal(true);
        return result;
    });
    it('should allow assertions', function () {
        return Promise.resolve(1).should.eventually.equal(1);
    });
    it('should allow negative assertions', function () {
        return Promise.resolve(1).should.eventually.not.equal(2);
    });
    it('should propagate negated assertions', function () {
        return Promise.resolve(1).should.not.eventually.equal(2);
    });
    it('should support .throw', function () {
        return Promise.reject(1).should.eventually.throw(1);
    });
    it('should support negated .throw', function () {
        return Promise.resolve(1).should.eventually.not.throw();
    });
    it('should support propagated negated .throw', function () {
        return Promise.resolve(1).should.not.eventually.throw();
    });
    it('should reject with the original rejection error if not caught', function () {
        return Promise.try(function () {
            return Promise.reject(3).should.eventually.be.an.Array;
        }).catch(function (e) {
            e.should.equal(3);
        });
    });
    it('should support empty resolved values', function () {
        return Promise.resolve().should.not.eventually.throw(/Expected promise to be resolved/);
    });
    it('should support empty rejected values', function () {
        return Promise.reject().should.eventually.throw();
    });
    it('should allow a chain of methods just like a synchronous value', function () {
        return Promise.resolve({foo: 1}).should.eventually.be.an.Object.and.have.property('foo').equal(1);
    });
    it('should reject with an AssertionError if chained assertions fail', function () {
        return Promise.resolve('foo').should.eventually.equal('bar')
        .catch(function (err) {
            err.should.be.an.instanceOf(should.AssertionError);
        });
    });
    it('should fail when not used on a promise', function () {
        (function () {
            return 'abc'.should.eventually.be('abc');
        }).should.throw();
    });
    it('should propagate a rejection if no .throw handler catches it', function () {
        var errval = new Error();
        return Promise.reject(errval).should.eventually.be.ok.then(function () {
            throw 'Expected a rejection';
        }).catch(function (err) {
            // behaved as expected
        });
    });
});
