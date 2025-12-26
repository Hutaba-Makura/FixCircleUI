// ==UserScript==
// @name         WebCatalog Fav Multi-Color (Row Hider)
// @namespace    https://example.com/your-namespace
// @version      0.5.0
// @description  TheModelのColorに基づき、お気に入りの行(tr)を複数色フィルタ（チェックボックスUI付き）
// @match        https://webcatalog-free.circle.ms/User/Favorites*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
  
    // 色の定義
    // 0: 全て
    // 1: オレンジ
    // 2: ピンク
    // 3: イエロー
    // 4: グリーン
    // 5: ライトブルー
    // 6: パープル
    // 7: ブルー
    // 8: ライトグリーン
    // 9: レッド
    const COLOR_DEFINITIONS = [
        { id: '1', name: 'オレンジ', color: '#FF944A' },
        { id: '2', name: 'ピンク', color: '#FF00FF' },
        { id: '3', name: 'イエロー', color: '#FFF700' },
        { id: '4', name: 'グリーン', color: '#00B54A' },
        { id: '5', name: 'ライトブルー', color: '#00B5FF' },
        { id: '6', name: 'パープル', color: '#9C529C' },
        { id: '7', name: 'ブルー', color: '#0000FF' },
        { id: '8', name: 'ライトグリーン', color: '#00FF00' },
        { id: '9', name: 'レッド', color: '#FF0000' }
    ];
  
    // 表示したい色ID（Setで管理）
    let ALLOWLIST = new Set();
  
    // 初期状態：全ての色を表示
    COLOR_DEFINITIONS.forEach(c => ALLOWLIST.add(c.id));
  
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
      const allowAll = ALLOWLIST.size === 0 || ALLOWLIST.size === COLOR_DEFINITIONS.length;
      
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
  
    function createCheckboxUI() {
      const colorbox = document.querySelector('.favorite-colorbox');
      if (!colorbox) return;
  
      // チェックボックスコンテナを作成
      const checkboxContainer = document.createElement('div');
      checkboxContainer.className = 'multi-color-filter';
      checkboxContainer.style.cssText = 'margin-top: 10px; padding: 10px; background-color: #f5f5f5; border-radius: 4px;';
  
      const label = document.createElement('div');
      label.textContent = '表示する色を選択:';
      label.style.cssText = 'margin-bottom: 8px; font-weight: bold;';
      checkboxContainer.appendChild(label);
  
      const checkboxWrapper = document.createElement('div');
      checkboxWrapper.style.cssText = 'display: flex; flex-wrap: wrap; gap: 10px; align-items: center;';
  
      // 全選択/全解除ボタン
      const selectAllBtn = document.createElement('button');
      selectAllBtn.textContent = '全て選択';
      selectAllBtn.style.cssText = 'padding: 4px 8px; margin-right: 10px; cursor: pointer;';
      selectAllBtn.onclick = () => {
        COLOR_DEFINITIONS.forEach(c => {
          ALLOWLIST.add(c.id);
          const checkbox = document.getElementById(`color-checkbox-${c.id}`);
          if (checkbox) checkbox.checked = true;
        });
        applyFilter();
      };
      checkboxWrapper.appendChild(selectAllBtn);
  
      const deselectAllBtn = document.createElement('button');
      deselectAllBtn.textContent = '全て解除';
      deselectAllBtn.style.cssText = 'padding: 4px 8px; cursor: pointer;';
      deselectAllBtn.onclick = () => {
        ALLOWLIST.clear();
        COLOR_DEFINITIONS.forEach(c => {
          const checkbox = document.getElementById(`color-checkbox-${c.id}`);
          if (checkbox) checkbox.checked = false;
        });
        applyFilter();
      };
      checkboxWrapper.appendChild(deselectAllBtn);
  
      // 各色のチェックボックス
      COLOR_DEFINITIONS.forEach(c => {
        const label = document.createElement('label');
        label.style.cssText = 'display: flex; align-items: center; cursor: pointer; margin-right: 15px;';
  
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `color-checkbox-${c.id}`;
        checkbox.value = c.id;
        checkbox.checked = ALLOWLIST.has(c.id);
        checkbox.style.cssText = 'margin-right: 5px;';
        checkbox.onchange = () => {
          if (checkbox.checked) {
            ALLOWLIST.add(c.id);
          } else {
            ALLOWLIST.delete(c.id);
          }
          applyFilter();
        };
  
        const colorBox = document.createElement('span');
        colorBox.style.cssText = `display: inline-block; width: 20px; height: 20px; background-color: ${c.color}; border: 1px solid #ccc; margin-right: 5px; vertical-align: middle;`;
  
        const text = document.createElement('span');
        text.textContent = c.name;
  
        label.appendChild(checkbox);
        label.appendChild(colorBox);
        label.appendChild(text);
        checkboxWrapper.appendChild(label);
      });
  
      checkboxContainer.appendChild(checkboxWrapper);
      colorbox.parentNode.insertBefore(checkboxContainer, colorbox.nextSibling);
    }
  
    function init() {
      createCheckboxUI();
      applyFilter();
    }
  
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
    
    // DOMの変更を監視してフィルタを再適用
    new MutationObserver(() => {
      // チェックボックスUIが存在しない場合は再作成
      if (!document.querySelector('.multi-color-filter')) {
        createCheckboxUI();
      }
      applyFilter();
    }).observe(document.documentElement, { childList: true, subtree: true });
  })();
  