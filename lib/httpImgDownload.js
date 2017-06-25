
let HttpGet = require('http-get');
let ShortId = require('shortid');
let FS = require('fs');
let MKDIRP = require('mkdirp');
let SizeOf = require('image-size');
let IMG_TYPES = ['.BMP', '.GIF', '.JPG', '.JPEG', '.PNG', '.PSD', '.TIFF', '.WEBP', '.SVG'];
let CONFIG = _config.get('crawler');

let HttpDownload = (function() {
    function HttpDownload() {}

    HttpDownload.pic_type_by_response = function(res) {
        var name, ref, type;
        ref = res.headers['content-type'].split('/'), type = ref[0], name = ref[1];
        return "." + name;
    };

    HttpDownload.get_pic_type_by_url = function(url) {
        return url.slice(url.lastIndexOf('.'));
    };

    HttpDownload.down_pic_by_url = function(url, cb) {
        var pic_name, pic_name_pre, pic_path, pic_type, self;

        self = this;
        pic_name_pre = ShortId.generate();
        pic_type = self.get_pic_type_by_url(url);
        pic_name = "" + pic_name_pre + pic_type;
        pic_path = CONFIG.UPLOAD_PIC_PATH + "/" + pic_name;
        if (pic_name.is_pic()) {
            return HttpGet.get({
                url: url
            }, pic_path, function(err, res) {
                if (err) {
                    return cb('failed');
                }
                return cb(null, pic_path);
          });
        } else {
            return cb('the_file_is_not_pic');
        }
    };

    HttpDownload.downloadImag = function(url, cb) {
        var options, pic_name_pre, self;
        self = this;
        pic_name_pre = ShortId.generate();
        options = {
            url: url,
            bufferType: "buffer"
        };

        return HttpGet.get(options, function(err, res) {
            var folder_name, pic_folder, pic_name, pic_path, pic_type, pic_url_path;
            if (err) {
                return cb('failed');
            }

            pic_type = self.pic_type_by_response(res);

            if (IMG_TYPES.indexOf(pic_type.toUpperCase()) === -1) {
                pic_type = self.get_pic_type_by_url(url);
                if (IMG_TYPES.indexOf(pic_type.toUpperCase()) === -1) {
                    return cb("failed");
                }
            }

            pic_name = "" + pic_name_pre + pic_type;
            folder_name = "" + ((new Date()).to_s('short'));
            pic_folder = CONFIG.UPLOAD_PIC_PATH + "/" + folder_name;
            pic_path = pic_folder + "/" + pic_name;
            pic_url_path = CONFIG.IMG_URL_PATH + "/" + folder_name + "/" + pic_name;

            return MKDIRP(pic_folder, function(err) {
                if (err) {
                    cb('failed');
                }
                return FS.writeFile(pic_path, res.buffer, function(err) {
                    var size;
                    if (err) {
                        return cb("failed");
                    }
                    size = SizeOf(res.buffer);
                    console.log(_util.inspect(size));

                    return cb(null, {
                        pic_url_path: pic_url_path,
                        width: size.width,
                        height: size.height
                    });
                });
            });
        });
    };

    return HttpDownload;

})();

module.exports = HttpDownload;
