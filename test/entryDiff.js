var fs = require("fs");
var yazl = require("yazl");

var differ = require("../");

var content1 = {
    "src/main.js": new Buffer("console.log('hello, world!')"),
    "src/img/logo.png": new Buffer(2048),
    "dist/bundle.js": new Buffer("")
};

var content2 = {
    "src/main.js": new Buffer("console.log('hello, world!')"),
    "src/img/logo.png": new Buffer(1024),
    "dist/bundle.js": new Buffer("")
};

var diffResult = ["src/img/logo.png"];

Promise.all([
    writeZipFile("./v1.zip", content1),
    writeZipFile("./v2.zip", content2)
]).then(function(){
    return differ.entryDiff("./v1.zip", "./v2.zip");
}).then(function(files){
    console.log(JSON.stringify(files) === JSON.stringify(diffResult));
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
}