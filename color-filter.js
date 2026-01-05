/**
 * お気に入り色フィルタリング機能
 * User/FavoritesページとCircle/Listページで、お気に入りの色に基づいてサークルをフィルタリングします
 */
(function () {
    'use strict';
  
    // ============================================================================
    // 設定
    // ============================================================================
  
    // ページタイプをチェック
    const url = window.location.pathname;
    const isFavoritesPage = url.includes('/User/Favorites');
    const isCircleListPage = url.includes('/Circle/List');
    
    if (!isFavoritesPage && !isCircleListPage) {
      return; // 該当するページでない場合は終了
    }
  
    // 色の定義
    const COLOR_DEFINITIONS = [
        { id: '1', name: 'オレンジ', color: '#FF944A' },
        { id: '2', name: 'ピンク', color: '#FF00FF' },
        { id: '3', name: 'イエロー', color: '#FFF700' },
        { id: '4', name: 'グリーン', color: '#00B54A' },
        { id: '5', name: 'ライトブルー', color: '#00B5FF' },
        { id: '6', name: 'パープル', color: '#9C529C' },
        { id: '7', name: 'ブルー', color: '#0000FF' },
        { id: '8', name: 'ライトグリーン', color: '#00FF00' },
        { id: '9', name: 'レッド', color: '#FF0000' },
        { id: '10', name: 'ホワイト', color: '#FFFFFF' },
    ];
  
    // 表示したい色ID（Setで管理）
    let ALLOWLIST = new Set();
  
    // 初期状態：全ての色を表示
    COLOR_DEFINITIONS.forEach(c => ALLOWLIST.add(c.id));
  
    // ============================================================================
    // ユーティリティ関数
    // ============================================================================
  
    /**
     * TheModelからJSONデータを取得
     */
    function parseModel() {
      const el = document.getElementById('TheModel');
      if (!el) return null;
      try {
        return JSON.parse(el.textContent || '{}');
      } catch {
        return null;
      }
    }
  
    /**
     * サークルの詳細行に関連する全ての行を取得
     * 1つのサークルは複数のtr要素で構成されているため、それらをグループ化
     * 
     * /User/Favoritesページ: infotable-sep、webcatalog-circle-list-detail、tr、tr (4行)
     * /Circle/Listページ: infotable-sep、webcatalog-circle-list-detail、tr、tr、tr (5行)
     */
    function groupRows(detailTr) {
      const prev = detailTr.previousElementSibling;
      const r1 = detailTr.nextElementSibling;
      const r2 = r1 && r1.nextElementSibling;
      const r3 = r2 && r2.nextElementSibling;
      const rows = [];
      
      // 前の行（infotable-sep）を追加
      if (prev && prev.classList.contains('infotable-sep')) {
        rows.push(prev);
      }
      
      // メイン行を追加
      rows.push(detailTr);
      
      // 次の行を追加（ページタイプに応じて行数を変更）
      if (isCircleListPage) {
        // /Circle/Listページ: 次の3行を追加
        if (r1) rows.push(r1);
        if (r2) rows.push(r2);
        if (r3) rows.push(r3);
      } else {
        // /User/Favoritesページ: 次の2行を追加
        if (r1) rows.push(r1);
        if (r2) rows.push(r2);
      }
      
      return rows;
    }
  
    /**
     * DOMから色情報を取得（フォールバック用）
     */
    function detectColorFromRow(detailTr) {
      if(isFavoritesPage) {
        // /User/Favoritesページ: td.favorite-color-{数字}から取得
        const td = detailTr.querySelector('td.favorite-color, td[class*="favorite-color-"]');
        if (!td) return null;
        
        const match = Array.from(td.classList).find(c => /^favorite-color-\d+$/.test(c));
        return match ? match.split('-').pop() : null;
      } else if(isCircleListPage) {
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
  
    // ============================================================================
    // フィルタリング機能
    // ============================================================================
  
    /**
     * ラベルの件数表示を更新
     */
    function updateLabelCount(displayedCount, totalCount) {
      const label = document.getElementById('multi-color-filter-label');
      if (label) {
        const newText = `表示する色を選択（${displayedCount}/${totalCount}件表示）:`;
        // 現在のテキストと同じ場合は更新しない（無限ループ防止）
        if (label.textContent !== newText) {
          label.textContent = newText;
        }
      }
    }

    /**
     * フィルタを適用してサークルを表示/非表示にする
     */
    function applyFilter() {
      const circles = cachedModel && Array.isArray(cachedModel.Circles) ? cachedModel.Circles : [];
      const detailRows = Array.from(document.querySelectorAll('tr.webcatalog-circle-list-detail'));
      
      // 全件数（フィルター前）
      const totalCount = detailRows.length;
      let displayedCount = 0;
      
      detailRows.forEach((tr, i) => {
        let color = null;
        
        // TheModelから色を取得（Favorite.Colorが存在する場合）
        if (circles[i]?.Favorite?.Color != null) {
          color = String(circles[i].Favorite.Color);
        } else {
          // DOMから色を取得（フォールバック）
          color = detectColorFromRow(tr);
        }
        
        const rows = groupRows(tr);
        // 色がnull/undefinedの場合（色が指定されていないサークル）は、ホワイトがチェックされている場合のみ表示
        const show = (color && ALLOWLIST.has(color)) || ((color === '10' || color === null) && ALLOWLIST.has('10'));
        rows.forEach(r => {
          r.style.display = show ? '' : 'none';
        });
        
        // 表示されている場合はカウント
        if (show) {
          displayedCount++;
        }
      });
      
      // ラベルの件数表示を更新
      updateLabelCount(displayedCount, totalCount);
    }
  
    // ============================================================================
    // UI作成機能
    // ============================================================================
  
    /**
     * UI挿入先を検出
     */
    function findInsertTarget() {
      // User/Favoritesページ: favorite-colorboxの下に配置
      let insertTarget = document.querySelector('.favorite-colorbox');
      
      if (insertTarget) {
        return { target: insertTarget, type: 'favorite-colorbox' };
      }
      
      // Circle/Listページ: テーブルの前、または適切な場所を探す
      const table = document.querySelector('table.md-infotable, table.t-user-favorites');
      if (table && table.parentElement) {
        return { target: table.parentElement, type: 'table-parent', table: table };
      }
      
      // その他の適切な場所を探す
      const mainSection = document.querySelector('.m-section-body, .m-base--inner');
      if (mainSection) {
        return { target: mainSection, type: 'section' };
      }
      
      return null;
    }
  
    /**
     * チェックボックスUIを作成
     */
    function createCheckboxUI() {
      const insertInfo = findInsertTarget();
      if (!insertInfo) return;
  
      // 既にUIが存在する場合はスキップ
      if (document.querySelector('.multi-color-filter')) return;
  
      // コンテナを作成
      const container = document.createElement('div');
      container.className = 'multi-color-filter';
      container.style.cssText = 'margin-top: 10px; padding: 10px; background-color: #f5f5f5; border-radius: 4px;';
  
      // ラベル
      const label = document.createElement('div');
      label.id = 'multi-color-filter-label';
      label.textContent = '表示する色を選択:';
      label.style.cssText = 'margin-bottom: 8px; font-weight: bold;';
      container.appendChild(label);
  
      // チェックボックスラッパー
      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'display: flex; flex-wrap: wrap; gap: 10px; align-items: center;';
  
      // 全選択ボタン
      const selectAllBtn = document.createElement('button');
      selectAllBtn.className = 'c-btn c-btn--orange';
      selectAllBtn.textContent = '全て選択';
      selectAllBtn.style.cssText = 'padding: 10px; cursor: pointer; align-items: top;';
      selectAllBtn.onclick = () => {
        COLOR_DEFINITIONS.forEach(c => {
          ALLOWLIST.add(c.id);
          const checkbox = document.getElementById(`color-checkbox-${c.id}`);
          if (checkbox) checkbox.checked = true;
        });
        applyFilter();
      };
      wrapper.appendChild(selectAllBtn);
  
      // 全解除ボタン
      const deselectAllBtn = document.createElement('button');
      deselectAllBtn.className = 'c-btn c-btn--orange';
      deselectAllBtn.textContent = '全て解除';
      deselectAllBtn.style.cssText = 'padding: 10px; margin-right: 10px; cursor: pointer; align-items: top;';
      deselectAllBtn.onclick = () => {
        ALLOWLIST.clear();
        COLOR_DEFINITIONS.forEach(c => {
          const checkbox = document.getElementById(`color-checkbox-${c.id}`);
          if (checkbox) checkbox.checked = false;
        });
        applyFilter();
      };
      wrapper.appendChild(deselectAllBtn);
  
      // 各色のチェックボックス
      COLOR_DEFINITIONS.forEach(c => {
        const label = document.createElement('label');
        label.style.cssText = 'display: flex; flex-direction: column; align-items: center; cursor: pointer;';

        // 色見本を上に配置
        const colorBox = document.createElement('span');
        colorBox.style.cssText = `display: inline-block; width: 30px; height: 30px; background-color: ${c.color}; border: 1px solid #ccc; margin-bottom: 5px; border-radius: 3px;`;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `color-checkbox-${c.id}`;
        checkbox.value = c.id;
        checkbox.checked = ALLOWLIST.has(c.id);
        checkbox.style.cssText = 'cursor: pointer; margin-right: 0px; align-items: center;';
        checkbox.onchange = () => {
          if (checkbox.checked) {
            ALLOWLIST.add(c.id);
          } else {
            ALLOWLIST.delete(c.id);
          }
          applyFilter();
        };

        label.appendChild(colorBox);
        label.appendChild(checkbox);
        wrapper.appendChild(label);
      });
  
      container.appendChild(wrapper);
      
      // 挿入場所に応じて適切に配置
      if (insertInfo.type === 'favorite-colorbox') {
        // User/Favoritesページ: favorite-colorboxの下に配置
        insertInfo.target.parentNode.insertBefore(container, insertInfo.target.nextSibling);
      } else if (insertInfo.type === 'table-parent' && insertInfo.table) {
        // Circle/Listページ: テーブルの前に配置
        insertInfo.target.insertBefore(container, insertInfo.table);
      } else {
        // その他: 先頭に配置
        insertInfo.target.insertBefore(container, insertInfo.target.firstChild);
      }
    }
  
    // ============================================================================
    // 初期化
    // ============================================================================
  
    /**
     * 初期化処理
     */
    let cachedModel = null;

    function init() {
      cachedModel = parseModel();
      createCheckboxUI();
      if (cachedModel) {
        applyFilter();
      }
    }
  
    // DOMContentLoadedを待つ
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
    
    // DOMの変更を監視してフィルタを再適用
    new MutationObserver((mutations) => {
      // .multi-color-filter内の変更は無視（無限ループ防止）
      let shouldIgnore = false;
      for (const mutation of mutations) {
        const target = mutation.target;
        if (target.closest && target.closest('.multi-color-filter')) {
          shouldIgnore = true;
          break;
        }
        // テキストノードの変更もチェック
        if (target.nodeType === Node.TEXT_NODE && target.parentElement) {
          if (target.parentElement.closest('.multi-color-filter')) {
            shouldIgnore = true;
            break;
          }
        }
      }
      
      if (shouldIgnore) {
        return;
      }
      
      if (!document.querySelector('.multi-color-filter')) {
        createCheckboxUI();
      }
      applyFilter();
    }).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  })();

