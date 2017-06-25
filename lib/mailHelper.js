/**
 * mail helper
 */
'use strict';
var u = require('underscore');
var async = require('async');
var moment = require('moment');
var daos = require('../daos');
var mailService = require('./mailService');
var emailService = require('./emailService');


function capitalizeName(firstName, lastName){
    var arr = [firstName, lastName];
    return arr.map(function(item){
        item = item || '';
        return _str.capitalize(item.trim(), true);
    }).join(' ');

}

var emailSubjects = {
    'RIC':{
        'registrations/distributors':{
            'MX':'Detalles de Acceso a Ricolife',
            'default':'Your Ricolife Access Details'
        },
        'registrations/distributors/sponsors':{
            'MX':'Nuevo Registro de Socio de Marca',
            'default':'New Brand Partner Registration'
        },
        'registrations/retail-customers':{
            'MX':'Detalles de Acceso a Ricolife',
            'default':'Your Ricolife Access Details'
        },
        'registrations/retail-customers/sponsors':{
            'MX':'Nuevo Registro de Cliente',
            'default':'New Client Registration'
        },
        'orders/confirmations':{
            'MX':'Tu Orden de Ricolife.com',
            'default':'Your Order with Ricolife.com'
        }

    },
    'VBN':{
       'registrations/distributors':{
            'default':'Willkommen bei VABO-N!'
        },
        'registrations/distributors/sponsors':{
            'default':'VABO-N gratuliert zum neuen Affiliate!'
        },
        'registrations/retail-customers':{
            'default':'Willkommen bei VABO-N!'
        },
        'registrations/retail-customers/sponsors':{
            'default':'VABO-N gratuliert zum neuen Kunden!'
        },
        'payments/confirmations':{
            'default': 'SEPA-Lastschrift Zahlungsaufforderung'
        },
        'registrations/distributor-unilevel':{
            'default': 'VABO-N gratuliert zum neuen Affiliate!'
        },
        'registrations/retail-unilevel':{
            'default': 'VABO-N gratuliert zum neuen Kunden!'
        }
    }
};

function getEmailSubject(context, action, defaultValue){
    var companyCode = context.companyCode;
    var countryISO = context.countryISO;

    var companySetting = emailSubjects[companyCode];
    if(!companySetting){
        return defaultValue;
    }

    var actionSetting = companySetting[action];
    if(!actionSetting){
        return defaultValue;
    }

    if(actionSetting[countryISO]){
        return actionSetting[countryISO];
    }

    if(actionSetting['default']){
        return actionSetting['default'];
    }

    return defaultValue;

}

function getDistributorRegistrationUserEmailData(context, distributor, callback) {
    var logger = context.logger;
    var userDao = daos.createDao('User', context);
    var addressDao = daos.createDao('Address', context);
    var distributorDao = daos.createDao('Distributor', context);
    var userOfSponsor;
    var mailData = {};

    logger.debug('Preparing distributor registration user email data...');

    // mailData['email-subject'] = 'Registration Notice';
    async.waterfall([
        function(callback) {
            userDao.getById(distributor.user_id, callback);
        },

        function(user, callback) {
            mailData['recipient-email'] = user.email;

            mailData.distributor = {};
            mailData.distributor['login-name'] = user.login;
            mailData.distributor['entry-date'] = user.entry_date;

            userDao.getHomeAddressOfUser(user, callback);
        },

        function(address, callback){
            addressDao.fillCountryAndStateOfAddress(address, function(error){
                if(error){
                    callback(error);
                    return;
                }
                context.countryISO = address.country ? address.country.iso : null;
                callback(null, address);
            });
        },

        function(address, next) {
            mailData.distributor.id = distributor.id;
            mailData.distributor['first-name'] = address.firstname;
            mailData.distributor['last-name'] = address.lastname;
            mailData.distributor.address = {
                street : address.address1,
                city : address.city,
                zip : address.zipcode,
                state : address.state_name || '',
                country : address.country_name || ''
            };

            if (!distributor.personal_sponsor_distributor_id) {
                callback(null, mailData);
                return;
            }

            distributorDao.getById(distributor.personal_sponsor_distributor_id, next);
        },

        function(sponsor, callback) {
            userDao.getById(sponsor.user_id, callback);
        },

        function(result, callback) {
            userOfSponsor = result;
            userDao.getHomeAddressOfUser(userOfSponsor, callback);
        },
        function(addressOfSponsor, callback) {
            mailData.sponsor = {
                id: distributor.personal_sponsor_distributor_id,
                email: userOfSponsor.email,
                'first-name': addressOfSponsor.firstname,
                'last-name': addressOfSponsor.lastname,
                phone: addressOfSponsor.phone
            };

            callback(null, mailData);
        }

    ], callback);
}


function sendDistributorRegistrationUserEmail(options, callback) {
    var context = options.context;
    var distributor = options.distributor;
    var emailAction = options.emailAction;
    var emailSubject = options.emailSubject;
    var logger = context.logger;

    logger.debug('Sending distributor registration user email...');
    async.waterfall([
        function(callback) {
            getDistributorRegistrationUserEmailData(context, distributor, callback);
        },

        function(mailData, callback) {
            logger.debug('mailData for distributor:', mailData);
            let address = mailData.distributor.address || {};
            let keyMap = {
                distributorId:mailData.distributor.id,
                distributorFullname: capitalizeName(mailData.distributor['first-name'], mailData.distributor['last-name']),
                distributorLoginname: mailData.distributor['login-name'],
                distributorAddress:[
                    address.street,
                    address.city,
                    address['state-name'],
                    address.zip,
                    address['country-name']
                ].join(', '),
                sponsorFullname: capitalizeName(mailData.sponsor['first-name'], mailData.sponsor['last-name']),
                sponsorId: mailData.sponsor.id,
                sponsorPhone: mailData.sponsor.phone || '',
                sponsorEmail: mailData.sponsor.email || '',
                entryDate: mailData.distributor['entry-date']
            };


            emailService.sendEmail({
                context: context,
                params: {
                    keyMap:keyMap,
                    'typeCode': 'registration_distributor',
                    'mailTo': mailData['recipient-email'],
                    'note': 'Distributor:'+ mailData.distributor.id,
                }
            }).finally(callback);
        }
        // function(mailData, callback) {
        //     mailData['email-subject'] = getEmailSubject(context, emailAction, emailSubject);
        //     mailService.sendMail(context, emailAction, mailData, function(error) {
        //         if (error) {
        //             logger.error('Failed to send distributor registration user email: %s', error.message);
        //         }
        //         callback();
        //     });
        // }
    ], callback);
}


function getRetailCustomerRegistrationUserEmailData(context, distributor, callback) {
    var logger = context.logger;
    var userDao = daos.createDao('User', context);
    var distributorDao = daos.createDao('Distributor', context);
    var addressDao = daos.createDao('Address', context);
    var userOfSponsor;
    var mailData = {};

    logger.debug('Preparing retail customer registration user email data...');

    mailData['email-subject'] = 'Registration Notice';
    async.waterfall([
        function(callback) {
            userDao.getById(distributor.user_id, callback);
        },

        function(user, callback) {

            mailData['recipient-email'] = user.email;
            mailData['retail-customer'] = {};
            mailData['retail-customer'].id = distributor.id;
            mailData['retail-customer']['login-name'] = user.login;
            mailData['retail-customer']['entry-date'] = user.entry_date;

            userDao.getHomeAddressOfUser(user, callback);
        },

        function(address, callback){
            addressDao.fillCountryAndStateOfAddress(address, function(error){
                if(error){
                    callback(error);
                    return;
                }
                context.countryISO = address.country ? address.country.iso : null;
                callback(null, address);
            });
        },
        function(address, next) {

            mailData['retail-customer']['first-name'] = address.firstname;
            mailData['retail-customer']['last-name'] = address.lastname;
            mailData['retail-customer']['address'] = {
                street : address.address1,
                city : address.city,
                zip : address.zipcode,
                state : address.state_name || '',
                country : address.country_name || ''
            };
            if (!distributor.personal_sponsor_distributor_id) {
                mailData.sponsor = {};
                callback(null, mailData);
                return;
            }

            distributorDao.getById(distributor.personal_sponsor_distributor_id, next);
        },

        function(sponsor, callback) {
            userDao.getById(sponsor.user_id, callback);
        },

        function(result, callback) {
            userOfSponsor = result;
            userDao.getHomeAddressOfUser(userOfSponsor, callback);
        },
        function(addressOfSponsor, callback) {

            mailData.sponsor = {
                id: distributor.personal_sponsor_distributor_id,
                email: userOfSponsor.email,
                'first-name': addressOfSponsor.firstname,
                'last-name': addressOfSponsor.lastname,
                phone: addressOfSponsor.phone
            };


            callback(null, mailData);
        }

    ], callback);
}


function sendRetailCustomerRegistrationUserEmail(context, distributor, callback) {
    var logger = context.logger;
    var emailAction = 'registrations/retail-customers';

    logger.debug('Sending retail customer registration user email...');
    async.waterfall([
        function(callback) {
            getRetailCustomerRegistrationUserEmailData(context, distributor, callback);
        },
        function(mailData, callback) {
            logger.debug('mailData for customer:', mailData);
            if(_.isEmpty(mailData.sponsor)){
                mailData.sponsor = {};
            }
            let address = mailData['retail-customer'].address || {};
            let keyMap = {
                distributorId:mailData['retail-customer'].id,
                distributorFullname: capitalizeName(mailData['retail-customer']['first-name'], mailData['retail-customer']['last-name']),
                distributorLoginname: mailData['retail-customer']['login-name'],
                distributorAddress:[
                    address.street,
                    address.city,
                    address['state-name'],
                    address.zip,
                    address['country-name']
                ].join(', '),
                sponsorFullname: capitalizeName(mailData.sponsor['first-name'], mailData.sponsor['last-name']),
                sponsorId: mailData.sponsor.id ||  '',
                sponsorPhone: mailData.sponsor.phone || '',
                sponsorEmail: mailData.sponsor.email || '',
                entryDate: mailData['retail-customer']['entry-date']
            };

            emailService.sendEmail({
                context: context,
                params: {
                    keyMap:keyMap,
                    'typeCode': 'registration_customer',
                    'mailTo': mailData['recipient-email'],
                    'note': 'Customer:'+ mailData['retail-customer'].id,
                }
            }).finally(callback);
        }

        // function(mailData, callback) {
        //     mailData['email-subject'] = getEmailSubject(context, emailAction, mailData['email-subject']);
        //     mailService.sendMail(context, emailAction, mailData, function(error) {
        //         if (error) {
        //             logger.error('Failed to send retail customer registration user email: %s', error.message);
        //         }
        //         callback();
        //     });
        // }
    ], callback);
}


function getRegistrationSponsorEmailData(context, distributor, callback) {
    var logger = context.logger;
    var userDao = daos.createDao('User', context);
    var distributorDao = daos.createDao('Distributor', context);
    var addressDao = daos.createDao('Address', context);
    var user;
    var sponsor;
    var mailData = {};

    logger.debug('Preparing registration sponsor email data...');


    // mailData['email-subject'] = 'New Registration Notice';

    async.waterfall([

        function(callback) {
            userDao.getById(distributor.user_id, callback);
        },

        function(result, callback) {
            user = result;
            userDao.getHomeAddressOfUser(user, callback);
        },

        function(address, next) {
            mailData.distributor = {
                id: distributor.id,
                'entry-date': moment(user.entry_date).format('YYYY-MM-DD'),
                'first-name': address.firstname,
                'last-name': address.lastname,
                'dualteam-position': distributor.dualteam_current_position,
                phone: address.phone,
                email: user.email
            };

            if (!distributor.personal_sponsor_distributor_id) {
                callback(null, mailData);
                return;
            }

            distributorDao.getById(distributor.personal_sponsor_distributor_id, next);
        },

        function(result, callback) {
            sponsor = result;
            userDao.getById(sponsor.user_id, callback);
        },

        function(userOfSponsor, callback) {
            sponsor.user = userOfSponsor;
            mailData['recipient-email'] = userOfSponsor.email;

            userDao.getHomeAddressOfUser(userOfSponsor, callback);
        },
        function(address, callback){
            addressDao.getCountryOfAddress(address, function(error, country){
                if(error){
                    callback(error);
                    return;
                }
                context.countryISO = country.iso;
                callback(null, address);
            });
        },
        function(addressOfSponsor, callback) {
            mailData.sponsor = {
                id: sponsor.id,
                'first-name': addressOfSponsor.firstname,
                'last-name': addressOfSponsor.lastname,
                phone: addressOfSponsor.phone,
                email: sponsor.user.email
            };

            callback(null, mailData);
        }

    ], callback);
}

function sendRegistrationSponsorEmail(options, callback) {
    var context  = options.context;
    var logger = context.logger;
    var distributor = options.distributor;
    var emailAction = options.emailAction;
    var emailSubject = options.emailSubject;
    var bcc = options.bcc;

    if (!distributor.personal_sponsor_distributor_id) {
        callback();
        return;
    }


    logger.debug('Sending registration sponsor email ...', emailAction);
    async.waterfall([
        function(callback) {
            getRegistrationSponsorEmailData(context, distributor, callback);
        },
        function(mailData, callback) {
            logger.debug('mailData for sponsor:', mailData);
            let address = mailData.distributor.address || {};
            let keyMap = {
                distributorId:mailData.distributor.id,
                distributorFullname: capitalizeName(mailData.distributor['first-name'], mailData.distributor['last-name']),
                distributorLoginname: mailData.distributor['login-name'],
                distributorPhone: mailData.distributor.phone,
                distributorEmail: mailData.distributor.email,
                dualteamPlacement:  mailData.distributor['dualteam-position'],
                distributorAddress:[
                    address.street,
                    address.city,
                    address['state-name'],
                    address.zip,
                    address['country-name']
                ].join(', '),
                sponsorFullname: capitalizeName(mailData.sponsor['first-name'], mailData.sponsor['last-name']),
                sponsorId: mailData.sponsor.id || '',
                sponsorPhone: mailData.sponsor.phone || '',
                sponsorEmail: mailData.sponsor.email || '',
                entryDate: mailData.distributor['entry-date']
            };

            let typeCode = 'registration_customer_sponsor';
            if(emailAction === 'registrations/distributors/sponsors'){
                typeCode = 'registration_distributor_sponsor';
            }


            emailService.sendEmail({
                context: context,
                params: {
                    keyMap:keyMap,
                    'typeCode': typeCode,
                    'mailTo': mailData['recipient-email'],
                    'note': 'Distributor:'+ mailData.distributor.id + ' Sponsor:'+mailData.sponsor.id,
                }
            }).finally(callback);
        }


        // function(mailData, callback) {
        //     mailData['email-subject'] = getEmailSubject(context, emailAction, emailSubject);
        //     if(bcc){
        //         mailData['recipient-email'] = undefined;
        //         mailData.bcc = bcc;
        //     }
        //     mailService.sendMail(context, emailAction, mailData, function(error) {
        //         if (error) {
        //             logger.error('Failed to send registration sponsor email: %s', error.message);
        //         }
        //         callback();
        //     });
        // }
    ], callback);
}

function sendDistributorRegistrationEmail(context, distributor, callback) {
    async.waterfall([
        function(callback) {
            sendDistributorRegistrationUserEmail({
                context: context,
                distributor: distributor,
                emailAction: 'registrations/distributors',
                emailSubject: 'Registration Notice'
            }, callback);
        },

        function(callback) {

            sendRegistrationSponsorEmail({
                    context: context,
                    distributor: distributor,
                    emailAction: 'registrations/distributors/sponsors',
                    emailSubject: 'New Registration Notice'
                }, callback);
        }
    ], callback);
}


function sendRetailCustomerRegistrationEmail(context, distributor, callback) {
    async.waterfall([
        function(callback) {
            sendRetailCustomerRegistrationUserEmail(context, distributor, callback);
        },

        function(callback) {
            if(distributor.personal_sponsor_distributor_id){
                sendRegistrationSponsorEmail({
                    context: context,
                    distributor: distributor,
                    emailAction: 'registrations/retail-customers/sponsors',
                    emailSubject: 'New Registration Notice'
                }, callback);
                return;
            }
            callback();

        }
    ], callback);
}

function sendFreeCustomerRegistrationEmail(context, distributor, callback) {
    var logger = context.logger;

    logger.debug('Sending free customer registration user email...');
    async.waterfall([
        function(callback) {
            getRetailCustomerRegistrationUserEmailData(context, distributor, callback);
        },

        function(mailData, callback) {
            mailService.sendMail(context, 'registrations/free-customers', mailData, function(error) {
                if (error) {
                    logger.error('Failed to send free customer registration user email: %s', error.message);
                }
                callback();
            });
        }
    ], callback);
}

function sendUpgradeToDistributorEmail(context, distributor, callback) {
    async.waterfall([
        function(callback) {
            sendDistributorRegistrationUserEmail({
                context: context,
                distributor: distributor,
                emailAction: 'registrations/upgrade-to-distributor',
                emailSubject: 'Upgrade confirmation'
            }, callback);
        },

        function(callback) {
            sendRegistrationSponsorEmail({
                    context: context,
                    distributor: distributor,
                    emailAction: 'registrations/upgrade-to-distributor/sponsors',
                    emailSubject: 'Upgrade confirmation'
                }, callback);
        }
    ], callback);
}

function notifyUnilevelGroupForRegistration(options, callback){
    var context = options.context;
    var distributor = options.distributor;
    var distributorDao = daos.createDao('Distributor', context);
    var emailAction = 'registrations/distributor-unilevel';



    async.waterfall([
        function(callback){
            distributorDao.getRoleCodeOfDistrbutor({
                distributor_id:distributor.id
            }, callback);
        },
        function(roleCode, callback){
            if(roleCode === CONST.ROLE_CODE_R){
                emailAction = 'registrations/retail-unilevel';
            }
            callback();
        },
        function(callback) {
            distributorDao.getUnilevelSponsors({
                distributorId: distributor.id,
                sponsorId: distributor.personal_sponsor_distributor_id
            }, function(error, sponsors){
                if(error){
                    callback(error);
                    return;
                }
                callback(null, u.pluck(sponsors, 'email'));
            });
        },

        function(emails, callback) {
            console.log('send to sponsors:', emails);
            if(!u.isArray(emails) || u.isEmpty(emails)){
                callback(null, null);
                return;
            }
            sendRegistrationSponsorEmail({
                    context: context,
                    distributor: distributor,
                    emailAction:  emailAction,
                    emailSubject: 'New Registration Notice',
                    bcc: emails
                }, callback);
        }
    ], callback);
}

function sendResetPasswordTokenEmail(options, callback) {
    var context = options.context,
        logger = context.logger,
        config = context.config || {},
        application = config.application || {},
        resetPasswordURLTmp = application.resetPasswordURLTemplate || '/reset-password?token={TOKEN}',
        login = options.login,
        token = options.token,
        email = options.email;

    let keyMap = {
        'userLogin': login,
        'resetPasswordUrl': _config.get("websiteUrl") + resetPasswordURLTmp.replace('{TOKEN}', token)
    };


    emailService.sendEmail({
        context: context,
        params: {
            keyMap:keyMap,
            'typeCode': 'reset_password',
            'mailTo': email,
            'note': 'ResetPassword:'+ login,
        }
    }).finally(callback);
}

function sendCouponEmail(options, callback){
    var context = options.context,
        logger = context.logger,
        coupon = options.coupon || {},
        couponCode = options.couponCode,
        recipientEmails = options.recipientEmails,
        mailData = {};

    if (!callback) {
        callback = function() {};
    }

    logger.debug("Sending email of coupon code:%s", couponCode);

    async.waterfall([

        function(callback) {
            logger.debug("Preparing mail data...");

            /*
            {
    "email-subject":  "Become Beauty Discount Coupon",
    "recipient-email":  "test@test.com",
    "coupon-code"  :  "G00004791363",
    "discount"  :  "20%",
    "number-of-products-allowed"  :  16,
    "minimum-purchase-price"  :  5.00,
    "maximum-purchase-price"  :  1629.24,
    "expiration-date"  :  "2014-08-21",
    "description"  :  "ooxx"
}
            */

            if(u.isString(coupon.rules)){
                coupon.rules = JSON.parse(coupon.rules);
            }

            if(!u.isObject(coupon.rules)){
                coupon.rules = {};
            }

            mailData['email-subject'] = 'Coupon';
            mailData['recipient-emails'] = recipientEmails;
            mailData['coupon-code'] = coupon.code || '';
            mailData['image-url'] = coupon.image_url || '';
            mailData.description = coupon.description || '';
            mailData.details = {};
            mailData.details['expiration-date'] = coupon.expired_at;
            mailData.details['number-of-products-allowed'] = coupon.rules.total_units_allowed || '';
            mailData.details['minimum-purchase-price'] = '$' + coupon.rules.minimal_accumulated_order_total || '';
            mailData.details['maximum-purchase-price'] = '$' + coupon.rules.maximal_accumulated_order_total || '';

            if(coupon.rules.operation === 'percent_off'){
                mailData.details.discount =  coupon.rules.operation_amount + '%';
            }else{
                 mailData.details.discount =  '$' + coupon.rules.operation_amount ;
            }

            callback();
        },



        function(callback) {
            mailService.sendMail(context, 'coupons', mailData, function(error) {
                if (error) {
                    logger.error("Failed to send coupon email: %s", error.message);
                }
                callback();
            });
        }
    ], callback);

}


function sendGiftCardEmail(context, giftCard, variant, callback) {
    if (!callback) {
        callback = function() {};
    }

    if (!giftCard.active) {
        callback();
        return;
    }
    var config = context.config;
    var logger = context.logger,
        mailData = {};

    logger.debug("Sending gift card email of gift card %d", giftCard.id);

    async.waterfall([

        function(callback) {
            logger.debug("Preparing mail data...");

            mailData['email-subject'] = 'Gift Card';
            mailData.number = giftCard.code;
            mailData.pin = giftCard.pin;
            mailData.amount = giftCard.total;
            mailData.to = giftCard.name_to;
            mailData.from = giftCard.name_from;
            mailData.message = giftCard.email_message;
            mailData['recipient-email'] = giftCard.recipient_email;
            mailData['currency-symbol'] = '$';

            if (config && config.application && config.application.giftcardCurrencySymbol) {
                mailData['currency-symbol'] = config.application.giftcardCurrencySymbol;
            }

            callback();
        },

        // function (callback) {
        //     var currencyDao = daos.createDao('Currency', context);
        //     currencyDao.getCurrencyById(order.currency_id, function (error, currency) {
        //         if (error) {
        //             callback(error);
        //             return;
        //         }

        //         if (!currency) {
        //             error = new Error("Can't get currency of %d", order.currency_id);
        //             callback(error);
        //             return;
        //         }

        //         mailData['currency-symbol'] = currency.symbol;
        //         callback();
        //     });
        // },

        // function (callback) {
        //     var variant = order.lineItems[0].variant;
        //     console.log("variant.images: " + require('util').inspect(variant.images));
        //     if (variant.images && variant.images.length) {
        //         mailData['background-image'] = variant.images[0].replace('large_', 'email_');
        //     }
        //     callback();
        // },

        function(callback) {
            logger.debug("variant:%j", variant);
            if (variant) {
                logger.debug("variant.images: " + require('util').inspect(variant.images));
                if (variant.images && variant.images.length) {
                    mailData['background-image'] = variant.images[0].replace('large_', 'email_');
                }
            }else{
                mailData['background-image'] = "";
            }

            callback();
        },

        function(callback) {
            mailService.sendMail(context, 'giftcards', mailData, function(error) {
                if (error) {
                    logger.error("Failed to send gift card email: %s", error.message);
                }
                callback();
            });
        }
    ], callback);
}


exports.notifyUnilevelGroupForRegistration = notifyUnilevelGroupForRegistration;
exports.sendDistributorRegistrationEmail = sendDistributorRegistrationEmail;
exports.sendRetailCustomerRegistrationEmail = sendRetailCustomerRegistrationEmail;
exports.sendFreeCustomerRegistrationEmail = sendFreeCustomerRegistrationEmail;
exports.sendResetPasswordTokenEmail = sendResetPasswordTokenEmail;
exports.sendUpgradeToDistributorEmail = sendUpgradeToDistributorEmail;
exports.sendCouponEmail = sendCouponEmail;
exports.sendGiftCardEmail = sendGiftCardEmail;
exports.getEmailSubject = getEmailSubject;
