/**
 * wp_360_term_taxonomy table definition
 */

module.exports = function (sequelize, DataTypes) {
    let model = sequelize.define('wp_360_term_taxonomy', {
        termTaxonomyId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            field: 'term_taxonomy_id',
            autoIncrement: true
        },
        termId: {
            type: DataTypes.INTEGER,
            field: 'term_id'
        },
        taxonomy: {
            type: DataTypes.STRING,
            field: 'taxonomy'
        },
        description: {
            type: DataTypes.STRING,
            field: 'description'
        },
        parent: {
            type: DataTypes.INTEGER,
            field: 'parent'
        },
        count: {
            type: DataTypes.INTEGER,
            field: 'count'
        },
    }, {
        tableName:'wp_360_term_taxonomy',
        timestamps: false
    });

    // model.removeAttribute('id');
    return model;
};