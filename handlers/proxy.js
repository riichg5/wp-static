let httpProxy = require('http-proxy');
let file = require('file');
let url = require('url');
let fs = require('fs');
let mkdirp = require('mkdirp');
let pMkdirp = _util.promisify(mkdirp);
let proxy = new httpProxy.createProxyServer();
let proxyDomainUrl = url.parse(_config.get('proxyDomain'));
let pExists = _util.promisify(fs.exists);

function getPath () {

}

function isProxyRequest (url) {
    if(url.substring(url.length - 5) === '.html') {
        return true;
    }

    return false;
}

function getDirectoryPath (localFilePath) {
    let lastIndex = _.lastIndexOf(localFilePath, '\/');
    return localFilePath.substring(0, lastIndex);
}

function handler() {
    return async function(request, response, next) {
        let requestUrl = request.url;
        let requestUrlObj = url.parse(requestUrl);
        let pathname = requestUrlObj.pathname;
        let localFilePath = _config.get('htmlPath') + pathname;

        console.log('request url: ' + requestUrl);
        console.log('request header: ' + require('util').inspect(request.headers));

        //直接返回
        let isFileExist = await pExists(localFilePath);
        if(isProxyRequest(requestUrl) && isFileExist) {
            console.log(`${localFilePath} is exist, start readFile.`);
            fs.readFile(localFilePath, 'utf8', (error, data) => {
                if(error) {
                    response.status(500).send('error');
                    return;
                }

                let responseInfo = JSON.parse(data);
                for(let key in responseInfo.headers) {
                    response.setHeader(key, responseInfo.headers[key]);
                }

                response.send(responseInfo.html);
            });
            return;
        }

        /************************* 透传 *************************/
        //预防直接301
        request.headers.host = proxyDomainUrl.hostname;

        proxy.web(request, response, {
            target: _config.get('proxyDomain')
        }, function (e) {
            //error
            console.log('proxy error');
        });


        proxy.on('proxyRes', function (proxyRes, req, res) {
            // console.log('Response headers:', _util.inspect(proxyRes.headers, {depth: 2}));
            let content = [];
            let _write = res.write;
            let _end = res.end;

            res.end = async function () {
                let requestUrlObj = url.parse(req.url);
                let pathname = requestUrlObj.pathname;
                let localFilePath = _config.get('htmlPath') + pathname;

                if(isProxyRequest(req.url)) {
                    console.log("response end.");
                    let fileInfo = {
                        headers: proxyRes.headers,
                        html: content.join('')
                    };
                    let text = JSON.stringify(fileInfo, true, 2);
                    // console.log("arguments: " + _util.inspect(arguments, {depth: 2}));

                    await pMkdirp(getDirectoryPath(localFilePath));
                    fs.writeFile(localFilePath, text, 'utf8', (error) => {
                        if(error) {
                            console.error(`write file error: ${error.message}, stack: ${error.stack}`);
                        }
                    });

                    _end.apply(res, arguments);
                }
            };

            res.write = function (data) {
                if(isProxyRequest(req.url)) {
                    content.push(data.toString());
                }
                _write.call(res, data);
            };
        });


    };
}

module.exports = handler;