const Base = require('./Base');
const TemplateCategoryList = require(_base + 'templates/CategoryList');

class Request extends Base {

    constructor (context) {
        super(context);
        this.dal = this.DAL.createWp360Post(context);
    }

    async getCategoryListPageHtml (opts) {
		let self = this, context = self.context;
		let urlObj = opts.urlObj;
		let categoryType = opts.categoryType;
		let page = opts.page;

		let bWp360Term = self.BLL.createWp360Post(context);

		let [categoryInfo] = await Promise.all([
			bWp360Term.getCategoryTermByType(categoryType)
		]);
    }
}

module.exports = Request;