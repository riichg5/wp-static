let util = require('util');
let moment = require('moment');

// Constants
var DEFAULT_IMAGE_URL = '/images/nopic_mini.jpg';
var IMAGE_URL_PREFIX = '/upload/avatar/';

module.exports = {
    inTestMode: process.env.NODE_ENV === 'test',
    inDevMode: process.env.NODE_ENV === 'development',
    inProdMode: process.env.NODE_ENV === 'production',

    //handler must be generator!
    coEach: (opts) => {
        let mapArr, start, totalLength;
        let results = [];
        let MAX_CONCURRENT = 2000;
        let collection = opts.collection;
        let handler = opts.func;
        let limit = opts.limit;

        if(!Array.isArray(collection)) {
            throw new Error('argument "collection" should be Array');
        }
        if(typeof handler !== 'function') {
            throw new Error('argument "func" should be function');
        }
        //not a number or negative
        if (!Number.isSafeInteger(limit) || limit < 0) {
            limit = 0;
        }
        //set max concurrent
        if(limit > MAX_CONCURRENT) {
            limit = MAX_CONCURRENT;
        }
        //set max concurrent if collection's length is very large and limit is not set
        totalLength = collection.length;
        if(totalLength && limit === 0) {
            limit = MAX_CONCURRENT;
        }

        return _co(function *() {
            let res;
            for(start=0; start<totalLength; ) {
                mapArr = collection.slice(start, start+limit);
                start += limit;

                res = yield mapArr.map(elem => {
                    return _co(handler(elem));
                });
                results = results.concat(res);
            }

            return results;
        });
    },

    getClientIp: (request) => {
        let clientIp = "";

        let forwardedIpsStr = request.header('x-forwarded-for');
        if (forwardedIpsStr) {
            let forwardedIps = forwardedIpsStr.split(',');
            clientIp = forwardedIps[0];
        }
        else {
            clientIp = request.ip || '';
        }

        clientIp = clientIp.replace('::ffff:', '');
        clientIp = clientIp.replace('::1', '127.0.0.1');
        return clientIp;
    }
};
