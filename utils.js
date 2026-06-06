/* 共通ユーティリティ
 * 簡易グローバル登録方式（互換性重視）
 */
(function () {
  'use strict';

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

  // 既存の名前空間を上書きせずに拡張
  window.FixCircleUI = Object.assign(window.FixCircleUI || {}, {
    parseModel,
    getCircleDataById,
    getCircleIdFromRow
  });
})();
