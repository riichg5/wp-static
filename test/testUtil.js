require('../lib/init/init');
let Promise = require('bluebird');
let path = require('path');
let BLL = require(_base + 'bll');
let DAL = require(_base + 'dal');

let middleware = require(_base + 'middleware');
let sequelize = Promise.promisify(middleware.sequelizer(path.join(_base, './models'), _config, _logger));


let context = {
    config: _config,
    logger: _logger ,
    companyCode: 'QPH',
    initialContext: false
};


function getContext(opts={}){

    if(context.initialContext){
        return _resolve(context);
    }



    return sequelize({
        context: context
    }, {})
    .then(()=>{
        return new Promise((resolve, reject)=>{

            let databaseConnector = middleware.databaseConnector();
            databaseConnector({context: context}, {}, ()=>{
                context.initialContext = true;

                //init for user
                if(opts.userId){
                    return BLL.createAuthentication(context)
                        .getUserInfoForTest({ userId: opts.userId})
                        .then(user => {
                            context.user = user;
                            return resolve(context);
                        });
                }

                return resolve(context);
            });
        });


    });
}

exports.getContext = getContext;
