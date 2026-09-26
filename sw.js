const CACHE = "sensevoice-v4";

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./assets/sherpa-onnx-asr.js",
  "./assets/sherpa-onnx-wasm-web.js",
  "./assets/sherpa-onnx-wasm-web.wasm"
];

self.addEventListener(
  "install",
  event => {
    event.waitUntil(
      caches
        .open(CACHE)
        .then(cache => {
          return cache.addAll(
            CORE_ASSETS
          );
        })
        .then(() => {
          return self.skipWaiting();
        })
    );
  }
);

self.addEventListener(
  "activate",
  event => {
    event.waitUntil(
      caches
        .keys()
        .then(keys => {
          return Promise.all(
            keys
              .filter(
                key => key !== CACHE
              )
              .map(key => {
                return caches.delete(
                  key
                );
              })
          );
        })
        .then(() => {
          return self.clients.claim();
        })
    );
  }
);

self.addEventListener(
  "fetch",
  event => {

    const request =
      event.request;

    if (
      request.method !== "GET"
    ) {
      return;
    }

    const url =
      new URL(request.url);

    /*
      Service Worker 只處理自己的 origin。
    */
    if (
      url.origin !== location.origin
    ) {
      return;
    }

    event.respondWith(
      caches.match(
        request
      ).then(cached => {

        if (cached) {
          return cached;
        }

        return fetch(
          request
        ).then(response => {

          if (
            !response ||
            !response.ok
          ) {
            return response;
          }

          const copy =
            response.clone();

          caches
            .open(CACHE)
            .then(cache => {
              return cache.put(
                request,
                copy
              );
            })
            .catch(error => {
              console.warn(
                "Service Worker cache failed:",
                error
              );
            });

          return response;

        });
      })
    );
  }
);
