var config = require('config');
console.info('start init config ...');
console.info('finish init config');
console.log('config NODE_ENV: ' + config.util.getEnv('NODE_ENV'));
module.exports = config;