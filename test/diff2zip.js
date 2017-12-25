var fs = require("fs");
var yazl = require("yazl");

var differ = require("../");

var content1 = {
    "src/main.js": new Buffer("console.log('hello, world!')"),
    "src/img/logo.png": new Buffer(2048),
    "dist/bundle.js": new Buffer("")
};

var content2 = {
    "src/main.js": new Buffer("console.log('hello, world2!')"),
    "src/img/logo.png": new Buffer(1024),
    "dist/bundle.js": new Buffer("")
};

Promise.all([
    writeZipFile("./v1.zip", content1),
    writeZipFile("./v2.zip", content2)
]).then(function(){
    return differ.diff2zip("./v1.zip", "./v2.zip").then(function(stream){
        var outputStream = fs.createWriteStream("./update.zip");
        stream.pipe(outputStream);
        return new Promise(function(resolve, reject){
            outputStream.on("finish", resolve);
        });
    });
}).then(cleanFiles, cleanFiles);

function writeZipFile(file, obj) {
    var zipfile = new yazl.ZipFile();
    Object.keys(obj).forEach(function(entry){
        zipfile.addBuffer(obj[entry], entry);
    });
    var output = fs.createWriteStream(file);
    zipfile.outputStream.pipe(output);
    zipfile.end();
    return new Promise(function(resolve, reject){
        output.on("finish", resolve);
    })
}

function cleanFiles(){
    fs.unlink("./v1.zip");
    fs.unlink("./v2.zip");
    // fs.unlink("./update.zip", function(){});
}