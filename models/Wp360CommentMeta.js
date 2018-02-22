/**
 * wp_360_commentmeta table definition
 */

module.exports = function (sequelize, DataTypes) {
    let model = sequelize.define('wp_360_commentmeta', {
        metaId : {
            type: DataTypes.INTEGER,
            field: 'meta_id'
        },
        commentId : {
            type: DataTypes.INTEGER,
            field: 'comment_id'
        },
        metaKey : {
            type: DataTypes.STRING,
            field: 'meta_key'
        },
        metaValue : {
            type: DataTypes.STRING,
            field: 'meta_value'
        }
    }, {
        tableName:'wp_360_commentmeta',
        timestamps: false
    });

    model.removeAttribute('id');
    return model;
};
