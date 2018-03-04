
function context(defaults) {
    if (typeof defaults === 'undefined') {
        defaults = {};
    }

    if (typeof defaults !== 'object') {
        throw new Error('defaults needs to be a valid object');
    }

    // Return the middleware
    return function (request, response, next) {
        if (!request.context) {
            request.context = {
                content: []
            };
            request.context.logger = console;
            request.context.remoteIp = _utils.getClientIp(request);
            _logger.debug(`remoteIp: ${request.context.remoteIp}`);
        }

        // request.context.logger.debug(`remoteIp: ${request.context.remoteIp}`);
        next();
    };
}

module.exports = context;
