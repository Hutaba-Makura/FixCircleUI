/* 共通ユーティリティ
 * 簡易グローバル登録方式（互換性重視）
 */
(function () {
  'use strict';

  // ページ判定ユーティリティ
  function isFavoritesPage(pathname = window.location.pathname) {
    return String(pathname || '').includes('/User/Favorites');
  }

  function isCircleListPage(pathname = window.location.pathname) {
    return String(pathname || '').includes('/Circle/List');
  }

  function isMapPage(pathename = window.location.pathname) {
    return String(pathname || '').includes('/Map')
  }

  function parseModel() {
    const el = document.getElementById('TheModel');
    if (!el) return null;
    try {
      return JSON.parse(el.textContent || '{}');
    } catch {
      return null;
    }
  }

  function getCircleDataById(circleId, model) {
    if (!Array.isArray(model?.Circles)) return null;
    return model.Circles.find(c => c.Id === circleId || c.CircleId === circleId) || null;
  }

  function getCircleIdFromRow(tr) {
    const id = tr.id || tr.getAttribute && tr.getAttribute('id');
    if (id) {
      const numId = parseInt(id, 10);
      if (!Number.isNaN(numId)) return numId;
    }
    return null;
  }

  /**
   * DOMから色情報を取得（フォールバック用）
   */
  function detectColorFromRow(detailTr) {
    if (isFavoritesPage()) {
      // /User/Favoritesページ: td.favorite-color-{数字}から取得
      const td = detailTr.querySelector('td.favorite-color, td[class*="favorite-color-"]');
      if (!td) return null;
      
      const match = Array.from(td.classList).find(c => /^favorite-color-\d+$/.test(c));
      return match ? match.split('-').pop() : null;
    } else if (isCircleListPage()) {
      // /Circle/Listページ: circlecut-overlay-favorite favorite-backgroundcolor-{数字}から取得
      // または favorite-backgroundcolor- のみ（色が無い場合）
      const element = detailTr.querySelector('.circlecut-overlay-favorite[class*="favorite-backgroundcolor-"]');
      if (!element) return null;
      
      // favorite-backgroundcolor-{数字}のパターンを探す
      const match = Array.from(element.classList).find(c => /^favorite-backgroundcolor-\d+$/.test(c));
      if (match) {
        return match.split('-').pop();
      }

      // favorite-backgroundcolor- のみの場合は色が無い（nullを返す）
      const hasEmptyColor = Array.from(element.classList).some(c => c === 'favorite-backgroundcolor-');
      if (hasEmptyColor) {
        return '10';
      }

      return null;
    }
    return null;
  }

  // 既存の名前空間を上書きせずに拡張
  window.FixCircleUI = Object.assign(window.FixCircleUI || {}, {
    parseModel,
    getCircleDataById,
    getCircleIdFromRow,
    detectColorFromRow,
    // ページ判定ユーティリティ
    isFavoritesPage,
    isCircleListPage,
    isMapPage
  });
})();
