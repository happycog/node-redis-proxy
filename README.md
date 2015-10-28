Node/Redis/Proxy
----

A simple proxy that uses Redis as the back-end.

To get started, spin up the node app and a redis server. The easiest way to do this is with `docker-compose`. Once you're up and running you can `POST` new upstreams. You can specify multiple upstreams at a time.

Upstreams must start with `upstream.` and follow with a reverse domain name, terminating in the port number.

```
POST / HTTP/1.1
Content-Type: application/json
Host: 192.168.99.100:26542
Connection: close
Content-Length: 67

{
  "upstream.com.example.subdomain:80":"http://192.168.99.100:32777",
  "upstream.com.example2:80":"http://192.168.99.100:32778"
}
```

The proxy listens on port `80` by default but can be configured with the environment variable `PORTS_TO_PROXY`. This can be a single port or a range of ports, such as:

```
docker run -e PORTS_TO_PROXY=3000-60000 happycog/node-redis-proxy
```

To delete a proxy you can send a `DELETE` request containing the upstream to be removed,

```
DELETE / HTTP/1.1
Content-Type: application/json
Host: 192.168.99.100:26542
Connection: close
Content-Length: 67

[
  "upstream.com.example.subdomain:80",
  "upstream.com.example2:80"
]
```
