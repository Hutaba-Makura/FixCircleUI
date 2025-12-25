// ==UserScript==
// @name         WebCatalog Fav Multi-Color (Row Hider)
// @namespace    https://example.com/your-namespace
// @version      0.4.0
// @description  TheModelのColorに基づき、お気に入りの行(tr)を複数色フィルタ（UIなし/allowlist編集）
// @match        https://webcatalog-free.circle.ms/User/Favorites*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
  
    // 表示したい色ID（空Setで全表示）
    const ALLOWLIST = new Set(['2','5','6','7','9']);
  
    const allowAll = ALLOWLIST.size === 0;
  
    function parseModel() {
      const el = document.getElementById('TheModel');
      if (!el) return null;
      try { return JSON.parse(el.textContent || '{}'); } catch { return null; }
    }
  
    function groupRows(detailTr) {
      const prev = detailTr.previousElementSibling;
      const r1 = detailTr.nextElementSibling;
      const r2 = r1 && r1.nextElementSibling;
      const set = [];
      if (prev && prev.classList.contains('infotable-sep')) set.push(prev);
      set.push(detailTr);
      if (r1) set.push(r1);
      if (r2) set.push(r2);
      return set;
    }
  
    function detectColorFromRow(detailTr) {
      const td = detailTr.querySelector('td.favorite-color, td[class*="favorite-color-"]');
      if (!td) return null;
      const m = Array.from(td.classList).find(c => /^favorite-color-\d+$/.test(c));
      return m ? m.split('-').pop() : null;
    }
  
    function applyFilter() {
      const model = parseModel();
      const circles = model && Array.isArray(model.Circles) ? model.Circles : [];
      const detailRows = Array.from(document.querySelectorAll('tr.webcatalog-circle-list-detail'));
      detailRows.forEach((tr, i) => {
        let color = null;
        if (circles[i]?.Favorite?.Color != null) {
          color = String(circles[i].Favorite.Color);
        } else {
          color = detectColorFromRow(tr);
        }
        const rows = groupRows(tr);
        const show = allowAll || (color && ALLOWLIST.has(color));
        rows.forEach(r => { r.style.display = show ? '' : 'none'; });
      });
    }
  
    const init = () => applyFilter();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
    new MutationObserver(() => applyFilter())
      .observe(document.documentElement, { childList: true, subtree: true });
  })();
  