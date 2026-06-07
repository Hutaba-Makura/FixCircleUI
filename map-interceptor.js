const originalFetch = window.fetch;
window.fetch = async function (...args) {
  const response = await originalFetch(...args);
  const url = args[0] || "";

  // URLに「Detailjson」が含まれているかチェック
  if (typeof url === 'string' && url.includes('Detailjson')) {
    response.clone().json().then(data => {
      // ISOLATED環境（map-color-filter.js）にデータを送信
      window.postMessage({ type: "CIRCLE_DETAIL_JSON", detail: data }, "*");
    }).catch(err => console.error("JSON解析失敗:", err));
  }
  
  return response;
};