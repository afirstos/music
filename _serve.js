var http = require('http');
var fs = require('fs');
var path = require('path');

var server = http.createServer(function(req, res) {
    var url = req.url.split('?')[0];
    var f = path.join(__dirname, url === '/' ? 'index.html' : url);
    fs.readFile(f, function(err, data) {
        if (err) {
            res.writeHead(404);
            res.end('Not found: ' + url);
            return;
        }
        var ext = path.extname(f).slice(1);
        var ct = {
            html: 'text/html; charset=utf-8',
            css: 'text/css; charset=utf-8',
            js: 'application/javascript; charset=utf-8',
            png: 'image/png',
            json: 'application/json',
            svg: 'image/svg+xml',
            webmanifest: 'application/manifest+json'
        };
        res.writeHead(200, {
            'Content-Type': ct[ext] || 'application/octet-stream',
            'Cache-Control': 'no-cache'
        });
        res.end(data);
    });
});

server.listen(8765, function() {
    console.log('http://localhost:8765');
});
