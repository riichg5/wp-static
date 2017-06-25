let Redis = require('redis');
let redisConfig = _config.get('redis');


// Singleton for the process
let redis;

function redisConnector(request, response, next) {
    let context = request.context;
    let logger = context.logger;



    if (redis) {
        context.redisClient = redis;
        next(null);
        return;
    }

    logger.trace(
        'Creating redis client using config: %j',
        redisConfig
    );
    redis = Redis.createClient(redisConfig.port, redisConfig.host, redisConfig.options);
    redis.on('error', function (details) {
        logger.error('Got error event from redis: %j', details);
    });
    context.redisClient = redis;

    if (!redisConfig.password) {
        next(null);
        return;
    }

    logger.trace('auth redis, password: %s', redisConfig.password);
    redis.auth(redisConfig.password, function (error) {
        if (error) {
            next(error);
        }
        next(null);
    });
}

module.exports = redisConnector;
