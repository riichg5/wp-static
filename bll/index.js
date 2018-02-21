let fs = require('fs');
let path = require('path');
let assert = require('assert');
let DirectoryNames = [];

function createBll(name, context) {
    _logger.debug("create bll:", name);
    assert(name && name.length > 0, 'name must be a non-empty string.');
    assert(typeof context === 'object', 'context must be a valid object.');

    if (exports[name]) {
        var bll = null;
        bll = new exports[name](context);
        return bll;
    }
    else {
        throw _utils.createError(`Cannot find bll: ${name}`);
    }
}

function loadDirectory(exports, directory) {
    fs.readdirSync(directory).forEach(function (filename) {
        var fullPath;
        var stat;
        var match;

        // Skip itself
        if (filename === 'index.js' || /^\./.test(filename)) {
            return;
        }

        fullPath = path.join(directory, filename);
        stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            DirectoryNames.push(filename);
            return;
        } else {
            match = /(\w+)\.js$/.exec(filename);

            if (match) {
                exports.__defineGetter__(match[1], function () {

                    let tmp = null;
                    try{
                        tmp = require(fullPath);
                    }catch(err){
                        console.error(err);
                    }
                    return tmp;

                });

                //auto export createDao method
                exports['create' + match[1]] = function (context) {
                    return createBll(match[1], context);
                };
            }
        }
    });

    return exports;
}

loadDirectory(exports, __dirname);
exports.createBll = createBll;