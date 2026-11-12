/* TripMate v3.3 — UI gate: this is a UX requirement, not an access-control mechanism. */
(() => {
  'use strict';
  const standalone = () => window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches || window.navigator.standalone === true;
  const gate = document.getElementById('install-gate');
  const app = document.getElementById('app');
  const feedback = document.getElementById('install-feedback');
  const ua = navigator.userAgent || '';
  const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const android = /Android/i.test(ua);
  const panelId = ios ? 'install-ios' : android ? 'install-android' : 'install-desktop';
  let launchStarted = false;
  let deferredPrompt = null;
  async function launch() {
    if (launchStarted) return;
    launchStarted = true;
    gate.hidden = true;
    app.hidden = false;
    const load = (src) => new Promise((resolve, reject) => {
      const el = document.createElement('script');
      el.src = src;
      el.onload = resolve;
      el.onerror = reject;
      document.body.appendChild(el);
    });
    try {
      await load('./firebase-config.js');
      await load('./app.js');
    } catch (err) {
      app.innerHTML = '<div style="padding:28px;font-family:sans-serif">Không tải được TripMate. Vui lòng kiểm tra mạng và thử lại.</div>';
      console.error(err);
    }
  }
  if (standalone() || (['localhost','127.0.0.1'].includes(location.hostname) && new URLSearchParams(location.search).has('preview'))) { launch(); return; }
  app.hidden = true;
  gate.hidden = false;
  document.getElementById(panelId).hidden = false;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const btn = document.getElementById('install-native');
    btn.hidden = false;
  });
  document.getElementById('install-native').addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try { await deferredPrompt.userChoice; } catch (_) {}
    deferredPrompt = null;
    document.getElementById('install-native').hidden = true;
  });
  document.getElementById('install-recheck').addEventListener('click', () => {
    if (standalone() || (['localhost','127.0.0.1'].includes(location.hostname) && new URLSearchParams(location.search).has('preview'))) { launch(); return; }
    feedback.textContent = 'Hãy mở TripMate từ biểu tượng trên màn hình chính, không phải từ tab trình duyệt này.';
  });
  window.matchMedia('(display-mode: standalone)').addEventListener?.('change', () => { if (standalone()) launch(); });
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
})();
