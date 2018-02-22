/**
 * wp_360_usermeta table definition
 */

module.exports = function (sequelize, DataTypes) {
    let model = sequelize.define('wp_360_usermeta', {
        umetaId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            field: 'umeta_id',
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            field: 'user_id'
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
        tableName:'wp_360_usermeta',
        timestamps: false
    });

    return model;
};