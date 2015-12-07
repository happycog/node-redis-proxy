var http = require('http'),
    httpProxy = require('http-proxy'),
    redis = require("redis"),
    redisClient = redis.createClient(6379, 'redis', {}),
    adminPort = process.env.ADMIN_PORT || 26542,
    proxy = httpProxy.createProxyServer({}),
    listenAddresses = [],
    portsToProxy = process.env.PORTS_TO_PROXY || "80",
    portMatches = portsToProxy.match(/(\d+)\s*-\s*(\d+)/);

if (portMatches) {
  for (var i=portMatches[1]; i<=portMatches[2]; i++) {
    if (i == adminPort) { continue; }
    listenAddresses.push(i);
  }
}
else {
  listenAddresses = [portsToProxy];
}

function abort404(res) {
    res.end('<html><body><style>html,body{width:100%;height:100%;}body { display: flex; align-items: center; justify-content: center; }</style><h1 style="color:#ccc;font-family:Helvetica Neue;font-weight:100;font-size:112px;">404</h1></body></html>');
}

var server = http.createServer(function(req, res) {
  if (!req.headers.host) {
      return abort404(res);
  }
  var host = req.headers.host.split(/\./);
  host.reverse();
  host = host.join('.');
  var port = req.socket.localPort;
  var ip = redisClient.get("upstream."+host+':'+port, function(err, value) {
    if (err || !value) {
      return abort404(res);
      // console.log('UNKNOWN HOST ', host, ':', port);
    }
    else {
      // console.log('PROXYING '+host+':'+port+' TO '+value);
      proxy.web(req, res, {"target": value}, function (e) {
          return abort404(res);
      });
    }
  });
});
console.log('Listening on ', listenAddresses.join(','));
listenAddresses.forEach(function(port) {
  server.listen(port);
});

var admin = http.createServer(function(req, res) {
  if (req.method == 'POST') {
    var body = '';
    req.on('data', function(data) {
      body += data;
    });
    req.on('end', function() {
      var upstreams = JSON.parse(body);
      for (var key in upstreams) {
        var value = upstreams[key];
        console.log('SAVING ', key, value);
        redisClient.set(key, value);
      }
      res.writeHead(200, {'Content-type':'application/json'});
      res.end(body);
    });
  }
  if (req.method == 'DELETE') {
    var body = '';
    req.on('data', function(data) {
      body += data;
    });
    req.on('end', function() {
      var upstreams = JSON.parse(body);
      for (var key in upstreams) {
        var upstream = upstreams[key];
        console.log('DELETING ', upstream);
        redisClient.del(upstream);
      }
      res.writeHead(200, {'Content-type':'application/json'});
      res.end(body);
    });
  }
});
admin.listen(adminPort);
