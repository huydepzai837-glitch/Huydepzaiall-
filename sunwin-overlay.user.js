// ==UserScript==
// @name         Sunwin Tài Xỉu Analyzer Overlay
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Robot phân tích tỉ lệ Tài/Xỉu chạy overlay trên sunwin.show
// @author       Sunwin Analyzer
// @match        https://sunwin.show/*
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-end
// ==/UserScript==

(function() {
  'use strict';

  let predictionHistory = [];
  const MAX_HISTORY = 100;

  // Tải dữ liệu
  function loadData() {
    const saved = GM_getValue('taixiu-overlay-data', '[]');
    predictionHistory = JSON.parse(saved);
  }

  // Lưu dữ liệu
  function saveData() {
    GM_setValue('taixiu-overlay-data', JSON.stringify(predictionHistory));
  }

  // Tạo panel overlay
  function createOverlay() {
    if (document.getElementById('taixiu-overlay-panel')) return;

    const panel = document.createElement('div');
    panel.id = 'taixiu-overlay-panel';
    panel.innerHTML = `
      <div class="overlay-header">
        <div class="header-title">🔮 TÀI XỈU ANALYZER</div>
        <div class="header-controls">
          <button id="minimize-btn" class="control-btn">−</button>
          <button id="close-btn" class="control-btn">✕</button>
        </div>
      </div>

      <div class="overlay-body">
        <div class="stats-row">
          <div class="stat-mini">
            <div class="stat-label">📈 TÀI</div>
            <div class="stat-value" id="tai-pct">0%</div>
            <div class="stat-small" id="tai-count">0</div>
          </div>
          <div class="stat-mini">
            <div class="stat-label">📉 XỈU</div>
            <div class="stat-value" id="xiu-pct">0%</div>
            <div class="stat-small" id="xiu-count">0</div>
          </div>
        </div>

        <div class="recommendation">
          <div class="rec-label">💡 GỢI Ý:</div>
          <div class="rec-text" id="rec-text">Chưa có dữ liệu</div>
        </div>

        <div class="mini-chart">
          <div class="chart-bar">
            <div class="bar tai-bar" id="tai-bar" style="width: 0%"></div>
            <div class="bar xiu-bar" id="xiu-bar" style="width: 0%"></div>
          </div>
        </div>

        <div class="history-mini" id="history-mini">
          <span style="color: #aaa;">Chưa có</span>
        </div>

        <div class="button-row">
          <button id="add-tai" class="btn-add">TÀI</button>
          <button id="add-xiu" class="btn-add">XỈU</button>
          <button id="reset-btn" class="btn-reset">RESET</button>
        </div>
      </div>
    `;

    document.body.appendChild(panel);
    addStyles();
    attachEvents();
    loadData();
    updateDisplay();
  }

  // Thêm CSS
  function addStyles() {
    if (document.getElementById('taixiu-overlay-styles')) return;

    const style = document.createElement('style');
    style.id = 'taixiu-overlay-styles';
    style.textContent = `
      #taixiu-overlay-panel {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 280px;
        background: linear-gradient(135deg, rgba(10, 14, 39, 0.95), rgba(26, 0, 51, 0.95));
        border: 2px solid #ff00ff;
        border-radius: 12px;
        box-shadow: 0 0 40px rgba(255, 0, 255, 0.5), 0 0 80px rgba(0, 234, 255, 0.2);
        z-index: 999999;
        color: white;
        font-family: Arial, sans-serif;
        backdrop-filter: blur(10px);
      }

      .overlay-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        background: rgba(255, 0, 255, 0.15);
        border-bottom: 1px solid #ff00ff;
        border-radius: 10px 10px 0 0;
      }

      .header-title {
        font-size: 14px;
        font-weight: bold;
        color: #ff00ff;
      }

      .header-controls {
        display: flex;
        gap: 5px;
      }

      .control-btn {
        width: 25px;
        height: 25px;
        background: rgba(0, 234, 255, 0.2);
        border: 1px solid #00eaff;
        color: #00eaff;
        border-radius: 5px;
        cursor: pointer;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: 0.3s;
      }

      .control-btn:hover {
        background: #00eaff;
        color: #000;
      }

      .overlay-body {
        padding: 12px;
      }

      .stats-row {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
      }

      .stat-mini {
        flex: 1;
        background: rgba(0, 234, 255, 0.1);
        border: 1px solid #00eaff;
        border-radius: 8px;
        padding: 10px;
        text-align: center;
      }

      .stat-label {
        font-size: 10px;
        color: #888;
        margin-bottom: 5px;
      }

      .stat-value {
        font-size: 18px;
        font-weight: bold;
        color: #00eaff;
      }

      .stat-small {
        font-size: 9px;
        color: #666;
        margin-top: 3px;
      }

      .recommendation {
        background: rgba(255, 0, 255, 0.1);
        border: 1px solid #ff00ff;
        border-radius: 8px;
        padding: 10px;
        margin-bottom: 10px;
        font-size: 11px;
      }

      .rec-label {
        color: #ff00ff;
        font-size: 9px;
        margin-bottom: 5px;
      }

      .rec-text {
        font-size: 14px;
        font-weight: bold;
        color: #00ff00;
      }

      .mini-chart {
        margin-bottom: 10px;
      }

      .chart-bar {
        display: flex;
        gap: 3px;
        height: 20px;
      }

      .bar {
        border-radius: 3px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 8px;
        color: white;
        font-weight: bold;
      }

      .tai-bar {
        background: linear-gradient(90deg, #00ff00, #00cc00);
      }

      .xiu-bar {
        background: linear-gradient(90deg, #ff6b6b, #ff0000);
      }

      .history-mini {
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
        margin-bottom: 10px;
        min-height: 24px;
        background: rgba(0, 234, 255, 0.05);
        border: 1px dashed #00eaff;
        border-radius: 6px;
        padding: 6px;
      }

      .history-dot {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        border: 1px solid;
      }

      .history-dot.tai {
        background: rgba(0, 255, 0, 0.2);
        border-color: #00ff00;
      }

      .history-dot.xiu {
        background: rgba(255, 107, 107, 0.2);
        border-color: #ff6b6b;
      }

      .button-row {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 6px;
      }

      .btn-add {
        padding: 8px;
        background: linear-gradient(90deg, #ff00ff, #00eaff);
        border: none;
        border-radius: 6px;
        color: white;
        font-weight: bold;
        font-size: 11px;
        cursor: pointer;
        transition: 0.3s;
      }

      .btn-add:hover {
        transform: scale(1.05);
        box-shadow: 0 0 10px rgba(0, 234, 255, 0.6);
      }

      .btn-reset {
        padding: 8px;
        background: rgba(255, 0, 0, 0.3);
        border: 1px solid #ff6b6b;
        border-radius: 6px;
        color: #ff6b6b;
        font-weight: bold;
        font-size: 11px;
        cursor: pointer;
        transition: 0.3s;
      }

      .btn-reset:hover {
        background: rgba(255, 0, 0, 0.5);
      }

      .overlay-minimized .overlay-body {
        display: none;
      }

      /* Responsive */
      @media (max-width: 768px) {
        #taixiu-overlay-panel {
          width: 250px;
          top: 10px;
          right: 10px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  // Gắn sự kiện
  function attachEvents() {
    document.getElementById('add-tai').addEventListener('click', () => addResult('tai'));
    document.getElementById('add-xiu').addEventListener('click', () => addResult('xiu'));
    document.getElementById('reset-btn').addEventListener('click', resetData);
    document.getElementById('close-btn').addEventListener('click', closeOverlay);
    document.getElementById('minimize-btn').addEventListener('click', toggleMinimize);

    // Kéo panel
    makeDraggable('taixiu-overlay-panel', 'overlay-header');
  }

  // Thêm kết quả
  function addResult(type) {
    if (predictionHistory.length >= MAX_HISTORY) {
      predictionHistory.shift();
    }
    predictionHistory.push(type);
    saveData();
    updateDisplay();
  }

  // Cập nhật hiển thị
  function updateDisplay() {
    if (predictionHistory.length === 0) {
      document.getElementById('tai-pct').textContent = '0%';
      document.getElementById('xiu-pct').textContent = '0%';
      document.getElementById('tai-count').textContent = '0';
      document.getElementById('xiu-count').textContent = '0';
      document.getElementById('rec-text').textContent = 'Chưa có';
      document.getElementById('tai-bar').style.width = '0%';
      document.getElementById('xiu-bar').style.width = '0%';
      document.getElementById('history-mini').innerHTML = '<span style="color: #aaa; font-size: 10px;">Chưa có</span>';
      return;
    }

    const taiCount = predictionHistory.filter(r => r === 'tai').length;
    const xiuCount = predictionHistory.filter(r => r === 'xiu').length;
    const total = predictionHistory.length;

    const taiPct = Math.round((taiCount / total) * 100);
    const xiuPct = Math.round((xiuCount / total) * 100);

    document.getElementById('tai-pct').textContent = taiPct + '%';
    document.getElementById('xiu-pct').textContent = xiuPct + '%';
    document.getElementById('tai-count').textContent = taiCount;
    document.getElementById('xiu-count').textContent = xiuCount;

    document.getElementById('tai-bar').style.width = taiPct + '%';
    document.getElementById('xiu-bar').style.width = xiuPct + '%';

    let rec = 'Cân bằng';
    if (taiPct > xiuPct + 5) {
      rec = '➕ ĐẶT TÀI';
    } else if (xiuPct > taiPct + 5) {
      rec = '➖ ĐẶT XỈU';
    }
    document.getElementById('rec-text').textContent = rec;

    // Lịch sử
    const recent = predictionHistory.slice(-8);
    const historyHTML = recent.map(item => `
      <div class="history-dot ${item}">${item === 'tai' ? '⬆️' : '⬇️'}</div>
    `).join('');
    document.getElementById('history-mini').innerHTML = historyHTML;
  }

  // Reset
  function resetData() {
    if (confirm('Xóa tất cả dữ liệu?')) {
      predictionHistory = [];
      saveData();
      updateDisplay();
    }
  }

  // Đóng overlay
  function closeOverlay() {
    document.getElementById('taixiu-overlay-panel').remove();
  }

  // Ẩn/hiện overlay
  function toggleMinimize() {
    const panel = document.getElementById('taixiu-overlay-panel');
    panel.classList.toggle('overlay-minimized');
  }

  // Kéo panel
  function makeDraggable(elementId, handleId) {
    const element = document.getElementById(elementId);
    const handle = document.getElementById(handleId);
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    handle.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      element.style.top = (element.offsetTop - pos2) + 'px';
      element.style.right = 'auto';
      element.style.left = (element.offsetLeft - pos1) + 'px';
    }

    function closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }

  // Khởi tạo
  createOverlay();
})();
