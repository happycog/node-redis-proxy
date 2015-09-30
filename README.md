Node/Redis/Proxy
----

A super simple proxy that uses Redis as the back-end.

To get started spin up the node app and a redis server. The easiest way to do this is with `docker-compose`. Once you're up and running you can `POST` new upstreams via a JSON body on a POST request. You can specify multiple upstreams at a time.

```
POST / HTTP/1.1
Content-Type: application/json
Host: 192.168.99.100:26542
Connection: close
Content-Length: 67

{"upstream.com.example.subdomain:80":"http://192.168.99.100:32777"}
```

Proxied requests listen on port `80` by default but can listen on any port defined by the environment variable `PORTS_TO_PROXY`. This can be a single port or a range of ports, such as,

```
docker run -e PORTS_TO_PROXY=3000-60000 happycog/node-redis-proxy
```

There is currently no way to remove routes or balance between multiple upstreams. Sorry.
