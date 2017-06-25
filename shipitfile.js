var util = require('util');

module.exports = function (shipit) {
    require('shipit-deploy')(shipit);
    var applicationName = "cuit";

    shipit.initConfig({
        production: {
            servers: 'ubey@210.41.228.134:5022',
            deployTo: '~/api',
            branch: 'master'
        },
        demo: {
            servers: 'riich@123.57.158.14',
            deployTo: '~/api',
            branch: 'master'
        },
        default: {
            workspace: '/tmp/campus-portal',  //本地的临时工作目录
            // deployTo: '/mnt/data/www/message-center',
            repositoryUrl: 'git@github.com:ubey/campus-portal.git',
            ignores: ['.git', 'node_modules'],
            keepReleases: 2,
            deleteOnRollback: false,
            // shallowClone: true,
            // dirToCopy: ""
        }
    });

    shipit.task('pwd', function () {
        shipit.remote('pwd').then(function (res) {
            shipit.emit('pwd', res);
        }).catch(function (error) {
            console.log(error);
        });
    });

    shipit.task("db:migrate",function(){
        return shipit.remote('pwd');
    });

    shipit.task("pm2", function () {
        shipit.remote("~/.nvm/v0.12.9/bin/pm2 describe api_ric").then(function (res) {
            console.log(res['0'].stdout);
        }).catch(function (error) {
            console.log(error);
        });
    });

    shipit.task("nvm", function () {
        shipit.remote("source ~/.nvm/nvm.sh && nvm list").then(function (res) {
            console.log(res['0'].stdout);
        }).catch(function (error) {
            console.log(error);
        });
    });

    shipit.task("test", function () {
        let command = [
            " cd ~/api/current",
            " && ln -s ~/api/crawlerImgs public/crawlerImgs",
            " && ln -s ~/api/upload public/upload",
            " && ln -s ~/api/uploadImgs public/uploadImgs"
        ].join(" ");
        return shipit.remote(command);

        // shipit.remote("echo $SHELL && source ~/.nvm/nvm.sh && nvm use v6.9.1 && node -v").then(function (res) {
        //     console.log(res['0'].stdout);
        // }).catch(function (error) {
        //     console.log(error);
        // });
    });


    shipit.task("restart refactor", function (argument) {
    });

    shipit.blTask("deploy:check_autoship_lock", function () {
        var currentPath = shipit.currentPath;
        var command = `cd ${currentPath} && if [ -f autoship_running.lock ]; then echo 'yes'; else echo 'no'; fi `

        return shipit.remote(command)
        .then(res => {
            return Promise.reject(new Error(res['0'].stdout));
        })
        .catch(function (res) {
            var msg = res.toString();
            console.log("excute result:", msg);
            if(msg.indexOf('yes') !== -1) {
                return Promise.reject(new Error("autoship running lock."));
            }
            else if(msg.indexOf('no') !== -1) {
                console.log("pass the check of autoship.")
                return Promise.resolve();
            }

            return Promise.reject("unknown error.");
        });
    });

    shipit.on('pwd', function (res) {
        console.log("pwd", arguments);
    });

    var getStartScript = function (shipit, make) {
        return [
            "cd " + shipit.currentPath + "/",
            "&& make "+ make +" && npm install",
            "&& pm2 start pm2_config.json"
        ].join(" ");
    };

    var getRestartScript = function (shipit, make) {
        return [
            "cd " + shipit.currentPath + "/",
            "&& make "+ make +" && npm install",
            "&& pm2 sendSignal SIGUSR2 " + applicationName,
            "&& sleep 15 && pm2 stop " + applicationName,
            "&& pm2 delete " + applicationName,
            "&& pm2 kill && pm2 start pm2_config.json"
        ].join(" ");
    };

    function isPM2ExistApp(command, appName) {
        var cmd = command ? command : `pm2 describe ${appName}`
        return shipit.remote("source ~/.nvm/nvm.sh && nvm use v6.9.1  && " + cmd)
        .then(function (res) {
            return Promise.resolve('restart');
        }).catch(function (error) {
            return Promise.resolve('start');
        });
    }

    function devDeploy(opts) {
        let pm2ConfigName = opts.pm2ConfigName;
        let makeName = opts.makeName;
        let appName = opts.appName;
        let crawlerName = opts.crawlerName;
        let crawlerPm2ConfigName = opts.crawlerPm2ConfigName;
        let command = `nvm use v6.9.1 && pm2 describe ${appName}`;

        isPM2ExistApp(command, appName).then(operation => {
            if(operation === 'start') {
                return shipit.remote([
                    "cd " + shipit.currentPath + "/",
                    "&& make "+ makeName,
                    "&& rm -rf node_modules",
                    "&& source ~/.nvm/nvm.sh",
                    "&& nvm use v6.9.1",
                    "&& npm install --registry=https://registry.npm.taobao.org",
                    "&& pm2 start " + pm2ConfigName
                ].join(' '))
                return;
            }

            if(operation === 'restart') {
                return shipit.remote(
                    [
                        "cd " + shipit.currentPath + "/",
                        "&& make "+ makeName,
                        "&& rm -rf node_modules",
                        "&& source ~/.nvm/nvm.sh",
                        "&& nvm use v6.9.1",
                        "&& npm install --registry=https://registry.npm.taobao.org",
                        // "&& pm2 sendSignal SIGUSR2 " + appName,
                        // "&& sleep 5",
                        // "&& pm2 stop " + appName,
                        "&& pm2 delete " + appName,
                        // "&& ~/.nvm/v6.2.2/bin/pm2 start pm2_refactor_demo.json"
                        // "&& ~/.nvm/v6.2.2/bin/pm2 gracefulReload " + pm2ConfigName
                        "&& nvm use v6.9.1",
                        "&& pm2 start " + pm2ConfigName,
                        "&& sleep 5"
                    ].join(' ')
                );
            }
        }).then(() => {
            return isPM2ExistApp(`nvm use v6.9.1 && pm2 describe ${crawlerName}`).then(operation => {
                let pm2Command = [
                    "cd " + shipit.currentPath + "/",
                    "&& source ~/.nvm/nvm.sh",
                    "&& nvm use v6.9.1"
                ];

                if(operation === 'restart') {
                    pm2Command.push(" && pm2 delete " + crawlerName);
                }

                pm2Command.push(" && pm2 start " + crawlerPm2ConfigName);
                return shipit.remote(pm2Command.join(' '));
            });
        }).then(() => {
            //创建文件软连接
            let command = [
                " cd "+ shipit.currentPath +"/",
                " && ln -s ~/api/crawlerImgs public/crawlerImgs",
                " && ln -s ~/api/upload public/upload",
                " && ln -s ~/api/uploadImgs public/uploadImgs"
            ].join(" ");
            return shipit.remote(command);
        }).catch(function (error) {
            console.log(error);
        });
    }

    shipit.on("published",function() {
        if(shipit.options.environment === 'demo') {
            devDeploy({
                pm2ConfigName: "pm2_config.json",
                makeName: "init_demo",
                appName: "cuit",
                crawlerName: 'crawler',
                crawlerPm2ConfigName: 'pm2_crawler.json'
            });
            return;
        }

        if(shipit.options.environment === 'production') {
            devDeploy({
                pm2ConfigName: "pm2_config.json",
                makeName: "init_production",
                appName: "cuit",
                crawlerName: 'crawler',
                crawlerPm2ConfigName: 'pm2_crawler.json'
            });
            return;
        }
    });

    //before deploy, do some check.
    // shipit.on("deploy", function () {
        // return shipit.start("deploy:check_autoship_lock");
    // });
};