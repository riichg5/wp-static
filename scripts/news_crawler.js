require('../lib/init/init');
let request = require('request-promise');
let cheerio = require('cheerio');
let schedule = require('node-schedule');
let url = require('url');

let path = "/v1/admin/crawler/news";
let isProcess = false;


function reqNews () {
	_logger.debug("webAddress:", _config.get("webAddress"));
	let requestOpt = {
		method: 'POST',
	    uri: url.resolve(_config.get("webAddress"), path),
	    timeout: 10 * 60 * 1000 //10分钟
	};

	_logger.debug("start crawler.");

	return request(requestOpt).then(res => {
		_logger.debug("res:", _util.inspect(res));
		isProcess = false;
		_logger.debug("request success!");
    }).catch(error => {
		_logger.error("fail to request:", path , "error:", error);
		isProcess = false;
    });
}


function excute() {
	let job = schedule.scheduleJob('1 6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23 * * *', function() {
		if(isProcess) {
			_logger.debug("crawler is processing........do not excute again.");
			return;
		}
		isProcess = true;
		reqNews();
	});
}


excute();

// reqNews();