/**
 * wp_360_terms table definition
 */

module.exports = function (sequelize, DataTypes) {
    let model = sequelize.define('wp_360_term', {
        termId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            field: 'term_id',
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            field: 'name'
        },
        slug: {
            type: DataTypes.STRING,
            field: 'slug'
        },
        termGroup: {
            type: DataTypes.INTEGER,
            field: 'term_group'
        }
    }, {
        tableName:'wp_360_terms',
        timestamps: false
    });

    return model;
};