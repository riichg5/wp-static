const Base = require('./Base');

class Request extends Base {

    constructor (context) {
        super(context);
    }

    static getPageInfo (urlObj) {
		let pathname = urlObj.pathname;
		let splits = pathname.split('/');
		let pageName = splits[splits.length -1];
		let pageSplits = pageName.split('.');
		let pageId = parseInt(pageSplits[0], 10);

		return {
			id: pageId
		};
    }

    static getCategoryInfo (urlObj) {
		let info = {
			categoryType: null,
			page: 1
		};
		let pathname = urlObj.pathname;


		let pageSplits = pathname.split('/page/');

		/*
			可能遇到的urls
			http://www.360zhijia.com/category/360anquanke/
			http://www.360zhijia.com/category/360anquanke/page/2/

			http://www.360zhijia.com/
			http://www.360zhijia.com/page/2/
		*/
		if(pageSplits.length === 1) {
			info.page = 1;
		} else{
			info.page = parseInt(pageSplits[1].replace(/\//gi, ''), 10);
		}

		let categoryPath = pageSplits[0];
		//http://www.360zhijia.com/
		if(categoryPath.replace(/\//gi, '').trim().length === 0) {
			info.categoryType = "homePage";
		} else { //http://www.360zhijia.com/category/360_os_release/
			let categorySplits = _.compact(categoryPath.split('/')); //["category", "360anquanke"]
			_.pullAll(categorySplits, ['category']);
			info.categoryType = categorySplits[0] || null;
		}

		return info;
    }

	static getInfoOfUrl (opts) {
		let self = this;
		let urlObj = opts.urlObj;
		let pathname = urlObj.pathname;
		let info = {
			isCategory: false,
			isPage: false,
			info: null,
			needProxy: false
		};

		if(_.startsWith(pathname, "/category/") === true || _.startsWith(pathname, "/page/") === true) {
			info.isCategory = true;
			info.info = self.getCategoryInfo(urlObj);
			info.needProxy = true;
		} else if(_.endsWith(pathname, ".html") === true) {
			info.isPage = true;
			info.info = self.getPageInfo(urlObj);
			info.needProxy = true;
		}

		return info;
	}

}

module.exports = Request;