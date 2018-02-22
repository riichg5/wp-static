/**
 * wp_360_comments table definition
 */

module.exports = function (sequelize, DataTypes) {
    let model = sequelize.define('wp_360_link', {
        linkId: {
            type: DataTypes.INTEGER,
            field: 'link_id'
        },
        linkUrl: {
            type: DataTypes.STRING,
            field: 'link_url'
        },
        linkName: {
            type: DataTypes.STRING,
            field: 'link_name'
        },
        linkImage: {
            type: DataTypes.STRING,
            field: 'link_image'
        },
        linkTarget: {
            type: DataTypes.STRING,
            field: 'link_target'
        },
        linkDescription: {
            type: DataTypes.STRING,
            field: 'link_description'
        },
        linkVisible: {
            type: DataTypes.STRING,
            field: 'link_visible'
        },
        linkOwner: {
            type: DataTypes.INTEGER,
            field: 'link_owner'
        },
        linkRating: {
            type: DataTypes.INTEGER,
            field: 'link_rating'
        },
        linkUpdated: {
            type: DataTypes.DATE,
            field: 'link_updated'
        },
        linkRel: {
            type: DataTypes.STRING,
            field: 'link_rel'
        },
        linkNotes: {
            type: DataTypes.STRING,
            field: 'link_notes'
        },
        linkRss: {
            type: DataTypes.STRING,
            field: 'link_rss'
        }
    }, {
        tableName:'wp_360_links',
        timestamps: false
    });

    model.removeAttribute('id');
    return model;
};
