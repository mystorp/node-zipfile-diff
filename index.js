var fs = require("fs");
var yazl = require("yazl");
var yauzl = require("yauzl");
var crypto = require("crypto");

exports.entryDiff = entryDiff;
exports.diff2zip = diff2zip;
exports.main = main;

if(module === require.main) {
    main();
}

function main(){
    var args = process.argv.slice(2);
    if(args.length < 2) {
        console.log("Usage: node " + __filename + " file1 file2");
        console.log()
    } else if(args.length === 2) {
        entryDiff(args[0], args[1]).then(function(files){
            console.log(files);
        });
    } else if(args.length === 3) {
        diff2zip(args[0], args[1]).then(function(stream){
            stream.pipe(fs.createWriteStream(args[2]));
        });
    }
}

function diff2zip(zipfile1, zipfile2) {
    return entryDiff(zipfile1, zipfile2).then(function(entries){
        var zipfile = new yazl.ZipFile();
        eachEntry(zipfile2, function(entry, next){
            var fileName = entry.fileName;
            if(entries.indexOf(fileName) !== -1) {
                this.openReadStream(entry, function(err, stream){
                    if(err) {
                        throw err;
                    }
                    zipfile.addReadStream(stream, fileName);
                    next();
                });
            } else {
                next();
            }
        }, function(error){
            if(error) {
                throw error;
            } else {
                zipfile.end();
            }
        });
        return zipfile.outputStream;
    });
}

/**
 * 计算 zipfile2 相对于 zipfile1 的差异
 */
function entryDiff(zipfile1, zipfile2) {
    return Promise.all([
        loopEntry(zipfile1),
        loopEntry(zipfile2)
    ]).then(function(arr){
        var hashValues1 = arr[0];
        var hashValues2 = arr[1];
        var entries = [];
        Object.keys(hashValues2).forEach(function(name){
            var hash = hashValues2[name];
            if(hashValues1.hasOwnProperty(name) && hash === hashValues1[name]) {
                return;
            }
            entries.push(name);
        });
        return entries;
    }).catch(function(err){
        console.error(err);
    });
}

function loopEntry(zipfile){
    var entryMD5Cache = {};
    return new Promise(function(resolve, reject){
        eachEntry(zipfile, function(entry, next){
            // directory
            if (/\/$/.test(entry.fileName)) {
                return;
            }
            this.openReadStream(entry, function(err, readStream) {
                if (err) {
                    var msg = "read entry " + entry.fileName + "  error: " + err.message;
                    return reject(new Error(msg));
                }
                streamMD5(readStream).then(function(md5){
                    entryMD5Cache[entry.fileName] = md5;
                    next();
                }).catch(function(error){
                    reject(new Error("unexpected error: " + error.message));
                });
            });
        }, function(error){
            if(error) {
                reject(error);
            } else {
                resolve(entryMD5Cache);
            }
        });
    });
}

function eachEntry(file, entryCallback, doneCallback) {
    var options = {lazyEntries: true, autoClose: true};
    if(!entryCallback) {
        throw new Error("arguments error");
    }
    doneCallback = doneCallback || function(){};
    yauzl.open(file, options, function(err, zipfile) {
        if(err) {
            return doneCallback(err);
        }
        var next = function(){
            zipfile.readEntry();
        };
        next();
        zipfile.on("entry", function(entry){
            var ret = entryCallback.call(zipfile, entry, next);
            // stop read when get `false` 
            if(false === ret) {
                zipfile.close();
            }
        });
        zipfile.on("end", doneCallback);
        zipfile.on("error", doneCallback);
    });
}

function streamMD5(stream) {
    return new Promise(function(resolve, reject){
        var hash = crypto.createHash("md5");
        stream.on("data", function(chunk){
            hash.update(chunk);
        });
        stream.on("end", function(){
            resolve(hash.digest("hex"));
        });
        stream.on("error", reject);
    });
}
