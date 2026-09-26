# iPhone 版 SenseVoice INT8

這個版本特別設計給 iPhone「檔案」App。

你只需要把這個資料夾裡的 3 個檔案上傳到 GitHub：

1. `index.html`
2. `sw.js`
3. `README.md`

然後在 GitHub 網頁直接建立 GitHub Actions workflow。

## iPhone 操作

### 第一步：建立 Repository

GitHub → New repository → 例如 `sensevoice-web`

### 第二步：上傳這 3 個檔案

Repository → Add file → Upload files。

不要找 `.github`，這個版本故意不需要你操作隱藏資料夾。

### 第三步：建立 Actions

GitHub Repository → Actions → New workflow → `set up a workflow yourself`

檔名輸入：

`.github/workflows/deploy.yml`

把下方內容貼進去：

```yaml
name: Build SenseVoice and Deploy Pages
on:
  push:
    branches: ["main"]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-22.04
    steps:
    - uses: actions/checkout@v4
    - uses: actions/checkout@v4
      with:
        repository: k2-fsa/sherpa-onnx
        path: sherpa-onnx
    - name: Install Emscripten
      run: |
        git clone --depth 1 --branch 4.0.23 https://github.com/emscripten-core/emsdk.git
        cd emsdk
        ./emsdk install 4.0.23
        ./emsdk activate 4.0.23
    - name: Build WASM
      run: |
        cd sherpa-onnx
        source ../emsdk/emsdk_env.sh
        ./build-wasm-simd-asr.sh
    - name: Download model and assemble site
      run: |
        mkdir -p public/assets
        cp index.html sw.js public/
        cp sherpa-onnx/wasm/asr/sherpa-onnx-asr.js public/assets/
        cp sherpa-onnx/build-wasm-simd-asr/install/bin/wasm/asr/sherpa-onnx-wasm-main-asr.js public/assets/
        cp sherpa-onnx/build-wasm-simd-asr/install/bin/wasm/asr/sherpa-onnx-wasm-main-asr.wasm public/assets/
        curl -L --fail --retry 3 "https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-sense-voice-zh-en-ja-ko-yue-int8-2025-09-09.tar.bz2" -o /tmp/model.tar.bz2
        tar -xjf /tmp/model.tar.bz2 -C /tmp
        cp /tmp/sherpa-onnx-sense-voice-zh-en-ja-ko-yue-int8-2025-09-09/model.int8.onnx public/assets/
        cp /tmp/sherpa-onnx-sense-voice-zh-en-ja-ko-yue-int8-2025-09-09/tokens.txt public/assets/
        touch public/.nojekyll
    - uses: actions/configure-pages@v5
    - uses: actions/upload-pages-artifact@v3
      with:
        path: public
  deploy:
    needs: build
    runs-on: ubuntu-22.04
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
    - id: deployment
      uses: actions/deploy-pages@v4
```

貼完按 Commit changes。

### 第四步：開 Pages

Settings → Pages → Source 選 `GitHub Actions`。

等 Actions 顯示綠色成功即可。

### 重要

第一次開網站會下載約 226 MB 的 SenseVoice INT8 模型。
下載完成後會由瀏覽器 Cache / Service Worker 保存。
ASR 推論在瀏覽器本機執行，不需要你的後端。

官方 sherpa-onnx：
https://github.com/k2-fsa/sherpa-onnx
