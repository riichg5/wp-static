/**
 * wp_360_options table definition
 */

module.exports = function (sequelize, DataTypes) {
    let model = sequelize.define('wp_360_option', {
        optionId: {
            type: DataTypes.INTEGER,
            field: 'option_id'
        },
        optionName: {
            type: DataTypes.STRING,
            field: 'option_name'
        },
        optionValue: {
            type: DataTypes.STRING,
            field: 'option_value'
        },
        autoload: {
            type: DataTypes.STRING,
            field: 'autoload'
        }
    }, {
        tableName:'wp_360_options',
        timestamps: false
    });

    model.removeAttribute('id');
    return model;
};