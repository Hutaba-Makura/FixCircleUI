/**
 * リンク置換機能
 * support-list内のSNS・外部サイトアイコンをクリックした時、
 * サークル詳細ページではなく、直接リンク先に飛ぶようにします
 */
(function () {
    'use strict';
  
    // ページタイプをチェック
    const url = window.location.pathname;
    const isFavoritesPage = url.includes('/User/Favorites');
    const isCircleListPage = url.includes('/Circle/List');
    
    if (!isFavoritesPage && !isCircleListPage) {
      return; // 該当するページでない場合は終了
    }
  
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
     * サークルIDから対応するサークルデータを取得
     */
    function getCircleDataById(circleId, model) {
      if (!model || !Array.isArray(model.Circles)) return null;
      return model.Circles.find(c => c.Id === circleId || c.CircleId === circleId);
    }
  
    /**
     * tr要素からサークルIDを取得
     */
    function getCircleIdFromRow(tr) {
      // data-bind="attr: { id: Id }" から取得
      const id = tr.getAttribute('id');
      if (id) {
        const numId = parseInt(id, 10);
        if (!isNaN(numId)) return numId;
      }
      return null;
    }
  
    // ============================================================================
    // リンク置換機能
    // ============================================================================
  
    /**
     * アイコンとURLのマッピング
     */
    const ICON_URL_MAP = {
      'support-list-pixiv': 'PixivUrl',
      'support-list-twitter': 'TwitterUrl',
      'support-list-myhome': 'WebSite',
      'support-list-niconico': 'NiconicoUrl',
      'support-list-clipstudio': 'ClipstudioUrl'
    };
  
    /**
     * support-list内のアイコンにクリックイベントを設定
     */
    function replaceIconLinks() {
      const model = parseModel();
      if (!model) return;
  
      // 各サークルの行を取得
      const detailRows = Array.from(document.querySelectorAll('tr.webcatalog-circle-list-detail'));
      
      detailRows.forEach(tr => {
        const circleId = getCircleIdFromRow(tr);
        if (!circleId) return;
  
        const circleData = getCircleDataById(circleId, model);
        if (!circleData) return;
  
        // support-list内の各アイコンを処理
        const supportList = tr.querySelector('.support-list');
        if (!supportList) return;
  
        Object.keys(ICON_URL_MAP).forEach(iconClass => {
          const icon = supportList.querySelector(`.${iconClass}`);
          if (!icon) return;
  
          const urlProperty = ICON_URL_MAP[iconClass];
          const url = circleData[urlProperty];
  
          // URLが存在する場合のみ処理
          if (url && url.trim() !== '') {
            const parent = icon.parentElement;
            
            // 既に処理済みの場合はスキップ（data-link-replaced属性で判定）
            if (icon.hasAttribute('data-link-replaced')) return;
            
            // アイコンをaタグで囲む
            if (parent.tagName !== 'A') {
              const link = document.createElement('a');
              link.href = url;
              link.target = '_blank';
              link.rel = 'noopener noreferrer';
              link.style.cssText = 'display: inline-block; cursor: pointer; text-decoration: none;';
              
              // アイコンをリンクで囲む
              parent.insertBefore(link, icon);
              link.appendChild(icon);
              
              // クリックイベントを追加（Knockout.jsのイベントを上書き）
              link.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                e.stopImmediatePropagation(); // 他のイベントリスナーを阻止
                window.open(url, '_blank', 'noopener,noreferrer');
                return false;
              }, true); // capture phaseで実行してKnockout.jsより先に処理
              
              // 処理済みフラグを設定
              icon.setAttribute('data-link-replaced', 'true');
            } else {
              // 既にaタグの場合はhrefを更新
              parent.href = url;
              parent.target = '_blank';
              parent.rel = 'noopener noreferrer';
              
              // クリックイベントを追加（Knockout.jsのイベントを上書き）
              parent.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                e.stopImmediatePropagation();
                window.open(url, '_blank', 'noopener,noreferrer');
                return false;
              }, true); // capture phaseで実行してKnockout.jsより先に処理
              
              icon.setAttribute('data-link-replaced', 'true');
            }
          }
        });
      });
    }
  
    // ============================================================================
    // 初期化
    // ============================================================================
  
    /**
     * 初期化処理
     */
    function init() {
      replaceIconLinks();
    }
  
    // DOMContentLoadedを待つ
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
    
    // DOMの変更を監視してリンクを再設定
    new MutationObserver(() => {
      replaceIconLinks();
    }).observe(document.documentElement, { childList: true, subtree: true });
  })();

