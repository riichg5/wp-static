/**
 * wp_360_users table definition
 */

module.exports = function (sequelize, DataTypes) {
    let model = sequelize.define('wp_360_user', {
        Id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            field: 'ID',
            autoIncrement: true
        },
        userLogin: {
            type: DataTypes.STRING,
            field: 'user_login'
        },
        userPass: {
            type: DataTypes.STRING,
            field: 'user_pass'
        },
        userNicename: {
            type: DataTypes.STRING,
            field: 'user_nicename'
        },
        userEmail: {
            type: DataTypes.STRING,
            field: 'user_email'
        },
        userUrl: {
            type: DataTypes.STRING,
            field: 'user_url'
        },
        userRegistered: {
            type: DataTypes.DATE,
            field: 'user_registered'
        },
        userActivationKey: {
            type: DataTypes.STRING,
            field: 'user_activation_key'
        },
        userStatus: {
            type: DataTypes.INTEGER,
            field: 'user_status'
        },
        displayName: {
            type: DataTypes.STRING,
            field: 'display_name'
        }
    }, {
        tableName:'wp_360_users',
        timestamps: false
    });

    return model;
};