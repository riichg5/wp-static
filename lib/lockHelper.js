let utils = require('./utils');

/**
* Aquire a lock with the specified name.
* @param {Object} options
*   options:
*       context {Object}
*       name {String} the key of lock
*       timeout {Number}  timeout seconds of redis key
* @param {Function} callback
* @retrun {undefined}
*/
function lock(options, callback) {
    let context = options.context;
    let name = options.name;
    let timeout = options.timeout ? options.timeout : 10;
    let logger = context.logger || console;
    let redisClient = context.redisClient;
    let error;

    if (!name) {
        error = utils.createError('lock name is required.', 400);
        callback(null, false);
        return;
    }

    if (!redisClient) {
        error = utils.createError("Failed to lock '" + name + "'. Lock service not available.", 400);
        callback(null, false);
        return;
    }

    logger.trace("Locking '%s'", options.name);
    redisClient.setnx(name, true, function (error, succeeded) {
        if (error) {
            logger.trace("Unable to lock '%s': %s", name, error.message || error);
            callback(null, false);
            return;
        }

        if (!succeeded) {
            logger.trace("Unable to lock '%s': Already locked by others.", name);
            callback(null, false);
            return;
        }

        logger.trace("'%s' has been locked successfully.", name);
        redisClient.expire(name, timeout, function () {
            callback(null, true);
        });
    });
}

/**
 * Unlock a lock with the specified name.
 * @method unlock
 * @param context {Object}
 * @param name {String} name of the lock.
 */
// exports.unlock = function (context, name, callback) {
function unlock (options, callback) {
    let context = options.context;
    let name = options.name;
    let logger = context.logger;
    let redisClient = context.redisClient;
    let error;

    if (!name) {
        callback();
        return;
    }

    if (!redisClient) {
        error = utils.createError(
            "Failed to unlock '" + name + "'. Lock service not available.",
            400
        );
        callback(null);
        return;
    }

    logger.trace("Unlocking '%s'", name);
    redisClient.del(name, function (error) {
        if (error) {
            logger.trace("Unable to unlock '%s': %s", name, error.message || error);
            callback();
            return;
        }

        logger.trace("'%s' has been unlocked successfully.", name);
        callback();
    });
}


let helper = {
    lock: lock,
    unlock: unlock,
    pLock: _util.promisify(lock),
    pUnlock: _util.promisify(unlock)
};

module.exports = helper;

