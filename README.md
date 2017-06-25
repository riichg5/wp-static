# 燃气项目


## 运行环境说明

```
Node版本 v6.X
本地测试启动命令： NODE_ENV=test node server.js
本地测试访问url: http://localhost:3001/admin/login
测试环境db：182.92.72.172:2088
测试环境db名称：ranqi
```

## demo

[http://123.57.158.14:3001/admin/login](http://123.57.158.14:3001/admin/login)

## 运行

1. Node版本6.x或者以上
2. npm install
3. NODE_ENV=test node server.js | bunyan
4. admin登陆链接：[http://localhost:3001/admin/login](http://localhost:3001/admin/login),账号:admin 密码:admin

## 数据返回定义

返回格式:

```javascript
{
    "request":{
        "method": "GET",
        "href": "/v1/system-config",
        "headers":{"host": "localhost:3001", "connection": "keep-alive", "authorization": "Bearer fd7a3a0ebd8eab235490044cdf39c11d3115820b"},
        "parameters":{},
        "body":{}
    },
    "meta":{
        "x-server-current-time": "2016-11-13T16:06:42+08:00",
        "code": 200
    },
    "code": 1,
    "isSuc": false,
    "result":[
        {"id": 1, "name": "test", "createdAt": "2016-10-30T20:18:00.000Z", "updatedAt": "2016-10-30T20:18:02.000Z"}
    ]
}
```

## Oauth相关接口


1. /v1/oauth/authorize [POST]
===

通过用户名和密码获取授权Code

header:
> Content-Type: application/x-www-form-urlencoded

Body参数：

```javascript
{
    username: '',
    password: '',
    grantType: 'authorization_code',
    responseType: 'code',
    clientId: 'idoftestclient',
    redirectUri: 'localhost:3001/oauth2callback'
}
```

返回：

> 301跳转http://localhost:3001/oauth2callback?code=161af871de30c71d7ae7c1cf5c04586bd04b8853

2. /v1/oauth/authorize [GET]
===

通过移动门户的accessToken，获取第三方应用的oauth code

header:
> Authorization: Bearer aa1949b231217c32d20d0c035a281767dba23d43

> User-Agent: CUIT-APPClient/1.0

说明：User-Agent需要包含```CUIT-APPClient/1.0```这串字符串

URL参数：

```
?grant_type=authorization_code&response_type=code&client_id=cuitclouddiskclient&redirect_uri=http://pan.uubey.com/appauth/sso/callback
```

返回：
> 301跳转http://pan.uubey.com/appauth/sso/callback

3. /v1/oauth/token [POST]
===

使用code获取token

header:
> Content-Type: application/x-www-form-urlencoded

Body参数：

```javascript
{
    grantType: 'authorization_code',
    clientId: 'idoftestclient',
    clientSecret: 'abovegem',
    code: 'a9d569167df9b0d74294e254b5fe9c00280d01f5'
}
```

返回：

```javascript
{
	"code": 1,
	"isSuc": true,
	"result":{
		"tokenType": "bearer",
		"accessToken": "1e8d854cc5666ddba68c6977b363b7f7372a2cfd",
		"expiresIn": 2592000,
		"refreshToken": "73491553012cbe2840db9daf5985bfdd5968f67d"
	}
}
```

4. 使用token访问api
===

http header里面设置：

```
    Authorization: Bearer fd7a3a0ebd8eab235490044cdf39c11d3115820b
```

5. /v1/oauth/grant [POST]
===

直接使用用户名和密码进行登录获取access token

header:
> Content-Type: application/x-www-form-urlencoded

Body参数

```javascript
{
    username: 'libo',
    password: '123',
    grant_type: 'password',
    client_id: 'idoftestclient',
    client_secret:'abovegem'
}
```

返回：

```javascript
{
	"code": 1,
	"isSuc": true,
	"result":{
		"tokenType": "bearer",
		"accessToken": "413644976e353fb536d18eafaf05f999e4cecdfc",
		"expiresIn": 2592000,
		"refreshToken": "150c8e71253ff942d912608e1eda5cf506fd5d69"
	}
}
```

6. /v1/oauth/tokenInfo?accessToken=1e8d854cc5666ddba68c6977b363b7f7372a2cfd [GET]
===

获取token信息

返回：

```javascript
    {
        "code": 1,
        "isSuc": true,
        "result":{
            "isValidate": true,
            "userId": 1,
            "apiUserId": "2016121065",
            "clientName": "test client",
            "clientOwner": "abovegem",
            "expiresAt": 1482020184000,
            "issuedAt": 0
        }
    }
```

7. /v1/user [GET]
===

使用accessToken获取用户信息。

todo:
> 根据client id权限得到用户的指定的信息范围

header:
> Authorization: Bearer 1e8d854cc5666ddba68c6977b363b7f7372a2cfd

返回：

```javascript
    {
        "code": 1,
        "isSuc": true,
        "result":{
            "apiUserId": "2016121065",
            "apiTokenExpiresOn": "2017-10-24T17:50:38.000Z",
            "userId": "2016121065",
            "login": "libo",
            "otherLogin": null,
            "fullName": "李波",
            "identityCard": "110",
            "gender": "男",
            "department": null,
            "userType": null,
            "email": "tolibo@qq.com"
        }
    }
```

8. /v1/clients [GET]
===

获取应用信息

header:

```
Authorization: Bearer 1e8d854cc5666ddba68c6977b363b7f7372a2cfd  //token
CLIENT-VERSION: 201611231111111
```

返回：

终端本地的clients数据版本号``CLIENT-VERSION``和服务器不匹配，则会返回http 200并且返回clients数据，
如果匹配，则直接返回http 304。

```javascript
Http Header:
CLIENT-VERSION: 201611231111111  //clients数据版本号

Reponse：
{
    "code": 1,
    "isSuc": true,
    "result":[
        {
        "clientId": "idoftestclient",
        "clientName": "test client",
        "description": "This is a test client.",
        "redirectUri": "localhost:3001/oauth2callback",
        "icon": "/public/img/a1.jpg",
        "uri": "http://www.cuit.edu.cn",
        "index": 999, //显示排序
        "needAuth": 1, //1表示需要用户授权认证， 0表示不需要
        "createdAt": "2016-10-10T10:23:04.000Z"
        }
    ],
    "meta":{
        "x-server-current-time": "2016-11-22T22:05:22+08:00",
        "code": 200
    }
}
```

9. /v1/avatar/:appUserId [GET]
===

获取用户头像图片接口

返回：
二进制图片流，直接当图片地址使用。http header: ``{"Content-Type": "image/jpg"}``


10. /v1/school-news?maxId=0&limit=5&withContent=0&typeId=14 [GET]
===

获取采集新闻信息

参数说明：

```
maxId 当前最大id
limit 需要返回大于maxId的文章的数量
withContent 是否返回文章内容，0不返回，1返回
typeId 新闻分类id，可选参数，不传则返回所有分类文章
```

返回数据：

```javascript
{
      "code": 1,
      "isSuc": true,
      "result": [
        {
          "id": 19,
          "title": "四川职业技术学院纪委一行来校交流纪检工作",
          "publishTime": "2016/11/25",
          "readCount": 0,
          "typeName": '信息公告',  //分类名
          "sourceUrl": "http://www.cuit.edu.cn/ShowNews.aspx?id=4605",
          "imgUrl": "http:/123.57.158.14:3001/crawlerImgs/2016/11/29/9cdd2b43-e41a-445d-94b4-b57144669353.jpg",
          "createdAt": "2016-11-26T08:15:57.000Z",
          "updatedAt": "2016-11-26T08:15:57.000Z"
        }
      ],
      "meta": {
        "x-server-current-time": "2016-11-26T17:02:57+08:00",
        "code": 200
      }
    }
```

11. /v1/school-news/:id [GET]
===

获取文章信息

返回数据:

```javascript
 {
      "code": 1,
      "isSuc": true,
      "result": {
        "id": 30,
        "title": "2016年度寻访“中国大学生自强之星”活动成都信息工程大学推荐名单公示",
        "content": "\n\t<p style=\"text-indent:2em;\">\r\n\t根据共青团中央、全国学联关于开展2016年度寻访“中国大学生自强之星”活动的要求，校团委于近期在全校范围内进行了2016年度“中国大学生自强之星”学校候选人推选工作。\r\n</p>\r\n<p style=\"text-indent:2em;\">\r\n\t按照省级“大学生自强之星”候选人产生的要求，经学生工作处推荐，学生本人同意，校团委审核，在我校2015年度“自强之星”参选者中遴选出5名候选人，参加省级“大学生自强之星”评选，现将名单予以公示。\r\n</p>\r\n<p style=\"text-indent:2em;\">\r\n\t公示时间：2016年11月23日-2016年11月25日\r\n</p>\r\n<p style=\"text-indent:2em;\">\r\n\t公示期间，若有异议，请致电校团委办公室：85965395（魏老师），不接受匿名。\r\n</p>\r\n<p style=\"text-indent:2em;\">\r\n\t名单如下：\r\n</p>\r\n<p style=\"text-indent:2em;\">\r\n\t姓&nbsp;名&nbsp;学院班级\r\n</p>\r\n<p style=\"text-indent:2em;\">\r\n\t冯&nbsp;&nbsp;俊&nbsp;&nbsp;外国语学院英语131班\r\n</p>\r\n<p style=\"text-indent:2em;\">\r\n\t李&nbsp;&nbsp;萍&nbsp;&nbsp;资源环境学院环境科学141班\r\n</p>\r\n<p style=\"text-indent:2em;\">\r\n\t毛&nbsp;&nbsp;灵&nbsp;&nbsp;计算机学院计算机科学技术应用134班\r\n</p>\r\n<p style=\"text-indent:2em;\">\r\n\t汤&nbsp;&nbsp;欢&nbsp;&nbsp;大气科学学院大气科学专业136班\r\n</p>\r\n<p style=\"text-indent:2em;\">\r\n\t阳&nbsp;&nbsp;静&nbsp;&nbsp;电子工程学院电子信息科学与技术132班\r\n</p>\r\n<p style=\"text-indent:2em;\">\r\n\t&nbsp;\r\n</p>\r\n<p style=\"text-indent:2em;\">\r\n\t&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 共青团成都信息工程大学委员会&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\r\n</p>\r\n<p style=\"text-indent:2em;\">\r\n\t&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 2016年11月23日&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;\r\n</p>\r\n<p style=\"text-indent:2em;\">\r\n\t<!--EndFragment-->\r\n</p>\r\n<p style=\"text-indent:2em;\">\r\n\t<br>\r\n</p>\n\t",
        "publishTime": "2016/11/23",
        "readCount": 0,
        "typeName": '信息公告',    //分类名
        "sourceUrl": "http://www.cuit.edu.cn/ShowNews.aspx?id=4580",
        "imgUrl": "http:/123.57.158.14:3001/crawlerImgs/2016/11/29/9cdd2b43-e41a-445d-94b4-b57144669353.jpg",
        "createdAt": "2016-11-26T08:16:10.000Z",
        "updatedAt": "2016-11-26T08:16:10.000Z"
      }
 }
```

12. /v1/school-news/types [GET]
===

获取校园新闻分类信息，***如果后面新增了分类，爬虫会自动将分类取下来，所以这里的数据从设计上来说并不是固定的。***

返回数据：

```javascript
{
      "code": 1,
      "isSuc": true,
      "result": [
        {
          "id": 15,
          "name": "焦点新闻",
          "index": 1,  //显示排序
          "createdAt": "2016-11-27T03:34:22.000Z",
          "updatedAt": "2016-11-27T03:34:22.000Z"
        },
        {
          "id": 13,
          "name": "综合新闻",
          "index": 2,
          "createdAt": "2016-11-27T03:33:58.000Z",
          "updatedAt": "2016-11-27T03:33:58.000Z"
        },
        {
          "id": 14,
          "name": "信息公告",
          "index": 3,
          "createdAt": "2016-11-27T03:34:11.000Z",
          "updatedAt": "2016-11-27T03:34:11.000Z"
        },
        {
          "id": 16,
          "name": "学术动态",
          "index": 4,
          "createdAt": "2016-11-27T03:34:23.000Z",
          "updatedAt": "2016-11-27T03:34:23.000Z"
        }
      ],
      "meta": {
        "x-server-current-time": "2016-11-27T11:50:08+08:00",
        "code": 200
      }
}
```

13. /v1/articles/tops?top=1 [GET]
===

获取热点新闻。这个接口用于app的幻灯片

参数说明：

```javasript
top 返回最新的条目数量, 可选参数，默认为四条。实际返回数据条目数 <=4 (<=top)
```

返回数据：

```javascript
{
      "code": 1,
      "isSuc": true,
      "result": [
        {
          "id": 1,
          "title": "信息安全工程学院学术讲座之系列三 ------“动态环境感知的移动对象不确定轨迹预测模型”",
          "img": "/img/p6.jpg",
          "url": "http://www.baidu.com",
          "type": "top",
          "index": 1,
          "deletedAt": null,
          "createdAt": "2016-11-27T22:51:54.000Z"
        }
      ],
      "meta": {
        "x-server-current-time": "2016-11-27T23:38:50+08:00",
        "code": 200
    }
}
```

14. /v1/articles/tops/:id [GET]
===

获取热点新闻内容信息

返回数据：

```javasript
    {
      "code": 1,
      "isSuc": true,
      "result": {
        "id": 1,
        "title": "信息安全工程学院学术讲座之系列三 ------“动态环境感知的移动对象不确定轨迹预测模型”",
        "content": "\n\t<p style=\"text-indent:2em;\">\r\n\t【本网讯】11月18日下午，信息安全工程学院乔少杰副教授作题为“动态环境感知的移动对象不确定轨迹预测模型”的学术讲座，学院教师、研究生和相关专业的本科生参加了本次讲座。\r\n</p>\r\n<p style=\"text-indent:2em;\">\r\n\t乔少杰讲解了以移动位置索引、频繁轨迹模式挖掘、时间连续贝叶斯网络为主要手段，揭示移动对象动态行为特征及规律，提出动态环境下移动对象预测新概念，特色理论及模型。乔少杰在讲解的过程中同时提出了许多个人研究观点，引起了许多师生一起参与话题讨论，现场气氛热烈，开拓了老师和学生的研究视野，师生受益匪浅。\r\n</p>\r\n<p align=\"center\">\r\n\t<img title=\"\" alt=\"\" src=\"/News/image/2016/11/22/2_副本.jpg\" width=\"600\" height=\"450\">\r\n</p>\r\n<p>\r\n\t<br>\r\n</p>\r\n<p style=\"text-indent:2em;\" align=\"center\">\r\n\t讲座现场\r\n</p>\r\n<p align=\"center\">\r\n\t<img alt=\"\" src=\"/News/image/2016/11/22/4_副本.jpg\">\r\n</p>\r\n<p>\r\n\t<br>\r\n</p>\r\n<p style=\"text-indent:2em;\" align=\"center\">\r\n\t讲座现场\r\n</p>\r\n<p align=\"center\">\r\n\t<img alt=\"\" src=\"/News/image/2016/11/22/IMG_4445_副本.jpg\">\r\n</p>\r\n<p>\r\n\t<br>\r\n</p>\r\n<p style=\"text-indent:2em;\" align=\"center\">\r\n\t讲座现场\r\n</p>\r\n<p style=\"text-indent:2em;\">\r\n\t乔少杰个人简介：\r\n</p>\r\n<p style=\"text-indent:2em;\">\r\n\t乔少杰，新加坡国立大学联合培养博士、博士后、副教授。中国计算机学会数据库、计算机应用专委委员，中国人工智能学会“机器学习”、“粗糙集与软计算”专委委员，四川计算机学会大数据专委委员，国家自然科学基金项目评审专家，教育部学位论文通讯评审专家。\r\n</p>\r\n<p style=\"text-indent:2em;\">\r\n\t研究兴趣包括：移动对象数据库，移动社交网络，轨迹大数据挖掘，发表学术论文120余篇，SCI收录18篇，第一作者发表高质量论文包括：IEEE Trans on ITS 2篇，计算机学报4篇，软件学报3篇，自动化学报1篇，获国际会议IEEE\r\n</p>\r\n<p style=\"text-indent:2em;\">\r\n\tTrans ISI 2008最佳论文奖，主持包括国家自然基金在内的国家及省部级以上项目10余项，担任多个ACM&amp;IEEE Trans知名期刊评阅人。\r\n</p>\r\n<p style=\"text-indent:2em;\">\r\n\t<br>\r\n</p>\n\t",
        "img": "/img/1.jpg",                        //图片
        "url": "http://www.baidu.com",              //跳转类型
        "type": "top",                              //api内部区分文章类型的字段
        "index": 1,                                 //排序
        "deletedAt": null,                          //删除时间
        "readCount": 1,                             //阅读数量
        "createdAt": "2016-11-27T22:51:54.000Z",    //创建时间
        "updatedAt": "2016-11-27T22:51:56.000Z"     //更新时间
      },
      "meta": {
        "x-server-current-time": "2016-12-03T23:32:25+08:00",
        "code": 200
      }
    }
```

14. /v1/students/netFee [GET]
===

获取网费接口

返回数据：
```{
    "code": 1,
    "isSuc": true,
    "result": "0.00",  //余额
    "meta": {
        "x-server-current-time": "2016-12-14T22:20:17+08:00",
        "code": 200
    }
}
```

## 燃气相关接口

### 前端接口

#### 获取用户信息

**GET** `/v1/user`

Http Header:

```
Authorization: "Bearer ${access token}"
```

Response:

```javascript
{
    "code": 1,
    "isSuc": true,
    "result": {
        "id": 1,
        "areaId": "0",
        "username": "superadmin",
        "realname": "superadmin",
        "sex": "男",
        "birthday": "1900-01-01T00:00:00.000Z",
        "telphone": " ",
        "cellphone": " ",
        "address": " ",
        "postcode": " ",
        "email": " ",
        "qq": " ",
        "msn": " ",
        "registerDate": "2012-03-09T08:13:33.000Z",
        "logonCount": 0,
        "state": 1,
        "remarks": " ",
        "roles": [
            {
                "userId": 1,
                "roleId": 1,
                "roleName": "超级管理员",
                "parentRoleId": 0
            }
        ],
        "departments": [
            {
                "userId": 1,
                "departmentId": 21,
                "departmentName": "人事部",
                "parentDepartmentId": 1
            }
        ],
        "createdAt": null,
        "updatedAt": null
    },
    "meta": {
        "x-server-current-time": "2017-05-21T17:43:18+08:00",
        "code": 200
    }
}
```

### Admin接口

#### 获取所有部门

**GET** `/v1/admin/departments?states=-1,1,0`

Query:

```
states: String, 可选, 值为-1,0,1, 查询多个状态参数用半角逗号隔开
```

Response:

```javascript
{
    "code": 1,
    "isSuc": true,
    "result": [
        {
            "id": 1,
            "name": "重庆气矿Test",
            "state": 1,
            "remarks": "21",
            "parentId": 3,
            "orderNum": 0,
            "createdAt": null,
            "updatedAt": null
        }
    ]
}
```

#### 根据上级部门id获取下级部门信息

**GET** `/v1/admin/departments/:departmentId/children?states=-1,1,0`

Query:

```
departmentId: Integer, 必须，值为上级部门id
states: String, 可选, 值为-1,0,1, 查询多个状态参数用半角逗号隔开
```

Response:

>返回下级部门信息

```javascript
{
    "code": 1,
    "isSuc": true,
    "result": [
        {
            "id": 1,
            "name": "重庆气矿Test",
            "state": 1,
            "remarks": "21",
            "parentId": 3,
            "orderNum": 0,
            "createdAt": null,
            "updatedAt": null
        }
    ]
}
```

#### 添加部门

**POST** `/v1/admin/departments`

Request Body:

```
name: String, 必须, 部门名称
parentId: Integer, 必须, 父级id
orderNum: Integer, 必须, 排序
state: Integer, 必须, 状态-1,1,0
remarks: String, 必须, 备注, 可以为空字符串
```

Response:

```javascript
{
    "code": 1,
    "isSuc": true,
    "result": {
        "id": 28,
        "name": "test11",
        "parentId": 11,
        "orderNum": 11,
        "state": 1,
        "remarks": "dadada11",
        "createdAt": "2017-05-21T00:22:24.000Z",
        "updatedAt": "2017-05-21T00:49:45.000Z"
    }
}
```

#### 更新部门信息

**PUT** `/v1/admin/departments/:id`

Request Body:

```
name: String, 必须, 部门名称
parentId: Integer, 必须, 父级id
orderNum: Integer, 必须, 排序
state: Integer, 必须, 状态-1,1,0
remarks: String, 必须, 备注, 可以为空字符串
```

Response:

```javascript
{
    "code": 1,
    "isSuc": true,
    "result": {
        "id": 28,
        "name": "test11",
        "parentId": 11,
        "orderNum": 11,
        "state": 1,
        "remarks": "dadada11",
        "createdAt": "2017-05-21T00:22:24.000Z",
        "updatedAt": "2017-05-21T00:49:45.000Z"
    }
}
```

#### 获取角色信息

**GET**  `/v1/admin/roles/:roleId/children?states=0`

```
roleId: Integer, 必须，角色id
states: String, 可选, 值为-1,0,1, 查询多个状态参数用半角逗号隔开
```

```javascript
{
    "code": 1,
    "isSuc": true,
    "result": [
        {
          "id": 46,
          "name": "normalhelinbo",
          "parentId": 1,
          "level": 0,
          "description": "测试9",
          "orderNum": 0,
          "state": 0,
          "remarks": "得到",
          "allowClients": [{
                "id": 1,
                "description": "This is a test client.",
                "uri": "http://www.cuit.edu.cn",
                "icon": "/img/a1.jpg",
                "index": 999,
                "type": 1,
                "active": 1,
                "clientId": "idoftestclient",
                "clientOwner": "abovegem",
                "clientSecret": "abovegem",
                "clientName": "应用1",
                "redirectUri": "localhost:3001/oauth2callback",
                "isSelf": 1,
                "needAuth": 1,
                "testUsers": null,
                "createdAt": "2016-10-10T10:23:04.000Z",
                "updatedAt": "2017-05-14T07:21:33.000Z"
            }],
            "configAllowClients": [
                {
                  "id": 25,
                  "sourceId": 52,
                  "sourceType": 0,
                  "clientId": 1,
                  "isAllow": 1,
                  "createdAt": "2017-05-23T15:33:16.000Z",
                  "updatedAt": "2017-05-23T15:33:16.000Z",
                  "clientName": "应用5"
                }
            ],
            "configDisallowClients": [{
              "id": 28,
              "sourceId": 52,
              "sourceType": 0,
              "clientId": 4,
              "isAllow": 0,
              "createdAt": "2017-05-23T15:33:16.000Z",
              "updatedAt": "2017-05-23T15:33:16.000Z",
              "clientName": "应用5"
            }],
            "createdAt": null,
            "updatedAt": null
        }
    ]
}
```

#### 添加角色

**POST** `/v1/admin/roles`

Request Body:

```javascript
{
    name: '测试权限',
    parentId: 0,
    description: '描述',
    orderNum: 0,
    state: 1,
    remarks: 'test',
    allowClientIds: [1],
    disallowClientIds: [6, 7]
}
```

Response:

```javascript
{
    "code": 1,
    "isSuc": true,
    "result": {
        "id": 55,
        "level": 0,
        "remarks": "test",
        "name": "测试权限",
        "parentId": 0,
        "description": "描述",
        "orderNum": 0,
        "state": 1,
        "allowClients": [
          {
            "id": 1,
            "description": "This is a test client.",
            "uri": "http://www.cuit.edu.cn",
            "icon": "/img/a1.jpg",
            "index": 999,
            "type": 1,
            "active": 1,
            "clientId": "idoftestclient",
            "clientOwner": "abovegem",
            "clientSecret": "abovegem",
            "clientName": "应用1",
            "redirectUri": "localhost:3001/oauth2callback",
            "isSelf": 1,
            "needAuth": 1,
            "testUsers": null,
            "createdAt": "2016-10-10T10:23:04.000Z",
            "updatedAt": "2017-05-14T07:21:33.000Z"
          }
        ],
        "configAllowClients": [
          {
            "id": 47,
            "sourceId": 55,
            "sourceType": "role",
            "clientId": 1,
            "isAllow": 1,
            "createdAt": "2017-05-24T14:16:07.000Z",
            "updatedAt": "2017-05-24T14:16:07.000Z",
            "clientName": "应用1"
          }
        ],
        "configDisallowClients": [
          {
            "id": 48,
            "sourceId": 55,
            "sourceType": "role",
            "clientId": 6,
            "isAllow": 0,
            "createdAt": "2017-05-24T14:16:07.000Z",
            "updatedAt": "2017-05-24T14:16:07.000Z",
            "clientName": "应用4"
          }
        ],
        "updatedAt": "2017-05-22T15:35:19.000Z",
        "createdAt": "2017-05-22T15:35:19.000Z"
    }
}
```


#### 编辑角色

**PUT** `/v1/admin/roles/:id`

Request Body:

```javascript
    name: '测试权限',
    parentId: 0,
    description: '描述',
    orderNum: 0,
    state: 1,
    remarks: 'test',
    allowClientIds: [1],
    disallowClientIds: [6, 7]
```

Response:

```javascript
{
    "code": 1,
    "isSuc": true,
    "result": {
        "id": 55,
        "level": 0,
        "remarks": "test",
        "name": "测试权限",
        "parentId": 0,
        "description": "描述",
        "orderNum": 0,
        "state": 1,
        "allowClients": [
          {
            "id": 1,
            "description": "This is a test client.",
            "uri": "http://www.cuit.edu.cn",
            "icon": "/img/a1.jpg",
            "index": 999,
            "type": 1,
            "active": 1,
            "clientId": "idoftestclient",
            "clientOwner": "abovegem",
            "clientSecret": "abovegem",
            "clientName": "应用1",
            "redirectUri": "localhost:3001/oauth2callback",
            "isSelf": 1,
            "needAuth": 1,
            "testUsers": null,
            "createdAt": "2016-10-10T10:23:04.000Z",
            "updatedAt": "2017-05-14T07:21:33.000Z"
          }
        ],
        "configAllowClients": [
          {
            "id": 47,
            "sourceId": 55,
            "sourceType": "role",
            "clientId": 1,
            "isAllow": 1,
            "createdAt": "2017-05-24T14:16:07.000Z",
            "updatedAt": "2017-05-24T14:16:07.000Z",
            "clientName": "应用1"
          }
        ],
        "configDisallowClients": [
          {
            "id": 48,
            "sourceId": 55,
            "sourceType": "role",
            "clientId": 6,
            "isAllow": 0,
            "createdAt": "2017-05-24T14:16:07.000Z",
            "updatedAt": "2017-05-24T14:16:07.000Z",
            "clientName": "应用4"
          }
        ],
        "updatedAt": "2017-05-22T15:35:19.000Z",
        "createdAt": "2017-05-22T15:35:19.000Z"
    }
}
```

#### 删除角色

**DELETE**  `/v1/admin/roles/:roleId`

Response:

```javascript
{
    "code": 1,
    "isSuc": true,
    "result": {
      "status": "success"
    }
}
```

#### 更新用户state

**PUT** `/v1/admin/oauthUsers/23/states`

请求：
>state：状态(-1:已删除,0:禁止,1正常)

```javascript
{
    state: -1
}
```

返回：

```javascript
{
    "code": 1,
    "isSuc": true,
    "result": {
        "status": "success"
    }
}
```

#### 添加用户

**POST** `/v1/admin/oauthUsers`

Body:

```javascript
{
    areaId: '1',               //可选，暂时没有用到
    username: "test1113",
    password: "test111",
    realname: "test",
    sex: "男",
    birthday: "2017-01-01",
    telphone: "11111111",
    cellphone: "11111",
    address: "dahkdakjdahdkjahdkjahk",
    postcode: "610041",
    email: "tolibo@qq.com",
    qq: "263742406",
    msn: "263742406@msn.com",
    state: 1,                   //-1:已删除,0:禁止,1正常
    remarks: "",
    roleIds: [1,41,45],         //可选
    departmentIds: [1,2,3,4],   //可选,
    allowClientIds: [1],        //必须
    disallowClientIds: [6, 7]   //必须
}
```

Response:

```javascript
{
    "code": 1,
      "isSuc": true,
      "result": {
        "id": 47,
        "areaId": "1",
        "username": "test1113",
        "realname": "test",
        "sex": "男",
        "birthday": "2016-12-31T16:00:00.000Z",
        "telphone": "11111111",
        "cellphone": "11111",
        "address": "dahkdakjdahdkjahdkjahk",
        "postcode": "610041",
        "email": "tolibo@qq.com",
        "qq": "263742406",
        "msn": "263742406@msn.com",
        "registerDate": "2017-05-22T14:28:30.000Z",
        "logonCount": 0,
        "state": 1,
        "remarks": "",
        "roles": [
          {
            "userId": 47,
            "roleId": 1,
            "roleName": "超级管理员",
            "parentRoleId": 0
          }
        ],
        "departments": [
          {
            "userId": 47,
            "departmentId": 1,
            "departmentName": "重庆气矿Test",
            "parentDepartmentId": 3
          }
        ],
        "allowClients": [
          {
            "id": 1,
            "description": "This is a test client.",
            "uri": "http://www.cuit.edu.cn",
            "icon": "/img/a1.jpg",
            "index": 999,
            "type": 1,
            "active": 1,
            "clientId": "idoftestclient",
            "clientOwner": "abovegem",
            "clientSecret": "abovegem",
            "clientName": "应用1",
            "redirectUri": "localhost:3001/oauth2callback",
            "isSelf": 1,
            "needAuth": 1,
            "testUsers": null,
            "createdAt": "2016-10-10T10:23:04.000Z",
            "updatedAt": "2017-05-14T07:21:33.000Z"
          }
        ],
        "configAllowClients": [
          {
            "id": 59,
            "sourceId": 52,
            "sourceType": "user",
            "clientId": 1,
            "isAllow": 1,
            "createdAt": "2017-05-24T15:25:52.000Z",
            "updatedAt": "2017-05-24T15:25:52.000Z",
            "clientName": "应用1"
          }
        ],
        "configDisallowClients": [
          {
            "id": 60,
            "sourceId": 52,
            "sourceType": "user",
            "clientId": 6,
            "isAllow": 0,
            "createdAt": "2017-05-24T15:25:52.000Z",
            "updatedAt": "2017-05-24T15:25:52.000Z",
            "clientName": "应用4"
          },
        ],
        "createdAt": "2017-05-22T14:28:30.000Z",
        "updatedAt": "2017-05-22T14:28:30.000Z"
      }
}
```

#### 更新用户信息

**PUT** `/v1/admin/oauthUsers/:id`

Body:

```javascript
{
    areaId: '2',            //可选，暂时没有用到
    username: "test1112",
    password: "test1112",
    realname: "test2",
    sex: "女",
    birthday: "2017-01-01",
    telphone: "111111112",
    cellphone: "111112",
    address: "2dahkdakjdahdkjahdkjahk2",
    postcode: "6100412",
    email: "tolibo2@qq.com",
    qq: "2637424062",
    msn: "2637424062@msn.com",
    state: 0,               //-1:已删除,0:禁止,1正常
    remarks: "2",
    roleIds: [1],           //可选
    departmentIds: [1,4],     //可选
    allowClientIds: [1],        //必须
    disallowClientIds: [6, 7]   //必须
}
```

Response:

```javascript
{
    "code": 1,
      "isSuc": true,
      "result": {
        "id": 47,
        "areaId": "1",
        "username": "test1113",
        "realname": "test",
        "sex": "男",
        "birthday": "2016-12-31T16:00:00.000Z",
        "telphone": "11111111",
        "cellphone": "11111",
        "address": "dahkdakjdahdkjahdkjahk",
        "postcode": "610041",
        "email": "tolibo@qq.com",
        "qq": "263742406",
        "msn": "263742406@msn.com",
        "registerDate": "2017-05-22T14:28:30.000Z",
        "logonCount": 0,
        "state": 1,
        "remarks": "",
        "roles": [
          {
            "userId": 47,
            "roleId": 1,
            "roleName": "超级管理员",
            "parentRoleId": 0
          }
        ],
        "departments": [
          {
            "userId": 47,
            "departmentId": 1,
            "departmentName": "重庆气矿Test",
            "parentDepartmentId": 3
          }
        ],
        "allowClients": [
          {
            "id": 1,
            "description": "This is a test client.",
            "uri": "http://www.cuit.edu.cn",
            "icon": "/img/a1.jpg",
            "index": 999,
            "type": 1,
            "active": 1,
            "clientId": "idoftestclient",
            "clientOwner": "abovegem",
            "clientSecret": "abovegem",
            "clientName": "应用1",
            "redirectUri": "localhost:3001/oauth2callback",
            "isSelf": 1,
            "needAuth": 1,
            "testUsers": null,
            "createdAt": "2016-10-10T10:23:04.000Z",
            "updatedAt": "2017-05-14T07:21:33.000Z"
          }
        ],
        "configAllowClients": [
          {
            "id": 59,
            "sourceId": 52,
            "sourceType": "user",
            "clientId": 1,
            "isAllow": 1,
            "createdAt": "2017-05-24T15:25:52.000Z",
            "updatedAt": "2017-05-24T15:25:52.000Z",
            "clientName": "应用1"
          }
        ],
        "configDisallowClients": [
          {
            "id": 60,
            "sourceId": 52,
            "sourceType": "user",
            "clientId": 6,
            "isAllow": 0,
            "createdAt": "2017-05-24T15:25:52.000Z",
            "updatedAt": "2017-05-24T15:25:52.000Z",
            "clientName": "应用4"
          },
        ],
        "createdAt": "2017-05-22T14:28:30.000Z",
        "updatedAt": "2017-05-22T14:28:30.000Z"
      }
}
```


#### 获取用户列表

**GET** `/v1/admin/oauthUser/list`

请求参数：

```
pageIndex: 页码
pageSize: 每页记录数
deparmentName: 部门名称
roleName: 角色名称
keyWords: 关键字模糊匹配（username和realname）
```

Response:

```javascript
{
    "code": 1,
    "isSuc": true,
    "result": {
        "count": 2,
        "items": [
        {
            "id": 23,
            "username": "hlb",
            "password": "c4ca4238a0b923820dcc509a6f75849b",
            "realname": "胡萝卜",
            "sex": "男",
            "birthday": null,
            "telphone": null,
            "cellphone": null,
            "address": null,
            "postcode": null,
            "email": null,
            "qq": null,
            "msn": null,
            "state": 1,
            "remarks": null,
            "roles": [
              {
                "id": 13,
                "name": "分公司2",
                "state": 1,
                "remarks": null,
                "parentId": 0,
                "orderNum": 0,
                "createdAt": null,
                "updatedAt": null
              }
            ],
            "departments": [
              {
                "id": 41,
                "name": "admin",
                "level": 0,
                "description": "33 0",
                "state": 1,
                "remarks": null,
                "parentId": 1,
                "orderNum": 0,
                "createdAt": null,
                "updatedAt": null
              },
              {
                "id": 45,
                "name": "各分公司管理员",
                "level": 0,
                "description": " ",
                "state": 1,
                "remarks": " ",
                "parentId": 41,
                "orderNum": 0,
                "createdAt": null,
                "updatedAt": null
              }
            ],
            "allowClients": [],
            "configAllowClients": [],
            "configDisallowClients": [],
            "areaId": "0",
            "registerDate": "2013-07-09T13:00:41.000Z",
            "logonCount": 0,
            "createdAt": null,
            "updatedAt": null
        }]
    }
}
```

#### 日志审计接口

**GET** `/admin/audit-logs`

请求参数：

```
pageSize: 每页记录数，必须
pageIndex: 页码， 必须， 从1开始
type: 日志类型，可选， 值为 request(普通请求)，login(登陆),logout(注销)
clientName: 应用名称, 可选
operator: 操作人(user name)， 可选
startTime: 开始时间，可选
endTime: 结束时间，可选
```

Response:

```javascript
{
    "code": 1,
    "isSuc": true,
    "result": {
        "rows": [{
            "id": 1,
            "uri": "http://www.cuit.edu.cn",
            "ip": "::1",
            "operator": "hlb",
            "remarks": "",
            "description": "This is a test client.",
            "icon": "/img/a1.jpg",
            "index": 999,
            "type": 1,
            "active": 1,
            "clientId": "idoftestclient",
            "operationType": "login",
            "uriType": "front",
            "createdAt": "2016-10-10T10:23:04.000Z",
            "updatedAt": "2017-05-14T07:21:33.000Z",
            "clientOwner": "abovegem",
            "clientSecret": "abovegem",
            "clientName": "应用1",
            "redirectUri": "http://localhost:3001/oauth2callback",
            "isSelf": 1,
            "needAuth": 1,
            "testUsers": null
        }],
        "count": 1
    },
    "meta": {
        "x-server-current-time": "2017-05-28T23:01:48+08:00",
        "code": 200
    }
}
```

#### 分页获取admin user信息

**GET** `/v1/admin/users?pageIndex=1&pageSize=10&keyWords=`

Response：

```javascript
{
    "code": 1,
    "isSuc": true,
    "result": {
        "count": 1,
        "items": [
          {
            "id": 1,
            "phone": "11111",
            "email": "tolibo@qq.com",
            "userName": "admin",
            "isDelete": 0,
            "createdAt": "2016-11-20T16:41:28.000Z",
            "updatedAt": "2017-05-28T16:42:49.000Z"
          }
        ]
    },
    "meta": {
        "x-server-current-time": "2017-05-29T01:08:45+08:00",
        "code": 200
    }
}
```

#### 添加admin user

**POST** `/v1/admin/users`

参数：

```
{
    userName: 'libo',
    password: '1',
    phone: '22222',
    email: 'tolibo@hotmail.com'
}
```

返回：

```javascript
{
      "code": 1,
      "isSuc": true,
      "result": {
        "id": 4,
        "phone": "22222",
        "email": "tolibo@hotmail.com",
        "userName": "libo1",
        "updatedAt": "2017-05-28T17:11:06.000Z",
        "createdAt": "2017-05-28T17:11:06.000Z"
      },
      "meta": {
        "x-server-current-time": "2017-05-29T01:11:06+08:00",
        "code": 200
      }
}
```

#### 更新admin user

**PUT** `/v1/admin/users/:userId`

参数：

```
{
    userName: 'admin1',
    password: '1',
    phone: '11111',
    email: 'tolibo@qq.com'
}
```

返回：

```javascript
{
      "code": 1,
      "isSuc": true,
      "result": {
        "id": 4,
        "phone": "22222",
        "email": "tolibo@hotmail.com",
        "userName": "libo1",
        "updatedAt": "2017-05-28T17:11:06.000Z",
        "createdAt": "2017-05-28T17:11:06.000Z"
      },
      "meta": {
        "x-server-current-time": "2017-05-29T01:11:06+08:00",
        "code": 200
      }
}
```

#### 删除admin user

**DELETE** `/v1/admin/users/:userId`


返回：

```javascript
{
      "code": 1,
      "isSuc": true,
      "result": {
        "status": "success"
      },
      "meta": {
        "x-server-current-time": "2017-05-29T01:13:13+08:00",
        "code": 200
      }
}
```

#### 进去Portal，显示用户有权限的web应用接口

**GET** `/v1/portal/users/:userId/webApps`

返回：

```javascript
{
    "code": 1,
    "isSuc": true,
    "result": [
        {
          "id": 8,
          "description": "profile",
          "uri": "cuit://profile",
          "icon": "/uploadImgs/2016/12/12/5d220b77-5a2f-4c58-9d76-b740560edf37.png",
          "index": 6,
          "type": 0,
          "active": 1,
          "clientId": "S+LHb/zWgzXC/4r0qWn",
          "clientOwner": "chengdu",
          "clientSecret": "L4hafO9+jERuF3LksVGLT3M",
          "clientName": "应用6",
          "redirectUri": "http://pan.cuit.edu.cn/appauth/sso/callback",
          "isSelf": 0,
          "needAuth": 0,
          "testUsers": null,
          "createdAt": "2016-12-11T15:36:52.000Z",
          "updatedAt": "2017-05-14T07:31:01.000Z"
        }
    ],
    "meta": {
        "x-server-current-time": "2017-05-29T16:42:53+08:00",
        "code": 200
    }
}
```

#### Portal 注销用户

**GET** `/v1/portal/logout`


返回:

```
注销后跳转到首页
```

#### Portal获取个人信息

**GET** `/portal/profile`

返回：

```javascript
{
    "code": 1,
    "isSuc": true,
    "result": {
        "id": 23,
        "areaId": "0",
        "username": "hlb",
        "realname": "胡萝卜",
        "sex": "男",
        "birthday": null,
        "telphone": null,
        "cellphone": null,
        "address": null,
        "postcode": null,
        "email": null,
        "qq": null,
        "msn": null,
        "registerDate": "2013-07-09T13:00:41.000Z",
        "logonCount": 0,
        "state": 1,
        "remarks": null,
        "roles": [
          {
            "userId": 23,
            "roleId": 41,
            "roleName": "admin",
            "parentRoleId": 1
          },
          {
            "userId": 23,
            "roleId": 45,
            "roleName": "各分公司管理员",
            "parentRoleId": 41
          }
        ],
        "departments": [
          {
            "userId": 23,
            "departmentId": 13,
            "departmentName": "分公司2",
            "parentDepartmentId": 0
          }
        ],
        "createdAt": null,
        "updatedAt": null
    },
    "meta": {
        "x-server-current-time": "2017-05-30T14:30:55+08:00",
        "code": 200
    }
}
```


#### Portal修改个人信息

**PUT** `/portal/profile`

```javascript
{
    username: "test1003",
    password: "1",   //为空则不更新password，不为空则更新为对应的值
    realname: "test2",
    sex: "女",
    birthday: "2017-01-01",
    telphone: "111111112",
    cellphone: "111112",
    address: "2dahkdakjdahdkjahdkjahk2",
    postcode: "6100412",
    email: "tolibo2@qq.com",
    qq: "2637424062",
    msn: "2637424062@msn.com",
    remarks: "2",
}
```

返回：

```javascript
{
    status: 'success'
}
```





