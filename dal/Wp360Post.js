let Base = require('./Base');

class Wp360Post extends Base {
	constructor(context) {
		super(context);
		this.model = context.models.Wp360Post;
	}

	getCategoryPageList (opts) {
		let self = this, context = self.context;
		let categoryType = opts.categoryType;
		let page = opts.page;
		let pageSize = opts.pageSize;

		let offset = (page - 1) * pageSize;
		let sql = `
			SELECT wp.*
			  from wp_360_posts wp
				inner join wp_360_term_relationships rl ON  wp.id= rl.object_id
				inner join wp_360_term_taxonomy wptt ON wptt.term_taxonomy_id = rl.term_taxonomy_id
				INNER JOIN wp_360_terms wpt ON wpt.term_id = wptt.term_id
			 where
			 wpt.slug = :categoryType
			 AND wptt.taxonomy = 'category'
			 AND wp.post_status= 'publish'
			 order by wp.post_date desc
			 offset :offset
			 limit :pageSize
		`;
		let args = {
			categoryType: categoryType,
			pageSize: pageSize,
			offset: offset
		};

		return self.querySelect({
			sql: sql,
			args: args
		});
	}
}

module.exports = Wp360Post;