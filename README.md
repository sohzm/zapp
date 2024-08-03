![zapp screenshot](/web/other/images/screenshot.png)

a minimal ipnyb notebook like thingy

### Run

make sure you have [docker installed](https://docs.docker.com/engine/install)

```sh
docker run -p 8869:8869 sohzm/zapp
```

### Issues

- server should handle if old request is still running and new request is made
