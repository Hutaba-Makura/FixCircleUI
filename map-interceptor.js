const originalFetch = window.fetch;
window.fetch = async function (...args) {
  const response = await originalFetch(...args);
  const url = args[0] || "";

  if (typeof url === 'string' && url.includes('DetailJson')) {
    response.clone().json().then(data => {
      // ISOLATED環境（map-color-filter.js）にデータを送信
      window.postMessage({ type: "CIRCLE_DETAIL_JSON", detail: data }, "*");
    }).catch(err => console.error("JSON解析失敗:", err));
  }
  
  return response;
};

const originalXHROpen = XMLHttpRequest.prototype.open;
const originalXHRSend = XMLHttpRequest.prototype.send;

XMLHttpRequest.prototype.open = function (method, url, ...args) {
  this._fixCircleUIUrl = url;
  return originalXHROpen.call(this, method, url, ...args);
};

XMLHttpRequest.prototype.send = function (...args) {
  if (typeof this._fixCircleUIUrl === 'string' && this._fixCircleUIUrl.includes('DetailJson')) {
    this.addEventListener('load', function () {
      const data = this.responseType === 'json' ? this.response : JSON.parse(this.responseText);
      window.postMessage({ type: "CIRCLE_DETAIL_JSON", detail: data }, "*");
    });
  }

  return originalXHRSend.apply(this, args);
};
