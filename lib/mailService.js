/**
 * mail service
 */

var request = require('request');

function prepareRequestOptions(context, mailType, mailData) {
    var mailServiceConfig = _config.get("mailService");
    var url = mailServiceConfig.serverAddress + '/v1/emails/' + mailType;
    var clientId = mailServiceConfig.clientId;
    var timeout = mailServiceConfig.timeout;
    var logger = context.logger;
    var companyCode = mailServiceConfig.companyCode || context.companyCode ;
    var countryISO = context.countryISO || "";
    var requestOptions;

        if(!companyCode){
            logger.warn('x-company-code is required!');
        }

    requestOptions = {
        method : 'POST',
        headers : {
            Accept : 'application/json',
            'Accept-Language' : 'en-US',
            'Content-Type' : 'application/json',
            'User-Agent' : 'mobile-pulse/2.0.0',
            'X-Client-Id' : clientId,
            'X-Company-Code' : companyCode,
            'X-Country-ISO' : countryISO
        },
        url : url,
        timeout : timeout,
        json : mailData
    };

    return requestOptions;
}

exports.sendMail = function (context, mailType, mailData, callback) {
    var logger = context.logger,
        requestOptions = prepareRequestOptions(context, mailType, mailData);

    logger.debug('Sending mail of type %s with data %j', mailType, mailData);
    request(requestOptions, function (error, response, body) {
        if (error) {
            logger.error(
                'Error when sending mail of type %s: %s',
                mailType,
                (error && error.message)
            );
        }
    });

    if (callback) {
        callback();
    }
};
