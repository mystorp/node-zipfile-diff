# node-zipfile-diff
一个用于计算两个压缩包差异的简单库。

> 当软件包有更新时，根据这个库计算差异量，并只下载有差异的部分，节省流量。

## install
```bash
npm install zipfile-diff
```

## API

### `entryDiff(file1, file2)`
`Promise<Array<String>>`. 比较两个压缩包，成功时返回变更的 entry 数组。如：
```js
var differ = require("node-zipfile-diff");

differ.entryDiff("./v1.zip", "./v2.zip").then(function(entries){
    console.log(entries);
    // output: [ "test/1.txt", "test/test/2.txt"]
});
```

### `diff2zip(file1, file2)`
`Promise<Stream>`. 比较两个压缩包，成功时返回 zip 输出流。如：
```js
var differ = require("node-zipfile-diff");
differ.entryDiff("./v1.zip", "./v2.zip").then(function(stream){
    stream.pipe(fs.createReadStream("test.zip"));
});
```