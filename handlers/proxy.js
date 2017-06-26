let httpProxy = require('http-proxy');
let url = require('url');
let fs = require('fs');
let mkdirp = require('mkdirp');
let pMkdirp = _util.promisify(mkdirp);
let proxy = new httpProxy.createProxyServer();
let proxyDomain = _config.get('proxyDomain');
let pExists = _util.promisify(fs.exists);
let originalHostname = _config.get('originalHostname');
let htmlPath = _config.get('htmlPath');
let lockHelper = require(_base + 'lib/lockHelper');

function isNeedStatic (req) {
    let url = req.url;
    let isMobile = req.useragent.isMobile;

    //手机不走静态
    if(isMobile) {
        // console.log(`is mobile: ${isMobile}`);
        return false;
    }

    if(
        url.substring(url.length - 5) === '.html' &&
        url.indexOf('.php') === -1
    ) {
        return true;
    }

    return false;
}

function getDirectoryPath (localFilePath) {
    let lastIndex = _.lastIndexOf(localFilePath, '\/');
    return localFilePath.substring(0, lastIndex);
}

async function onResponseEnd (req, res) {
    let requestUrlObj = url.parse(req.url);
    let pathname = requestUrlObj.pathname;
    let localFilePath = htmlPath + pathname;
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

proxy.on('proxyRes', onProxyRes);

function handler() {

    return async function(request, response, next) {
        let requestUrl = request.url;
        let requestUrlObj = url.parse(requestUrl);
        let pathname = requestUrlObj.pathname;
        let localFilePath = htmlPath + pathname;
        let _write = response.write;
        let _end = response.end;

        // console.log(`requset url: ${requestUrl}`);

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

                let responseInfo = JSON.parse(data);
                for(let key in responseInfo.headers) {
                    response.setHeader(key, responseInfo.headers[key]);
                }

                response.end(responseInfo.html);
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
            _write.call(response, data);
        };

        proxy.web(request, response, {
            target: proxyDomain
        }, function (e) {
            //error
            console.log('proxy error');
            response.proxyRes = {
                headers: {},
                statusCode: 500
            };
            response.status(500).end('Server Error');
        });
    }
}

module.exports = handler;