'use strict';

var packageData = require('../package.json');
var os = require('os');
var path = require('path');
var crypto = require('crypto');
var fs = require('fs');

// expose to the world
module.exports = function(options) {
    return new PickupTransport(options);
};

/**
 * <p>Generates a Transport object for Pickup with aws-sdk</p>
 *
 * <p>Possible options can be the following:</p>
 *
 * <ul>
 *     <li><b>accessKeyId</b> - AWS access key (optional)</li>
 *     <li><b>secretAccessKey</b> - AWS secret (optional)</li>
 *     <li><b>region</b> - optional region (defaults to <code>'us-east-1'</code>)
 * </ul>
 *
 * @constructor
 * @param {Object} optional config parameter for the AWS Pickup service
 */
function PickupTransport(options) {
    options = options || {};

    this.options = options;
    this.options.directory = options.directory || os.tmpdir();

    this.name = 'Pickup';
    this.version = packageData.version;
}

/**
 * <p>Compiles a mailcomposer message and forwards it to handler that sends it.</p>
 *
 * @param {Object} emailMessage MailComposer object
 * @param {Function} callback Callback function to run when the sending is completed
 */
PickupTransport.prototype.send = function(mail, callback) {
    // Pickup strips this header line by itself
    mail.message.keepBcc = true;

    var callbackSent = false;
    var filename = (((mail.message.getHeader('message-id') || '').replace(/[^a-z0-9\-_.@]/g, '') || crypto.randomBytes(10).toString('hex')) + '.eml');
    var target = path.join(this.options.directory, filename);
    var output = fs.createWriteStream(target);
    var input = mail.message.createReadStream();

    var _onError = function(err) {
        if (callbackSent) {
            return;
        }
        callbackSent = true;
        callback(err);
    };

    input.on('error', _onError);
    output.on('finish', function() {
        if (callbackSent) {
            return;
        }
        callbackSent = true;

        callback(null, {
            envelope: mail.data.envelope || mail.message.getEnvelope(),
            messageId: mail.message.getHeader('message-id'),
            path: target
        });
    });

    output.on('error', _onError);
    input.pipe(output);
};
