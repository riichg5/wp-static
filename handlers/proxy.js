let httpProxy = require('http-proxy');
let url = require('url');
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

function isNeedStatic (req) {
    let url = req.url;

    if(!isStaticOn) {
        return false;
    }

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

function getLocalFilePath (req, pathname) {

    if(isAmpPage(req)) {
        pathname = pathname.replace('/amp', '');
        pathname += '.amp';

        return mHtmlPath + pathname;
    }

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
    // console.log(`res.statusCode: ${res.proxyRes.statusCode}`);
    // console.log(`res.headers: ${res.proxyRes.headers}`);
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

function onProxyRes (proxyRes, req, res) {
    res.proxyRes = proxyRes;
}

function processScript (opts) {
    let html = opts.html;
    let request = opts.request;

    //移除header里面的googletagmanager
    /*
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

    //移除mobile文章标题banner 广告
    /*
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

    return html;
}

function processAds (opts) {
    let html = opts.html;
    let request = opts.request;
    let adsConfig = _config.get("ads");

    if(!adsConfig || !adsConfig.isOn) {
        return html;
    }

    let headerlinkAdPC = adsConfig.headerlinkAdPC;
    let headerlinkMobile = adsConfig.headerlinkMobile;

    /*暂时移除标题顶部文字链接广告*/
    // if(isPcClient(request) && headerlinkAdPC) {
    //     html = html.replace(/(autoptimize_)\S+(\.css)/, `autoptimize_4038f49b0ca942d54e086868e610f7d6_v2.css`);
    //     html = html.replace(`<header class="entry-header">`, `
    //         <div class="entry-header header-linkad">
    //             ${headerlinkAdPC}
    //         </div>
    //         <header class="entry-header entry-header-notop">
    //     `);
    //     return html;
    // }

    if(!isPcClient(request) && headerlinkMobile) {
        html = html.replace(/(autoptimize_)\S+(\.css)/, `autoptimize_4038f49b0ca942d54e086868e610f7d6_v2.css`);
        html = html.replace(`<header class="entry-header">`, `
            <div class="entry-header header-linkad">
            ${headerlinkMobile}
            </div>
            <header class="entry-header entry-header-notop">
        `);

        return html;
    }

    return html;
}

function processHeaders (opts) {
    let response = opts.response;
    let responseInfo = opts.responseInfo;

    let oldHeader = responseInfo.headers;

    if(oldHeader) {
        let contentType = oldHeader['content-type'];
        if(contentType) {
            response.setHeader('content-type', contentType);
        }
    }
}

proxy.on('proxyRes', onProxyRes);

async function proxyHandler (request, response, next) {
    let context = request.context;
    let requestUrl = request.url.trim().toLowerCase();
    let requestUrlObj = url.parse(requestUrl.replace(/\/amp\//gi, '/amp'));
    let pathname = requestUrlObj.pathname;
    let localFilePath = getLocalFilePath(request, pathname);
    let _write = response.write;
    let _end = response.end;

    console.log(`requset url: ${requestUrl}`);

    //直接返回
    let isFileExist = await pExists(localFilePath);

    // console.log(`isFileExist: ${isFileExist}`);
    if(isNeedStatic(request) && isFileExist) {
        // console.log(`${localFilePath} is exist, start readFile.`);
        fs.readFile(localFilePath, 'utf8', (error, data) => {
            if(error) {
                response.status(500).send('error');
                return;
            }

            //只从静态文件里面抓取content-type返回
            let responseInfo = JSON.parse(data);

            processHeaders({
                response: response,
                responseInfo: responseInfo
            });

            responseInfo.html = responseInfo.html.replace(/http:\/\/www.360zhijia.com\//gi, "https://www.360zhijia.com/");

            responseInfo.html = processScript({
                html: responseInfo.html,
                request: request
            });

            responseInfo.html = processAds({
                html: responseInfo.html,
                request: request
            });

            if(!isUCBrowser) {
                response.end(responseInfo.html);
            } else {
                response.end(responseInfo.html.replace(/ad-pc ad-site/gi, "aa-pc aa-site"));
            }
        });
        return;
    }

    /************************* 透传 *************************/
    //预防直接301
    request.headers.host = originalHostname;

    response.end = function (data) {
        // console.log(`res.end count:`, count);
        onResponseEnd(request, response);
        _end.call(response, data);
    };

    response.write = function (data) {
        onWrite(request, response, data);

        let contentType = response.get('Content-Type');

        if(contentType && contentType.indexOf('text/html') !== -1) {
            _write.call(response,
                data.toString()
                .replace(/http:\/\/www.360zhijia.com\//gi, "https://www.360zhijia.com/")
            );
        } else {
            _write.call(response, data);
        }
    };

    proxy.web(request, response, {
        target: proxyDomain
    }, function (error) {
        //error
        console.log(`proxy error ${requestUrl}: ${error.message}, stack: ${error.stack}`);
        response.proxyRes = {
            headers: {},
            statusCode: 500
        };
        response.status(500).end('Server Error');
    });
}

function handler() {
    return proxyHandler;
}

module.exports = handler;