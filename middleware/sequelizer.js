let fs = require('fs');
let path = require('path');
let Sequelize = require('sequelize');

let createNamespace = require('cls-hooked').createNamespace;
let namespace = createNamespace('my session');
let clsBluebird = require('cls-bluebird');
clsBluebird(namespace);
let types = require('pg').types;

/**
 * Cache of global instances of Sequelize and their models
 */
let cache = Object.create(null);

/**
 * Add the global instance of Sequelize to the context, also exposed all
 * loaded models to context.models
 *
 * @method sequelize
 */
function sequelize(request, response, next) {
    let context = request.context;

    context.sequelize = cache.instance;
    context.models = cache.models;
    context.sequelize.namespace = namespace;

    next(null);
}

function convertType() {
    let integerParser = function(val) {
        return parseInt(val, 10);
    };

    types.setTypeParser(20, integerParser); // int8 /bigint 测试我们的应用场景 int够用
    types.setTypeParser(1021, parseFloat); // _float4
    types.setTypeParser(1700, parseFloat); // decimal
}

/**
 * Create  global Sequelize instances and import all predefined models.
 *
 * @method sequelizer
 * @param modelsDirectory {String} Canonical path to modules directory
 * @param config {Object} server configuration object.
 * @return {Function} an express middleware function
 */
function sequelizer(modelsDirectory, config, logger) {

    if (Object.keys(cache).length === 0) {
        let dbConfig = _config.get('database');
        let options;

        console.info(`database: %j`, dbConfig);
        options = _.clone(dbConfig.sequelize);
        options.protocol = dbConfig.protocol;
        options.host = dbConfig.host;
        options.port = dbConfig.port;
        options.isolationLevel = CONST.SEQUELIZE.READ_COMMITTED;

        Sequelize.cls = namespace;
        cache.instance = new Sequelize(
            dbConfig.name,
            dbConfig.username,
            dbConfig.password,
            options
        );
        cache.models = [];


        fs.readdirSync(modelsDirectory).forEach(function(filename) {
            /*jslint regexp: true */
            var match = /(\w+)\.js$/.exec(filename);

            if (match) {
                if (!_utils.inTestMode) {
                    console.info('Importing model: %s from: %s.', match[1], filename);
                }

                cache.models[match[1]] = cache.instance['import'](
                    path.join(modelsDirectory, filename)
                );
            }
        });
    }

    convertType();
    return sequelize;
}

module.exports = sequelizer;
