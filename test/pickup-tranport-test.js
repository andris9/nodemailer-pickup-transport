'use strict';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var chai = require('chai');
var expect = chai.expect;
var pickupTransport = require('../src/pickup-transport');
chai.Assertion.includeStack = true;
var crypto = require('crypto');
var fs = require('fs');

var randomBytes = crypto.randomBytes(20).toString('hex');

function MockBuilder(envelope, message) {
    this.envelope = envelope;
    this.message = new(require('stream').PassThrough)();
    this.message.end(message);
}

MockBuilder.prototype.getEnvelope = function() {
    return this.envelope;
};

MockBuilder.prototype.createReadStream = function() {
    return this.message;
};

MockBuilder.prototype.getHeader = function() {
    return randomBytes;
};

describe('Pickup Transport Tests', function() {
    it('Should expose version number', function() {
        var client = pickupTransport();
        expect(client.name).to.exist;
        expect(client.version).to.exist;
    });

    it('Should send message', function(done) {
        var client = pickupTransport();

        client.send({
            data: {},
            message: new MockBuilder({
                from: 'test@valid.sender',
                to: 'test@valid.recipient'
            }, 'message')
        }, function(err, data) {
            expect(err).to.not.exist;
            expect(data.messageId).to.equal(randomBytes);
            expect(data.path).to.contain(randomBytes + '.eml');

            fs.unlink(data.path, done);
        });
    });
});