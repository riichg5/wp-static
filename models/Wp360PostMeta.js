/**
 * wp_360_postmeta table definition
 */

module.exports = function (sequelize, DataTypes) {
    let model = sequelize.define('wp_360_postmeta', {
        metaId: {
            type: DataTypes.INTEGER,
            field: 'meta_id'
        },
        postId: {
            type: DataTypes.INTEGER,
            field: 'post_id'
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
        tableName:'wp_360_postmeta',
        timestamps: false
    });

    model.removeAttribute('id');
    return model;
};