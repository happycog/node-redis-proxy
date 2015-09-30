var http = require('http'),
    httpProxy = require('http-proxy'),
    redis = require("redis"),
    redisClient = redis.createClient(6379, 'redis', {});

var proxy = httpProxy.createProxyServer({});

var listenAddresses = [];
var portsToProxy = process.env.PORTS_TO_PROXY || "80";
var portMatches = portsToProxy.match(/(\d+)\s*-\s*(\d+)/);
if (portMatches) {
  for (var i=portMatches[1]; i<portMatches[2]; i++) {
    listenAddresses.push(i);
  }
}
else {
  listenAddresses = [portsToProxy];
}

var server = http.createServer(function(req, res) {
  var host = req.headers.host.split(/\./);
  host.reverse();
  host = host.join('.');
  var port = req.socket.localPort;
  var ip = redisClient.get("upstream."+host+':'+port, function(err, value) {
    if (err || !value) {
      console.log('UNKNOWN HOST ', host, ':', port);
    }
    else {
      console.log('PROXYING '+host+':'+port+' TO '+value);
      proxy.web(req, res, {"target": value});
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
});
admin.listen(26542);
