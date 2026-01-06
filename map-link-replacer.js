/**
 * リンク置換機能
 * マップページで、サークルマーカーをクリックした時、
 * サークル詳細ページではなく、直接リンク先に飛ぶようにします
 */
(function () {
    'use strict';
  
    // ページタイプをチェック
    const url = window.location.pathname;
    const isMapPage = url.includes('/Map');
    
    if (!isMapPage) {
      return; // マップページでない場合は終了
    }

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
        const circleData = getCircleData();
        if (!circleData) {
          return;
        }
  
        const circleModal = getCircleModal();

        if (!circleModal) {
          return;
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

      
})();