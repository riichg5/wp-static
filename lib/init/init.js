global._base = __dirname + '/../../';

global.Promise = require('bluebird');
// if (process.env.NODE_ENV !== 'production') {
//     Promise.config({
//         longStackTraces: true
//     });
//     Promise.longStackTraces();
// }


// Constants
global._ = require('lodash');

global._config = require('./init_config');
let configGet = _config.get.bind(_config);
_config.get = function (nodeName) {
	if(_config.has(nodeName)) {
		return configGet(nodeName);
	}
	return undefined;
};
global._logger = require('./init_logger');
global._utils = require(_base + 'lib/utils');
global._util = require('util');
global._co = require('co');
