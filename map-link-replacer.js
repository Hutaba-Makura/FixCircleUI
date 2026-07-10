/**
 * マップページリンク置換機能
 * Detailjsonの通信結果から、詳細表示内のSNS・外部サイトアイコンを直接リンクに置き換えます。
 */
(function () {
  'use strict';

  const { isMapPage: _isMapPage } = window.FixCircleUI || {};
  const isMapPage = (_isMapPage || (() => false))();

  if (!isMapPage) {
    return;
  }

  const ICON_URL_MAP = {
    'support-list-pixiv': 'PixivUrl',
    'support-list-twitter': 'TwitterUrl',
    'support-list-myhome': 'WebSite',
    'support-list-niconico': 'NiconicoUrl',
    'support-list-clipstudio': 'ClipstudioUrl'
  };

  let latestCircleData = null;

  function getCircleData(detailJson) {
    if (!detailJson) return null;
    if (detailJson.PixivUrl || detailJson.TwitterUrl || detailJson.WebSite || detailJson.NiconicoUrl || detailJson.ClipstudioUrl) {
      return detailJson;
    }
    return detailJson.Circle || detailJson.circle || detailJson.Detail || detailJson.detail || null;
  }

  function replaceIconLinks() {
    if (!latestCircleData) {
      return;
    }

    const supportLists = Array.from(document.querySelectorAll('.support-list'));
    supportLists.forEach(supportList => {
      processSupportList(supportList, latestCircleData);
    });
  }

  function processSupportList(supportList, circleData) {
    Object.keys(ICON_URL_MAP).forEach(iconClass => {
      const icon = supportList.querySelector(`.${iconClass}`);
      if (!icon) return;

      const url = circleData[ICON_URL_MAP[iconClass]];
      if (!url || url.trim() === '') return;

      const parent = icon.parentElement;
      const newIcon = icon.cloneNode(true);
      removeClickBinding(newIcon);
      newIcon.setAttribute('data-map-link-replaced', 'true');

      if (parent.tagName === 'A') {
        parent.href = url;
        parent.target = '_blank';
        parent.rel = 'noopener noreferrer';
        parent.replaceChild(newIcon, icon);
        addLinkClickHandler(parent);
        return;
      }

      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.style.cssText = 'display: inline-block; cursor: pointer; text-decoration: none;';
      link.appendChild(newIcon);
      addLinkClickHandler(link);

      parent.replaceChild(link, icon);
    });
  }

  function removeClickBinding(icon) {
    const dataBind = icon.getAttribute('data-bind');
    if (!dataBind) return;

    const newDataBind = dataBind
      .replace(/click\s*:\s*[^,}]+/g, '')
      .replace(/,\s*,/g, ',')
      .replace(/^,\s*|,\s*$/g, '');

    if (newDataBind.trim() === '') {
      icon.removeAttribute('data-bind');
    } else {
      icon.setAttribute('data-bind', newDataBind);
    }
  }

  function addLinkClickHandler(link) {
    if (link.hasAttribute('data-map-link-handler')) return;

    link.setAttribute('data-map-link-handler', 'true');
    link.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  window.addEventListener('message', (event) => {
    if (event.source !== window || event.data?.type !== 'CIRCLE_DETAIL_JSON') {
      return;
    }

    latestCircleData = getCircleData(event.data.detail);
    replaceIconLinks();
  });

  let mutationTimeout;
  new MutationObserver(() => {
    clearTimeout(mutationTimeout);
    mutationTimeout = setTimeout(replaceIconLinks, 100);
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
