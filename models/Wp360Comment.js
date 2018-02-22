/**
 * wp_360_comments table definition
 */

module.exports = function (sequelize, DataTypes) {
    let model = sequelize.define('wp_360_comment', {
        commentId: {
            type: DataTypes.INTEGER,
            field: 'comment_ID'
        },
        commentPostId: {
            type: DataTypes.INTEGER,
            field: 'comment_post_ID'
        },
        commentAuthor: {
            type: DataTypes.STRING,
            field: 'comment_author'
        },
        commentAuthorEmail: {
            type: DataTypes.STRING,
            field: 'comment_author_email'
        },
        commentAuthorUrl: {
            type: DataTypes.STRING,
            field: 'comment_author_url'
        },
        commentAuthorIp: {
            type: DataTypes.STRING,
            field: 'comment_author_IP'
        },
        commentDate: {
            type: DataTypes.DATE,
            field: 'comment_date'
        },
        commentDateGmt: {
            type: DataTypes.DATE,
            field: 'comment_date_gmt'
        },
        commentContent: {
            type: DataTypes.STRING,
            field: 'comment_content'
        },
        commentKarma: {
            type: DataTypes.INTEGER,
            field: 'comment_karma'
        },
        commentApproved: {
            type: DataTypes.STRING,
            field: 'comment_approved'
        },
        commentAgent: {
            type: DataTypes.STRING,
            field: 'comment_agent'
        },
        commentType: {
            type: DataTypes.STRING,
            field: 'comment_type'
        },
        commentParent: {
            type: DataTypes.INTEGER,
            field: 'comment_parent'
        },
        userId: {
            type: DataTypes.INTEGER,
            field: 'user_id'
        },
        commentMailNotify: {
            type: DataTypes.INTEGER,
            field: 'comment_mail_notify'
        },
    }, {
        tableName:'wp_360_comments',
        timestamps: false
    });

    model.removeAttribute('id');
    return model;
};
