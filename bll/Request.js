const Base = require('./Base');

class Request extends Base {

    constructor (context) {
        super(context);
        // this.dal = this.DAL.createRequest(context);
    }

	static getInfoOfUrl (opts) {
		let urlObj = opts.urlObj;

		if(_.startsWith(urlObj.pathname, "/category/") === true) {

		}
	}

}

module.exports = Request;