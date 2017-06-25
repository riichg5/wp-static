if(!process.env.NODE_ENV){
    process.env.NODE_ENV = 'test';
}
var app = require("../server");

module.exports  = {
    app: app,
    clientId: "ZlnElLNFjFt6pOBAOQpH8e",
    companyCode: 'QPH'
};
