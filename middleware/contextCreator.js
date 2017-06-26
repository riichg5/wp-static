
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
        }

        next();
    };
}

module.exports = context;
