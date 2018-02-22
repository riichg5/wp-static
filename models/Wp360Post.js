/**
 * wp_360_posts table definition
 */

module.exports = function (sequelize, DataTypes) {
    let model = sequelize.define('wp_360_post', {
        postAuthor: {
            type: DataTypes.INTEGER,
            field: 'post_author'
        },
        postDate: {
            type: DataTypes.DATE,
            field: 'post_date'
        },
        postDateGmt: {
            type: DataTypes.DATE,
            field: 'post_date_gmt'
        },
        postContent: {
            type: DataTypes.STRING,
            field: 'post_content'
        },
        postTitle: {
            type: DataTypes.STRING,
            field: 'post_title'
        },
        postExcerpt: {
            type: DataTypes.STRING,
            field: 'post_excerpt'
        },
        postStatus: {
            type: DataTypes.STRING,
            field: 'post_status'
        },
        commentStatus: {
            type: DataTypes.STRING,
            field: 'comment_status'
        },
        pingStatus: {
            type: DataTypes.STRING,
            field: 'ping_status'
        },
        postPassword: {
            type: DataTypes.STRING,
            field: 'post_password'
        },
        postName: {
            type: DataTypes.STRING,
            field: 'post_name'
        },
        toPing: {
            type: DataTypes.STRING,
            field: 'to_ping'
        },
        pinged: {
            type: DataTypes.STRING,
            field: 'pinged'
        },
        postModified: {
            type: DataTypes.DATE,
            field: 'post_modified'
        },
        postModifiedGmt: {
            type: DataTypes.DATE,
            field: 'post_modified_gmt'
        },
        postContentFiltered: {
            type: DataTypes.STRING,
            field: 'post_content_filtered'
        },
        postParent: {
            type: DataTypes.INTEGER,
            field: 'post_parent'
        },
        guid: {
            type: DataTypes.STRING,
            field: 'guid'
        },
        menuOrder: {
            type: DataTypes.INTEGER,
            field: 'menu_order'
        },
        postType: {
            type: DataTypes.STRING,
            field: 'post_type'
        },
        postMimeType: {
            type: DataTypes.STRING,
            field: 'post_mime_type'
        },
        commentCount: {
            type: DataTypes.INTEGER,
            field: 'comment_count'
        }
    }, {
        tableName:'wp_360_posts',
        timestamps: false
    });

    // model.removeAttribute('id');
    return model;
};