/**
 * wp_360_term_relationships table definition
 */

module.exports = function (sequelize, DataTypes) {
    let model = sequelize.define('wp_360_term_relationship', {
        objectId: {
            type: DataTypes.INTEGER,
            field: 'object_id'
        },
        termTaxonomyId: {
            type: DataTypes.INTEGER,
            field: 'term_taxonomy_id'
        },
        termOrder: {
            type: DataTypes.INTEGER,
            field: 'term_order'
        }
    }, {
        tableName:'wp_360_term_relationships',
        timestamps: false
    });

    model.removeAttribute('id');
    return model;
};