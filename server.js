/**
 * Organo Mobile Web Service, a.k.a Pulse
 */

require('./lib/init/init');
global.SERVER_SHUT_DOWN = false;
let MIDDLEWARE_LOCATION = './middleware';
let HANDLERS_LOCATION = './handlers';
let DEFAULT_PORT = 8080;

let fs = require('fs');
let path = require('path');
let http = require('http');
var partials = require('express-partials');
var bunyan = require('bunyan');

let express = require('express');
let middleware, handlers, app;

try {
    console.info('Starting server worker process.');
    middleware = require(MIDDLEWARE_LOCATION);
    handlers = require(HANDLERS_LOCATION);

    let rootLogger = bunyan.createLogger({
        name: _config.get('appName'),
        level: _config.get('log.level'),
        pid: process.pid,
    });

    console.error = rootLogger.error.bind(rootLogger);
    console.warn = rootLogger.warn.bind(rootLogger);
    console.info = rootLogger.info.bind(rootLogger);
    console.trace = rootLogger.trace.bind(rootLogger);

    rootLogger.info('Starting server worker process.');

    app = express();
    app.enable('trust proxy');
    app.set('json spaces', 2);

    require(_base + 'routers/')(app, middleware, handlers);

    let appServer = app.listen(_config.get('port') || DEFAULT_PORT, function() {
        console.info('Express 4.0 server listening on port ' + appServer.address().port);
    });
} catch (error) {
    console.error('Failed to start the server: %s', error.stack);
}

process.once('SIGUSR2', function (sig) {
    console.log("start to close http server.");
    SERVER_SHUT_DOWN = true;
    setTimeout(x => {
        // 15000ms later the process kill it self to allow a restart
        console.log("worker closed.");
        process.exit(0);
    }, 15000);
    console.log("receive system shutdown");
});

module.exports = app;