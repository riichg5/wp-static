const httpProxy = require('http-proxy');
const url = require('url');
const fs = require('fs');
const mkdirp = require('mkdirp');
const pMkdirp = _util.promisify(mkdirp);
const proxyDomain = _config.get('proxyDomain');
const pExists = _util.promisify(fs.exists);
const originalHostname = _config.get('originalHostname');
const isStaticOn = _config.get('isStaticOn');
const htmlPath = _config.get('htmlPath');
const mHtmlPath = _config.get('mobileHtmlPath');
const lockHelper = require(_base + 'lib/lockHelper');
const typeis = require('type-is');
const proxy = new httpProxy.createProxyServer();

// 注意，此值必须小些
const RetainHeaders = ['content-type'];

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
        html = html.replace(/(<div class="tg-m tg-site">)[\S|\s]+(2018527320"><\/ins>\r\n<script>\r\n\(adsbygoogle \= window\.adsbygoogle \|\| \[\]\)\.push\(\{\}\);\r\n<\/script><\/div>)/i, '');
    }

    /**
        去掉文章页面的social div，让下面的广告更贴近文章内容
    */
    html = html.replace(`<div id="social"></div>`, '');

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

/**
 * 是否需要静态化处理
 * @param {*} req 
 */
function isNeedStatic (req) {
    const url = req.url.trim().toLowerCase();

    if(!isStaticOn) {
        return false;
    }
    if(isAdminPage(url)) {
        return false;
    }
    if(url.endsWith('.html') && url.indexOf('.php') === -1) {
        return true;
    }
    return false;
}

function isHomePage (pageUrl) {
    return pageUrl === '/' || pageUrl === '';
}

function isAdminPage(pageUrl) {
    const isWpAdminPage = pageUrl.indexOf('wp-admin') !== -1;
    const isAdminLogin = pageUrl.indexOf('wp-login.php') !== -1;
    if(isWpAdminPage || isAdminLogin) {
        return true;
    }
    return false;
}

function isCss(urlObj) {
    return urlObj.pathname.endsWith('.css');
}

function isJs(urlObj) {
    return urlObj.pathname.endsWith('.js');
}

function isCSSOrJs(pageUrl) {
    const urlObj = url.parse(pageUrl);
    return isCss(urlObj) || isJs(urlObj);
}

function isNeedChangeContent(req, proxyRes) {
    const pageUrl = req.url.toLowerCase().trim();
    const istext = typeis(proxyRes, ['text/*']);
    const urlObj = url.parse(pageUrl);
    if (
        !istext || 
        isAdminPage(pageUrl) ||
        urlObj.pathname.endsWith('.js') || 
        urlObj.pathname.endsWith('.css') ||
        urlObj.pathname.endsWith('.woff') ||
        urlObj.pathname.endsWith('.ttf')
    ) {
        console.log(`${pageUrl} 不处理`);
        return false;
    }
    return true;
}

function isAmpPage (req) {
    const url = req.url;
    if(url.endsWith('/amp') || url.endsWith('/amp/')) {
        return true;
    }
    return false;
}

function isUCBrowser (req) {
    if(!_.isUndefined(req.isUCBrowser)) {
        return req.isUCBrowser;
    }
    const userAgent = req.headers['user-agent'];
    req.isUCBrowser = userAgent && userAgent.toLowerCase().indexOf('ucbrowser') !== -1;
    return req.isUCBrowser;
}

function getLowerHeader(proxyResHeaders) {
    const pureHeader = Object.create(null);
    for (const key in proxyResHeaders) {
        if (proxyResHeaders.hasOwnProperty(key)) {
            pureHeader[key.toLowerCase()] = proxyResHeaders[key];
        }
    }
    return pureHeader;
}

function getDirectoryPath (localFilePath) {
    const lastIndex = _.lastIndexOf(localFilePath, "/");
    return localFilePath.substring(0, lastIndex);
}

function isPcClient (req) {
    let isPcClient = !req.useragent.isMobile && !isUCBrowser(req);
    console.log(`is pc client: ${isPcClient}`);

    return isPcClient;
}

function isPcArticleRequest (req) {
    const isPcClient = !(req.useragent.isMobile || isUCBrowser(req));
    const isArticlePage = req.url.trim().toLowerCase().endsWith('.html');

    return isPcClient && isArticlePage;
}

function isMobileArticleRequest (req) {
    const isMobileClient = req.useragent.isMobile || isUCBrowser(req);
    const isArticlePage = req.url.trim().toLowerCase().endsWith('.html');

    return isMobileClient && isArticlePage;
}

/**
 * 根据终端类型，返回静态页面存储路径
 * @param {*} req 
 * @param {*} pathname 
 */
function getLocalFilePath (req, pathname) {
    if(isPcClient(req)){
        return htmlPath + pathname;
    }
    return mHtmlPath + pathname;
}

/**
 * 写入静态页面文件
 * @param {*} proxyRes 
 * @param {*} req 
 * @param {*} html 
 */
async function writeStaticHtml (proxyRes, req, html) {
    if(
        !isNeedStatic(req) || proxyRes.statusCode !== 200
    ) {
        return;
    }

    const requestUrl = req.url.trim().toLowerCase();
    const requestUrlObj = url.parse(requestUrl);
    const pathname = requestUrlObj.pathname;
    const localFilePath = getLocalFilePath(req, pathname);
    const context = req.context;

    const [isLock, isExist] = await Promise.all([
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
            headers: getLowerHeader(proxyRes.headers), //需要小些化key写入
            html: html
        };

        /*
            解决nodejs写中文内容有乱码的问题
            https://www.jianshu.com/p/8c04fb552c6f
        */
        const text = JSON.stringify(fileInfo);
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

/**
 * http proxy 代理请求中间内容处理方法
 * @param {*} proxyRes 
 * @param {*} req 
 * @param {*} res 
 */
function onProxyRes(proxyRes, req, res) {
    console.log(`
        url: ${req.url},
        proxyRes.statusCode: ${proxyRes.statusCode}, 
        proxyRes header => ${JSON.stringify(proxyRes.headers)}
    `);
    // 保留statusCode
    res.statusCode = proxyRes.statusCode;
    // 保留header
    for (const header in proxyRes.headers) {
        const lowerHeader = header.toLowerCase();
        if (RetainHeaders.indexOf(lowerHeader) !== -1) {
            res.setHeader(header, proxyRes.headers[header]);
        }
    }    
    let body = Buffer.from([]); //new Buffer('');
    proxyRes.on('data', function (data) {
        body = Buffer.concat([body, data]);
    });

    proxyRes.on('end', function () {
        if (res.statusCode < 200 && res.statusCode >= 300) {
            console.log(`statusCode为${res.statusCode}，不处理`);
            res.end(body);
            return;
        }
        const isNeedChange = isNeedChangeContent(req, proxyRes);
        if (!isNeedChange) {
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
        writeStaticHtml(proxyRes, req, body)
            .then(() => {})
            .catch(error => {
            });
    });
}

function processHeaders (opts) {
    const response = opts.response;
    const responseInfo = opts.responseInfo;

    let oldHeader = responseInfo.headers;
    if(oldHeader) {
        for(const header of RetainHeaders) {
            const headerVal = oldHeader[header];
            if (headerVal) {
                response.setHeader(header, headerVal);
            }
        }
    }
}

function processHtml (opts) {
    let request = opts.request;
    let html = opts.html;

    // html = html.replace(/http:\/\/www.360zhijia.com/gi, "https://www.a6se.com");
    // html = html.replace(/https:\/\/www.360zhijia.com/gi, "https://www.a6se.com");
    // html = html.replace(/http:\/\/www.360zhijia.cn/gi, "https:///www.a6se.com");
    // html = html.replace(/https:\/\/www.360zhijia.cn/gi, "https://www.a6se.com");
    // html = html.replace(/http:\/\/www.360zhijia.cn/gi, "https://www.a6se.com");
    // html = html.replace(/www.360zhijia.cn/gi, "www.a6se.com");
    //先把所有的css都指向autoptimize_4038f49b0ca942d54e086868e610f7d6.css
    // html = html.replace(/(autoptimize_)\S+(\.css)/, `autoptimize_4038f49b0ca942d54e086868e610f7d6.css`);

    // html = processOnPage({
    //     html: html,
    //     request: request
    // });

    // html = processAds({
    //     html: html,
    //     request: request
    // });

    if(isUCBrowser(request)) {
        html = html.replace(/ad-pc ad-site/gi, 'aa-pc aa-site');
    }

    return html;
}

function proxyResource(request, response) {
    proxy.web(request, response, {
        target: proxyDomain,
        selfHandleResponse: true
    }, function (error) {
        console.log(`proxy error ${request.url}: ${error.message}, stack: ${error.stack}`);
        response.proxyRes = {
            headers: {},
            statusCode: 500
        };
        response.status(500).end(`Server Error! error message: ${error.message}, error stack: ${error.stack}`);
    });
}

async function proxyHandler (request, response, next) {
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
            proxyResource(request, response);
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
                response: response,
                responseInfo: responseInfo
            });
            response.end(responseInfo.html);
        } catch (error) {
            response.status(500).send('error');
            return;
        }
        return;
    }
    
    proxyResource(request, response);
}

proxy.on('proxyRes', onProxyRes);
proxy.on('proxyReq', function (proxyReq, req, res, options) {
    //预防直接301
    proxyReq.setHeader('host', originalHostname);
});


module.exports = () => {
    return proxyHandler;
};