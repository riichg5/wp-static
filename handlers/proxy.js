const httpProxy = require('http-proxy');
const url = require('url');
let fs = require('fs');
let mkdirp = require('mkdirp');
let pMkdirp = _util.promisify(mkdirp);
let proxy = new httpProxy.createProxyServer();
let proxyDomain = _config.get('proxyDomain');
let pExists = _util.promisify(fs.exists);
let originalHostname = _config.get('originalHostname');
let isStaticOn = _config.get('isStaticOn');
let htmlPath = _config.get('htmlPath');
let mHtmlPath = _config.get('mobileHtmlPath');
let lockHelper = require(_base + 'lib/lockHelper');
const typeis = require('type-is');

function isNeedStatic (req) {
    let url = req.url.trim().toLowerCase();

    if(!isStaticOn) {
        return false;
    }

    // //判断首页
    // if(isHomePage(url) === true) {
    //     return true;
    // }

    if(url.endsWith('.html') && url.indexOf('.php') === -1) {
        return true;
    }

    if(
        (url.endsWith('/amp') || url.endsWith('/amp/')) && url.replace('/amp/', '').replace('/amp', '').endsWith('.html')
    ) {
        return true;
    }

    return false;
}

function isHomePage (pureUrl) {
    return pureUrl === '/' || pureUrl === '';
}

function isAmpPage (req) {
    let url = req.url;

    if(url.endsWith('/amp') || url.endsWith('/amp/')) {
        return true;
    }

    return false;
}

function isUCBrowser (req) {
    if(!_.isUndefined(req.isUCBrowser)) {
        return req.isUCBrowser;
    }

    let userAgent = req.headers['user-agent'];
    req.isUCBrowser = userAgent && userAgent.toLowerCase().indexOf('ucbrowser') !== -1;
    return req.isUCBrowser;
}

function getDirectoryPath (localFilePath) {
    let lastIndex = _.lastIndexOf(localFilePath, "/");
    return localFilePath.substring(0, lastIndex);
}

function isPcClient (req) {
    let isPcClient = !req.useragent.isMobile && !isUCBrowser(req);

    console.log(`is pc client: ${isPcClient}`);

    return isPcClient;
}

function isPcArticleRequest (req) {
    let isPcClient = !(req.useragent.isMobile || isUCBrowser(req));
    let isArticlePage = req.url.trim().toLowerCase().endsWith('.html');

    return isPcClient && isArticlePage;
}

function isMobileArticleRequest (req) {
    let isMobileClient = req.useragent.isMobile || isUCBrowser(req);
    let isArticlePage = req.url.trim().toLowerCase().endsWith('.html');

    return isMobileClient && isArticlePage;
}

function getLocalFilePath (req, pathname) {

    if(isAmpPage(req)) {
        pathname = pathname.replace('/amp', '');
        pathname += '.amp';

        return mHtmlPath + pathname;
    }

    // //处理首页
    // if(pathname === '/' && pathname === '') {
    //     pathname = '/default.html';
    // }

    //UC浏览器默认为移动终端浏览器
    // if(!req.useragent.isMobile && !isUCBrowser(req)) {
    if(isPcClient(req)){
        return htmlPath + pathname;
    }

    return mHtmlPath + pathname;
}

async function onResponseEnd (req, res) {
    let requestUrl = req.url.trim().toLowerCase();
    let requestUrlObj = url.parse(requestUrl.replace(/\/amp\//gi, '/amp'));
    let pathname = requestUrlObj.pathname;
    let localFilePath = getLocalFilePath(req, pathname);
    let context = req.context;

    //只有200才缓存
    if(isNeedStatic(req) && res.proxyRes.statusCode === 200) {
        delete res.proxyRes.headers.connection;
        delete res.proxyRes.headers['content-encoding'];

        let [isLock, isExist] = await Promise.all([
            lockHelper.pLock({
                context: context,
                name: localFilePath
            }),
            pExists(localFilePath)
        ]);

        // console.log(`isLock: ${isLock}, isExist: ${isExist}`);
        if(isLock === true && !isExist) {
            // console.log(`${localFilePath} is locked. and file is not exist.`);
            let fileInfo = {
                headers: res.proxyRes.headers,
                html: context.content.join('')
            };

            /*
                解决nodejs写中文内容有乱码的问题
                https://www.jianshu.com/p/8c04fb552c6f
            */
            let text = JSON.stringify(fileInfo, true, 2);
            // console.log("arguments: " + _util.inspect(arguments, {depth: 2}));

            await pMkdirp(getDirectoryPath(localFilePath));
            fs.writeFile(localFilePath, text, 'utf8', async function (error) {
                if(error) {
                    console.error(`write file error: ${error.message}, stack: ${error.stack}`);
                }

                await lockHelper.pUnlock({
                    context: context,
                    name: localFilePath
                });
            });
        }
    }
}

async function onWrite (req, res, data) {
    if(isNeedStatic(req)) {
        req.context.content.push(data.toString());
    }
}

function onProxyRes(proxyRes, req, res) {
    // res.proxyRes = proxyRes;
    console.log(`proxyRes => ${JSON.stringify(proxyRes.headers)}`);
    // if (
    //         !req.url.endsWith('html') 
    //         && !req.url.endsWith('.css')
    //         // && (req.url.indexOf('.php') === -1)
    //     ) {
    //     console.log(`${req.url} 不需要处理页面内容`);
    //     return;
    // }

    let body = new Buffer();
    proxyRes.on('data', function (data) {
        body = Buffer.concat([body, data]);
    });

    proxyRes.on('end', function () {
        const istext = typeis(proxyRes, ['text/*']);
        if (!istext) {
            console.log(`${req.url} 不处理`);
            res.end(body);
            return;
        }

        console.log(`${req.url} 要处理文本内容`);
        body = body.toString();
        const output = processHtml({
            request: req,
            html: body
        });
        res.end(output);
    });
}

function processOnPage (opts) {
    let html = opts.html;
    let request = opts.request;

    /**
        移除header里面的googletagmanager

        <script async src="https://www.googletagmanager.com/gtag/js?id=UA-94106519-1"></script>
        <script>
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', 'UA-94106519-1');
        </script>
    */
    // html = html.replace(`<script async src="https://www.googletagmanager.com/gtag/js?id=UA-94106519-1"></script>`, "");
    // html = html.replace(/(<script>)[\S|\s]+(UA-94106519-1'\);\n<\/script>)/, "");

    /**
        移除mobile页面，已有的文章标题下部广告

        <div class="tg-m tg-site"><script async src="//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
        <!-- 手机正文���部ing -->
        <ins class="adsbygoogle"
             style="display:inline-block;width:320px;height:50px"
             data-ad-client="ca-pub-0044506972792760"
             data-ad-slot="2018527320"></ins>
        <script>
        (adsbygoogle = window.adsbygoogle || []).push({});
        </script></div>
    */
    if(!isPcClient(request)) {
        // console.log(`html=> ${html}`);
        html = html.replace(/(<div class="tg-m tg-site">)[\S|\s]+(2018527320"><\/ins>\r\n<script>\r\n\(adsbygoogle \= window\.adsbygoogle \|\| \[\]\)\.push\(\{\}\);\r\n<\/script><\/div>)/i, "");
    }

    /**
        去掉文章页面的social div，让下面的广告更贴近文章内容
    */
    html = html.replace(`<div id="social"></div>`, "");

    return html;
}

function processAds (opts) {
    let html = opts.html;
    let request = opts.request;
    let adsConfig = _config.get("ads");

    if(!adsConfig || !adsConfig.isOn) {
        return html;
    }

    let requestUrl = request.url.trim().toLowerCase();
    let articleHeaderAdPC = adsConfig.articleHeaderAdPC;
    let articleHeaderMobile = adsConfig.articleHeaderMobile;
    let articleTitleBottomPC = adsConfig.articleTitleBottomPC;
    let articleRecommendMobile = adsConfig.articleRecommendMobile;  //移动文章推荐栏中间广告
    let googleRecommendPC = adsConfig.googleRecommendPC;            //谷歌PC文章推荐原生广告

    /**
        PC文章标题顶部广告
    */
    // if(isPcClient(request) && articleHeaderAdPC) {
    //     html = html.replace(/(autoptimize_)\S+(\.css)/, `autoptimize_4038f49b0ca942d54e086868e610f7d6_v2.css`);
    //     html = html.replace(`<header class="entry-header">`, `
    //         <div class="entry-header header-linkad">
    //             ${articleHeaderAdPC}
    //         </div>
    //         <header class="entry-header entry-header-notop">
    //     `);
    //     return html;
    // }

    /**
        移动端文章标题顶部广告
    */
    if(isMobileArticleRequest(request) && articleHeaderMobile) {
        html = html.replace(/(autoptimize_)\S+(\.css)/, `autoptimize_4038f49b0ca942d54e086868e610f7d6_v3.css`);
        //原google广告
        // html = html.replace(`<header class="entry-header">`, `
        //     <div class="entry-header header-linkad">
        //     ${articleHeaderMobile}
        //     </div>
        //     <header class="entry-header entry-header-notop">
        // `);

        // html = html.replace(
        //     "<script async src=\"//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js\"></script><!-- 手机文章标题顶部 --><ins class=\"adsbygoogle\" style=\"display:block;margin:auto;width:300px;height:250px\" data-ad-client=\"ca-pub-0044506972792760\" data-ad-slot=\"2984604849\"></ins><script>(adsbygoogle = window.adsbygoogle || []).push({});</script>",
        //     `${articleHeaderMobile}`
        // );

        // if(request.url.trim().toLowerCase() === '/360help/354727.html') {
        //     console.log(`=>${html}`);
        // }

        //西安微趣广告
        html = html.replace(`<header class="entry-header">`, `
            <div class="entry-header header-linkad">
                <script src='https://xin.pozwf.cn/?id=40060'></script>
                <script async src="//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
                <!-- 移动顶部小横幅 -->
                <ins class="adsbygoogle"
                     style="display:block;margin:auto;width:320px;height:100px"
                     data-ad-client="ca-pub-0044506972792760"
                     data-ad-slot="1344549998"></ins>
                <script>
                (adsbygoogle = window.adsbygoogle || []).push({});
                </script>
            </div>
            <header class="entry-header entry-header-notop">
        `);

        html = html.replace(
            "<script async src=\"//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js\"></script><!-- 手机文章标题顶部 --><ins class=\"adsbygoogle\" style=\"display:block;margin:auto;width:300px;height:250px\" data-ad-client=\"ca-pub-0044506972792760\" data-ad-slot=\"2984604849\"></ins><script>(adsbygoogle = window.adsbygoogle || []).push({});</script>",
            `
                <script src='https://xin.pozwf.cn/?id=40060'></script>
                <script async src="//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
                <!-- 移动顶部小横幅 -->
                <ins class="adsbygoogle"
                     style="display:block;margin:auto;width:320px;height:100px"
                     data-ad-client="ca-pub-0044506972792760"
                     data-ad-slot="1344549998"></ins>
                <script>
                (adsbygoogle = window.adsbygoogle || []).push({});
                </script>
            `
        );
        // <----西安微趣广告结束----->

        // return html;
    }

    /**
        移动文章推荐栏中间广告
        先阶段不适用，处理不好样式...
    */
    // if(isMobileArticleRequest(request) && articleRecommendMobile) {
    //     html = html.replace(
    //         /<aside id="random_post-2"/i,
    //         `<div>${articleRecommendMobile}</div><aside id="random_post-2"`
    //     );
    // }

    /**
        PC顶部banner广告
    */
    if(isPcArticleRequest(request)) {
        if(articleTitleBottomPC) {
            html = html.replace(
                /(<div class="tg-pc tg-site">)[\S|\s]+(1720017976"><\/ins>\r\n<script>\r\n\(adsbygoogle \= window\.adsbygoogle \|\| \[\]\)\.push\(\{\}\);\r\n<\/script><\/div>)/i,
                articleTitleBottomPC
            );
        }
    }

    /*
        下面是谷歌文章推荐 原生广告
    */
    if(isPcArticleRequest(request) && googleRecommendPC) {
        // html = html.replace(
        //     /<div id="comments"/i,
        //     `<div class="wow fadeInUp">${googleRecommendPC}</div><div id="comments"`
        // );
        html = html.replace(
            /<nav class="nav-single/i,
            `<div class="wow fadeInUp">${googleRecommendPC}</div><nav class="nav-single"`
        );
    }

    return html;
}

function processHeaders (opts) {
    const response = opts.response;
    const responseInfo = opts.responseInfo;
    const reponseHtml = opts.reponseHtml;

    let oldHeader = responseInfo.headers;
    if(oldHeader) {
        // 保留content-type
        let contentType = oldHeader['content-type'];
        if(contentType) {
            response.setHeader('content-type', contentType);
        }
    }
    //重新计算大小
    const contentLength = Buffer.byteLength(reponseHtml, 'utf8');
    response.setHeader('Conent-Length', contentLength);
    console.log(`Conent-Length: ${contentLength}`);
}

function processHtml (opts) {
    let request = opts.request;
    let html = opts.html;

    // if(!isStaticOn) {
    //     return html;
    // }

    html = html.replace(/http:\/\/www.360zhijia.com/gi, "https://www.a6se.com");
    html = html.replace(/https:\/\/www.360zhijia.com/gi, "https://www.a6se.com");
    html = html.replace(/http:\/\/www.360zhijia.cn/gi, "https:///www.a6se.com");
    html = html.replace(/https:\/\/www.360zhijia.cn/gi, "https://www.a6se.com");
    html = html.replace(/http:\/\/www.360zhijia.cn/gi, "https://www.a6se.com");
    html = html.replace(/www.360zhijia.cn/gi, "www.a6se.com");
    //先把所有的css都指向autoptimize_4038f49b0ca942d54e086868e610f7d6.css
    html = html.replace(/(autoptimize_)\S+(\.css)/, `autoptimize_4038f49b0ca942d54e086868e610f7d6.css`);

    html = processOnPage({
        html: html,
        request: request
    });

    html = processAds({
        html: html,
        request: request
    });

    if(isUCBrowser(request)) {
        html = html.replace(/ad-pc ad-site/gi, "aa-pc aa-site");
    }

    return html;
}

proxy.on('proxyRes', onProxyRes);
proxy.on('proxyReq', function (proxyReq, req, res, options) {
    //预防直接301
    proxyReq.setHeader('host', originalHostname);
});

async function proxyHandler (request, response, next) {
    let context = request.context;
    let requestUrl = request.url.trim().toLowerCase();
    let requestUrlObj = url.parse(requestUrl.replace(/\/amp\//gi, '/amp'));
    let pathname = requestUrlObj.pathname;
    let localFilePath = getLocalFilePath(request, pathname);

    console.log(`requset url: ${requestUrl}`);
    if (isNeedStatic(request)) {
        //直接返回
        let isFileExist = await pExists(localFilePath);
        console.log(`isFileExist: ${isFileExist}, localFilePath: ${localFilePath}`);
        if (!isFileExist) {
            return;
        }
        console.log(`${localFilePath} is exist, start readFile.`);
        try {
            const data = fs.readFileSync(localFilePath, 'utf8');
            //只从静态文件里面抓取content-type返回
            let responseInfo = JSON.parse(data);
            responseInfo.html = processHtml({
                request: request,
                html: responseInfo.html
            });
            processHeaders({
                response: res,
                responseInfo: responseInfo,
                reponseHtml: responseInfo.html
            });
            res.end(responseInfo.html);
        } catch (error) {
            response.status(500).send('error');
            return;
        }
        return;
    }

    proxy.web(request, response, {
        target: proxyDomain,
        selfHandleResponse: true
    }, function (error) {
        //error
        console.log(`proxy error ${requestUrl}: ${error.message}, stack: ${error.stack}`);
        response.proxyRes = {
            headers: {},
            statusCode: 500
        };
        response.status(500).end(`Server Error! error message: ${error.message}, error stack: ${error.stack}`);
    });
}

function handler() {
    return proxyHandler;
}

module.exports = handler;