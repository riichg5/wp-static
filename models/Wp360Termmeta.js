/**
 * wp_360_termmeta table definition
 */

module.exports = function (sequelize, DataTypes) {
    let model = sequelize.define('wp_360_termmeta', {
        metaId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            field: 'meta_id',
            autoIncrement: true
        },
        termId: {
            type: DataTypes.INTEGER,
            field: 'term_id'
        },
        metaKey: {
            type: DataTypes.STRING,
            field: 'meta_key'
        },
        metaValue: {
            type: DataTypes.STRING,
            field: 'meta_value'
        }
    }, {
        tableName:'wp_360_termmeta',
        timestamps: false
    });

    model.removeAttribute('id');
    return model;
};