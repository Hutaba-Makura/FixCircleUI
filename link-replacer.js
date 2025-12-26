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
      if (!model) {
        return;
      }

      // 各サークルの行を取得
      const detailRows = Array.from(document.querySelectorAll('tr.webcatalog-circle-list-detail'));
      
      if (detailRows.length === 0) {
        return; // まだDOMが生成されていない
      }
      
      let processedCount = 0;
      detailRows.forEach(tr => {
        const circleId = getCircleIdFromRow(tr);
        if (!circleId) return;

        const circleData = getCircleDataById(circleId, model);
        if (!circleData) {
          return;
        }

        // support-list内の各アイコンを処理
        // HTML構造: tr.webcatalog-circle-list-detail (1行目) -> tr (2行目) -> tr (3行目にsupport-list)
        let supportList = null;
        
        // 方法1: 次の次の兄弟要素から探す
        const thirdRow = tr.nextElementSibling?.nextElementSibling;
        if (thirdRow) {
          supportList = thirdRow.querySelector('.support-list');
        }
        
        // 方法2: まだ見つからない場合は、table内のすべてのsupport-listから対応するものを探す
        if (!supportList) {
          const table = tr.closest('table');
          if (table) {
            const allSupportLists = Array.from(table.querySelectorAll('.support-list'));
            const allDetailRows = Array.from(table.querySelectorAll('tr.webcatalog-circle-list-detail'));
            const trIndex = allDetailRows.indexOf(tr);
            if (trIndex >= 0 && trIndex < allSupportLists.length) {
              supportList = allSupportLists[trIndex];
            }
          }
        }
        
        if (!supportList) {
          return; // support-listが見つからない
        }
        
        processSupportList(supportList, circleData, circleId);
        processedCount++;
      });
      
      if (processedCount > 0) {
        console.log(`Processed ${processedCount} support lists`);
      }
    }
    
    /**
     * support-list内のアイコンを処理
     */
    function processSupportList(supportList, circleData, circleId) {
  
      Object.keys(ICON_URL_MAP).forEach(iconClass => {
        const icon = supportList.querySelector(`.${iconClass}`);
        if (!icon) return;

        const urlProperty = ICON_URL_MAP[iconClass];
        const url = circleData[urlProperty];

        // URLが存在する場合のみ処理
        if (url && url.trim() !== '') {
          // 既に処理済みの場合はスキップ（data-link-replaced属性で判定）
          if (icon.hasAttribute('data-link-replaced')) return;
          
          const parent = icon.parentElement;
          
          // Knockout.jsのイベントバインディングを無効化するため、img要素をクローンして置き換え
          const newIcon = icon.cloneNode(true);
          
          // data-bind属性からclickイベントを削除
          const dataBind = newIcon.getAttribute('data-bind');
          if (dataBind) {
            // clickイベントを削除したdata-bindを作成
            let newDataBind = dataBind.replace(/click\s*:\s*[^,}]+/g, '').replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '');
            if (newDataBind.trim() === '') {
              newIcon.removeAttribute('data-bind');
            } else {
              newIcon.setAttribute('data-bind', newDataBind);
            }
          }
          
          // アイコンをaタグで囲む
          if (parent.tagName !== 'A') {
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.style.cssText = 'display: inline-block; cursor: pointer; text-decoration: none;';
            
            // 新しいアイコンをリンクに追加
            link.appendChild(newIcon);
            
            // 元のアイコンを新しいリンクで置き換え
            parent.replaceChild(link, icon);
            
            // クリックイベントを追加
            link.addEventListener('click', (e) => {
              e.stopPropagation();
              e.preventDefault();
              e.stopImmediatePropagation();
              window.open(url, '_blank', 'noopener,noreferrer');
              return false;
            }, true);
            
            // 処理済みフラグを設定
            newIcon.setAttribute('data-link-replaced', 'true');
          } else {
            // 既にaタグの場合はhrefを更新し、アイコンを置き換え
            parent.href = url;
            parent.target = '_blank';
            parent.rel = 'noopener noreferrer';
            
            // 元のアイコンを新しいアイコンで置き換え
            parent.replaceChild(newIcon, icon);
            
            // クリックイベントを追加
            parent.addEventListener('click', (e) => {
              e.stopPropagation();
              e.preventDefault();
              e.stopImmediatePropagation();
              window.open(url, '_blank', 'noopener,noreferrer');
              return false;
            }, true);
            
            newIcon.setAttribute('data-link-replaced', 'true');
          }
        }
      });
    }
  
    // ============================================================================
    // 初期化
    // ============================================================================

    /**
     * 初期化処理
     */
    function init() {
      // Knockout.jsがDOMを生成するのを待つ
      waitForKnockoutRender();
    }
    
    /**
     * Knockout.jsのレンダリング完了を待つ
     */
    function waitForKnockoutRender() {
      const maxAttempts = 50; // 最大5秒間待つ（100ms × 50）
      let attempts = 0;
      
      const checkAndProcess = () => {
        attempts++;
        
        // tableが表示されているか、support-listが存在するか確認
        const table = document.querySelector('table.md-infotable.t-user-favorites');
        const hasSupportLists = document.querySelectorAll('.support-list').length > 0;
        const hasDetailRows = document.querySelectorAll('tr.webcatalog-circle-list-detail').length > 0;
        
        if ((table && table.style.display !== 'none') || (hasSupportLists && hasDetailRows)) {
          // DOMが生成されたので処理を実行
          replaceIconLinks();
          
          // さらに少し待ってからもう一度実行（遅延レンダリングに対応）
          setTimeout(() => {
            replaceIconLinks();
          }, 500);
        } else if (attempts < maxAttempts) {
          // まだDOMが生成されていないので再試行
          setTimeout(checkAndProcess, 100);
        }
      };
      
      // DOMContentLoadedを待つ
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          setTimeout(checkAndProcess, 200);
        });
      } else {
        setTimeout(checkAndProcess, 200);
      }
    }
    
    // DOMの変更を監視してリンクを再設定（デバウンス付き）
    let mutationTimeout;
    const mutationObserver = new MutationObserver(() => {
      clearTimeout(mutationTimeout);
      mutationTimeout = setTimeout(() => {
        replaceIconLinks();
      }, 300);
    });
    
    mutationObserver.observe(document.documentElement, { 
      childList: true, 
      subtree: true,
      attributes: true,
      attributeFilter: ['style'] // style属性の変更も監視（tableの表示/非表示）
    });
  })();

