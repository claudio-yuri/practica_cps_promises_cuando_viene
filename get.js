//"use strict";

var Client = require('node-rest-client').Client;

var client = new Client();


module.exports = function (url, args, timeout, callbackError, callbackOk) {
    var isTimedOut;

    setTimeout(function () {
        isTimedOut = true;
        callbackError(new Error("Connection timed out"));
        return;
    }, timeout);

    client.get(url, args, function (data, response) {
        if (isTimedOut) {
            return;
        }

        callbackOk(data, response);
        return;
    });
};
