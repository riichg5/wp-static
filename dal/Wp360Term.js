let Base = require('./Base');

class Wp360Term extends Base {
	constructor(context) {
		super(context);
		this.model = context.models.Wp360Term;
	}

	getCategoryTermByType (categoryType) {
		let self = this;
		let sql = `
			select wpt.* from wp_360_terms wpt
			inner join wp_360_term_taxonomy wptt ON wptt.term_id = wpt.term_id
			where
			wpt.slug = :categoryType
			and wptt.taxonomy = 'category'
		`;
		let args = {
			categoryType: categoryType
		};

		return self.queryOne({
			sql: sql,
			args: args
		});
	}
}

module.exports = Wp360Term;