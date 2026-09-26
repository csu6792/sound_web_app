const CACHE = "sensevoice-v2";

const ASSETS = [
  "./",
  "./index.html",

  "./assets/sherpa-onnx-asr.js",
  "./assets/sherpa-onnx-wasm-web.js",
  "./assets/sherpa-onnx-wasm-web.wasm",

  "./assets/model.int8.onnx",
  "./assets/tokens.txt"
];


/*
 * Install
 *
 * 第一次安裝時預先下載所有核心資源。
 */
self.addEventListener("install", event => {

  event.waitUntil(

    caches
      .open(CACHE)

      .then(cache => {
        return cache.addAll(ASSETS);
      })

      .then(() => {
        return self.skipWaiting();
      })

  );

});


/*
 * Activate
 *
 * 清除舊版本 cache。
 */
self.addEventListener("activate", event => {

  event.waitUntil(

    caches
      .keys()

      .then(keys => {

        return Promise.all(

          keys
            .filter(key => key !== CACHE)
            .map(key => caches.delete(key))

        );

      })

      .then(() => {
        return self.clients.claim();
      })

  );

});


/*
 * Fetch
 *
 * 同網域 GET：
 *
 * 1. cache 有 → 使用 cache
 * 2. cache 沒有 → 網路
 * 3. 網路成功 → 放進 cache
 */
self.addEventListener("fetch", event => {

  const request = event.request;

  if (request.method !== "GET") {
    return;
  }


  const url =
    new URL(request.url);


  /*
   * 不攔截外部網站。
   */
  if (url.origin !== location.origin) {
    return;
  }


  event.respondWith(

    caches
      .match(request)

      .then(cached => {

        if (cached) {
          return cached;
        }


        return fetch(request)

          .then(response => {

            /*
             * 網路錯誤或非正常 response
             * 不寫入 cache。
             */
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

                cache.put(
                  request,
                  copy
                );

              });


            return response;

          });

      })

  );

});
