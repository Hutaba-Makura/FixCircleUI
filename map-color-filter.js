/**
 * マップページ色フィルタリング機能
 * /Map ページで、お気に入りの色に基づいてサークルマーカーをフィルタリングします
 */
(function () {
    'use strict';
  
    // ============================================================================
    // 設定
    // ============================================================================
  
    // ページタイプをチェック
    const url = window.location.pathname;
    const hash = window.location.hash;
    const isMapPage = url.includes('/Map') || hash.includes('/Map');
    
    if (!isMapPage) {
      return; // マップページでない場合は終了
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
     * map-favorites要素から色情報を取得
     */
    function detectColorFromElement(element) {
      const classes = Array.from(element.classList);
      
      // favorite-backgroundcolor-{数字}のパターンを探す（優先）
      const bgMatch = classes.find(c => /^favorite-backgroundcolor-\d+$/.test(c));
      if (bgMatch) {
        return bgMatch.split('-').pop();
      }
      
      // favorite-bordercolor-{数字}のパターンを探す
      const borderMatch = classes.find(c => /^favorite-bordercolor-\d+$/.test(c));
      if (borderMatch) {
        return borderMatch.split('-').pop();
      }
      
      // favorite-backgroundcolor- のみの場合は色が無い（ホワイト扱い）
      const hasEmptyColor = classes.some(c => c === 'favorite-backgroundcolor-');
      if (hasEmptyColor) {
        return '10';
      }
      
      return null;
    }
  
    /**
     * 全てのmap-favorites内のdiv要素を取得
     */
    function getAllMapFavorites() {
      return Array.from(document.querySelectorAll('.map-favorites > div'));
    }
  
    // ============================================================================
    // フィルタリング機能
    // ============================================================================
  
    /**
     * ラベルの件数表示を更新
     */
    function updateLabelCount(displayedCount, totalCount) {
      const label = document.getElementById('map-color-filter-label');
      if (label) {
        const newText = `表示する色を選択（${displayedCount}/${totalCount}件表示）:`;
        // 現在のテキストと同じ場合は更新しない（無限ループ防止）
        if (label.textContent !== newText) {
          label.textContent = newText;
        }
      }
    }

    /**
     * フィルタを適用してマーカーを表示/非表示にする
     */
    function applyFilter() {
      const mapElements = getAllMapFavorites();
      
      // 現在のハッシュを取得（ページ遷移後も正しく取得するため）
      const currentHash = window.location.hash;
      const isScaledView = currentHash.includes('/scale=1') || currentHash.includes('/scale=2');
      
      // 全件数（フィルター前）
      const totalCount = isScaledView ? Math.floor(mapElements.length / 2) : mapElements.length;
      let displayedCount = 0;
      
      mapElements.forEach(element => {
        const color = detectColorFromElement(element);
        console.log({title: element.title, color: color});
        
        // 色がnull/undefinedの場合（色が指定されていないサークル）は、ホワイトがチェックされている場合のみ表示
        const show = (color && ALLOWLIST.has(color)) || ((color === '10' || color === null) && ALLOWLIST.has('10'));
        
        // 要素全体を表示/非表示
        element.style.display = show ? '' : 'none';
        
        // 親要素がある場合、親要素も制御する可能性を考慮
        // （map-favoritesの親がマーカー全体を含んでいる場合など）
        const parent = element.closest('.map-favorite-marker, .map-marker, [class*="marker"]');
        if (parent && parent !== element) {
          parent.style.display = show ? '' : 'none';
        }
        
        // 表示されている場合はカウント
        if (show) {
          displayedCount++;
        }
      });
      
      // 重複チェック（スケール表示の場合は半分にする）
      displayedCount = isScaledView ? Math.floor(displayedCount / 2) : displayedCount;
      
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
      // 優先: map-fullscreen-close要素の下に配置
      const closeButton = document.querySelector('.map-fullscreen-close');
      if (closeButton && closeButton.parentElement) {
        return { target: closeButton.parentElement, type: 'after-close-button', element: closeButton };
      }
      
      // 候補1: マップコンテナの上部
      let mapContainer = document.querySelector('.map-container, .m-map, #map, [class*="map-"]');
      if (mapContainer && mapContainer.parentElement) {
        return { target: mapContainer.parentElement, type: 'map-container', element: mapContainer };
      }
      
      // 候補2: メインセクション
      const mainSection = document.querySelector('.m-section-body, .m-base--inner, .main-content');
      if (mainSection) {
        return { target: mainSection, type: 'section' };
      }
      
      // 候補3: body直下
      return { target: document.body, type: 'body' };
    }
  
    /**
     * チェックボックスUIを作成
     */
    function createCheckboxUI() {
      const insertInfo = findInsertTarget();
      if (!insertInfo) return;

      // 既にUIが存在する場合はスキップ
      if (document.querySelector('.map-color-filter')) return;

      // コンテナを作成
      const container = document.createElement('div');
      container.className = 'map-color-filter';
      container.style.cssText = `
        position: absolute;
        top: 50px;
        right: 10px;
        z-index: 10000;
        background-color: rgba(255, 255, 255, 0.95);
        padding: 12px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        max-width: 400px;
        backdrop-filter: blur(5px);
      `;

      // ヘッダー（閉じるボタン付き）
      const header = document.createElement('div');
      header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;';
      
      // ラベル
      const label = document.createElement('div');
      label.id = 'map-color-filter-label';
      label.textContent = '表示する色を選択:';
      label.style.cssText = 'font-size: 12px;';
      
      // 最小化ボタン
      const minimizeBtn = document.createElement('button');
      minimizeBtn.textContent = '−';
      minimizeBtn.style.cssText = `
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        padding: 0 5px;
        line-height: 1;
      `;
      minimizeBtn.onclick = () => {
        const wrapper = container.querySelector('.filter-controls-wrapper');
        if (wrapper.style.display === 'none') {
          wrapper.style.display = 'block';
          minimizeBtn.textContent = '−';
        } else {
          wrapper.style.display = 'none';
          minimizeBtn.textContent = '+';
        }
      };
      
      header.appendChild(label);
      header.appendChild(minimizeBtn);
      container.appendChild(header);

      // コントロールラッパー
      const controlsWrapper = document.createElement('div');
      controlsWrapper.className = 'filter-controls-wrapper';
      
      // ボタンコンテナ
      const buttonContainer = document.createElement('div');
      buttonContainer.style.cssText = 'display: flex; gap: 5px; margin-bottom: 8px;';

      // 全選択ボタン
      const selectAllBtn = document.createElement('button');
      selectAllBtn.textContent = '全選択';
      selectAllBtn.style.cssText = `
        padding: 6px 10px;
        cursor: pointer;
        background-color: #FF944A;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 12px;
        flex: 1;
      `;
      selectAllBtn.onclick = () => {
        COLOR_DEFINITIONS.forEach(c => {
          ALLOWLIST.add(c.id);
          const checkbox = document.getElementById(`map-color-checkbox-${c.id}`);
          if (checkbox) checkbox.checked = true;
        });
        applyFilter();
      };
      buttonContainer.appendChild(selectAllBtn);

      // 全解除ボタン
      const deselectAllBtn = document.createElement('button');
      deselectAllBtn.textContent = '全解除';
      deselectAllBtn.style.cssText = `
        padding: 6px 10px;
        cursor: pointer;
        background-color: #666;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 12px;
        flex: 1;
      `;
      deselectAllBtn.onclick = () => {
        ALLOWLIST.clear();
        COLOR_DEFINITIONS.forEach(c => {
          const checkbox = document.getElementById(`map-color-checkbox-${c.id}`);
          if (checkbox) checkbox.checked = false;
        });
        applyFilter();
      };
      buttonContainer.appendChild(deselectAllBtn);
      
      controlsWrapper.appendChild(buttonContainer);

      // チェックボックスコンテナ
      const checkboxContainer = document.createElement('div');
      checkboxContainer.style.cssText = 'display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px;';

      // 各色のチェックボックス
      COLOR_DEFINITIONS.forEach(c => {
        const label = document.createElement('label');
        label.style.cssText = `
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: background-color 0.2s;
        `;
        label.onmouseover = () => label.style.backgroundColor = '#f0f0f0';
        label.onmouseout = () => label.style.backgroundColor = 'transparent';

        // 色見本を上に配置
        const colorBox = document.createElement('span');
        colorBox.style.cssText = `
          display: inline-block;
          width: 28px;
          height: 28px;
          background-color: ${c.color};
          border: 2px solid #999;
          margin-bottom: 4px;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        `;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `map-color-checkbox-${c.id}`;
        checkbox.value = c.id;
        checkbox.checked = ALLOWLIST.has(c.id);
        checkbox.style.cssText = 'cursor: pointer; width: 16px; height: 16px; margin-left: 0px; margin-right: 1px;';
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
        checkboxContainer.appendChild(label);
      });

      controlsWrapper.appendChild(checkboxContainer);
      container.appendChild(controlsWrapper);
      
      // 挿入場所に応じて適切に配置
      if (insertInfo.type === 'after-close-button' && insertInfo.element) {
        // map-fullscreen-close要素の下（次の兄弟要素として）に配置
        insertInfo.element.parentNode.insertBefore(container, insertInfo.element.nextSibling);
      } else if (insertInfo.type === 'map-container' && insertInfo.element) {
        // マップコンテナの前に配置
        insertInfo.target.insertBefore(container, insertInfo.element);
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
    function init() {
      // マップ要素が読み込まれるまで待機
      const checkMapLoaded = setInterval(() => {
        const mapElements = getAllMapFavorites();
        if (mapElements.length > 0) {
          clearInterval(checkMapLoaded);
          createCheckboxUI();
          applyFilter();
        }
      }, 500);
      
      // 10秒後にタイムアウト
      setTimeout(() => {
        clearInterval(checkMapLoaded);
        // マップ要素がなくてもUIは作成する
        createCheckboxUI();
      }, 10000);
    }
  
    // DOMContentLoadedを待つ
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
    
    // DOMの変更を監視してフィルタを再適用
    new MutationObserver((mutations) => {
      // .map-color-filter内の変更は無視（無限ループ防止）
      let shouldIgnore = false;
      for (const mutation of mutations) {
        const target = mutation.target;
        if (target.closest && target.closest('.map-color-filter')) {
          shouldIgnore = true;
          break;
        }
        // テキストノードの変更もチェック
        if (target.nodeType === Node.TEXT_NODE && target.parentElement) {
          if (target.parentElement.closest('.map-color-filter')) {
            shouldIgnore = true;
            break;
          }
        }
      }
      
      if (shouldIgnore) {
        return;
      }
      
      // UIが存在しない場合は作成
      if (!document.querySelector('.map-color-filter')) {
        createCheckboxUI();
      }
      
      // map-favorites要素が追加または削除された場合のみフィルタを再適用
      let hasMapChanges = false;
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          // map-favorites要素またはその親が変更された場合
          const addedNodes = Array.from(mutation.addedNodes);
          const removedNodes = Array.from(mutation.removedNodes);
          
          for (const node of [...addedNodes, ...removedNodes]) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.classList.contains('map-favorites') || 
                  node.querySelector('.map-favorites')) {
                hasMapChanges = true;
                break;
              }
            }
          }
        }
        if (hasMapChanges) break;
      }
      
      if (hasMapChanges) {
        applyFilter();
      }
    }).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    
    // ハッシュ変更を監視（マップページ内の遷移対応）
    window.addEventListener('hashchange', () => {
      // 少し待ってから再初期化
      setTimeout(() => {
        const mapElements = getAllMapFavorites();
        if (mapElements.length > 0) {
          applyFilter();
        }
      }, 500);
    });
  })();

