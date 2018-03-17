let allowIps = _config.get('allowIps') || {};

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
            let remoteIp = _utils.getClientIp(request);
            request.context.remoteIp = remoteIp;
            _logger.debug(`remoteIp: ${remoteIp}`);

            // if(!allowIps[remoteIp]) {
            //     response.status(403).send('no access!');
            //     return;
            // }
        }

        // request.context.logger.debug(`remoteIp: ${request.context.remoteIp}`);
        next();
    };
}

module.exports = context;
