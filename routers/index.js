var express = require('express');
var fs = require('fs');

function loadDirectory(directory, app, router, middleware, handlers) {
    fs.readdirSync(directory).forEach(function (filename) {
        var fullPath;
        var stat;
        var match;

        if (filename === 'index.js' || /^\./.test(filename)) {
            return;
        }

        fullPath = directory + '/' +  filename;
        stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            loadDirectory(fullPath, app, router, middleware, handlers);
        } else {
            match = /(\w+)\.js$/.exec(filename);
            if (match) {
                return require(fullPath)(app, router, middleware, handlers);
            }
        }
    });
}

function registRouter (app, middleware, handlers) {
    fs.readdirSync(__dirname).forEach(function (filename) {
        var fullPath;
        var stat;

        fullPath = __dirname + '/' +  filename;
        stat = fs.statSync(fullPath);
        var router = express.Router();
        if (stat.isDirectory()) {
            var prefix = `/${filename}`;
            app.use(prefix, router);
            loadDirectory(fullPath, app, router, middleware, handlers);
        } else {
            if (filename === 'index.js' || /^\./.test(filename)) {
                return;
            }

            app.use('', router);
            let match = /(\w+)\.js$/.exec(filename);
            if (match) {
                return require(fullPath)(app, router, middleware, handlers);
            }
        }
    });
    // loadDirectory(__dirname, server, null, middleware, handlers);
}

module.exports = registRouter;