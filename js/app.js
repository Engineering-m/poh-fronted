/* ═══════════════════════════════════════════════════════════════
   app.js — router, auth, helpers
   App object defined in app-init.js (loaded first)
   ═══════════════════════════════════════════════════════════════ */

// ── TOAST ───────────────────────────────────────────────────────
function toast(msg, type) {
  type = type || 'info';
  var t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  document.getElementById('toast-container').appendChild(t);
  setTimeout(function() { t.style.opacity = '0'; setTimeout(function() { t.remove(); }, 200); }, 3500);
}

// ── MODAL ────────────────────────────────────────────────────────
var Modal = {
  open: function(title, bodyHtml, footerHtml) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHtml;
    document.getElementById('modal-footer').innerHTML = footerHtml || '';
    document.getElementById('modal-backdrop').style.display = 'flex';
  },
  close: function() {
    document.getElementById('modal-backdrop').style.display = 'none';
  },
  confirm: function(title, message, onConfirm) {
    Modal.open(title, '<p>' + escapeHtml(message) + '</p>',
      '<button class="btn btn-ghost" onclick="Modal.close()">BATAL</button>' +
      '<button class="btn btn-danger" id="modal-confirm-btn">LANJUT</button>');
    document.getElementById('modal-confirm-btn').onclick = function() { Modal.close(); onConfirm(); };
  }
};
document.getElementById('modal-close').onclick = function() { Modal.close(); };
document.getElementById('modal-backdrop').onclick = function(e) {
  if (e.target.id === 'modal-backdrop') Modal.close();
};

// ── HELPERS ──────────────────────────────────────────────────────
function escapeHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function fmtDateLocal(iso) {
  if (!iso) return '';
  if (iso instanceof Date) iso = iso.toISOString().slice(0, 10);
  var parts = String(iso).split('-');
  if (parts.length !== 3) return iso;
  var months = ['JAN','FEB','MAR','APR','MEI','JUN','JUL','AGU','SEP','OKT','NOV','DES'];
  return parseInt(parts[2], 10) + ' ' + months[parseInt(parts[1], 10) - 1] + ' ' + parts[0];
}

function todayStr() {
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

// ── THEME ─────────────────────────────────────────────────────────
function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('poh_theme', t);
  document.getElementById('btn-theme').textContent = t === 'dark' ? '◑' : '◐';
}
document.getElementById('btn-theme').onclick = function() {
  var cur = document.documentElement.getAttribute('data-theme');
  setTheme(cur === 'dark' ? 'light' : 'dark');
};

// ── SIDEBAR ───────────────────────────────────────────────────────
document.getElementById('btn-sidebar-toggle').onclick = function() {
  document.getElementById('sidebar').classList.toggle('collapsed');
  localStorage.setItem('poh_sidebar', document.getElementById('sidebar').classList.contains('collapsed') ? '1' : '0');
};

// ── ROUTER ────────────────────────────────────────────────────────
function navigate(route, params) {
  App.currentRoute = route;
  App.state.routeParams = params || {};
  document.querySelectorAll('.nav-item').forEach(function(el) {
    el.classList.toggle('active', el.dataset.route === route);
  });
  document.getElementById('breadcrumb').textContent = route.toUpperCase();
  var view = App.views[route];
  var main = document.getElementById('main-content');
  if (!view) {
    main.innerHTML = '<div class="empty"><div class="empty-icon">⚠</div><div class="empty-title">VIEW TIDAK TERSEDIA</div><div class="empty-sub mono">route: ' + escapeHtml(route) + '</div></div>';
    return;
  }
  main.innerHTML = '<div class="loading-state">LOADING…</div>';
  Promise.resolve(view.render(params || {})).catch(function(err) {
    console.error('view render error', err);
    main.innerHTML = '<div class="banner critical">Gagal memuat: ' + escapeHtml(err.message || err) + '</div>';
  });
}

document.querySelectorAll('.nav-item').forEach(function(el) {
  el.onclick = function(e) {
    e.preventDefault();
    var route = el.dataset.route;
    if (route) navigate(route);
  };
});

// ── AUTH FLOW ─────────────────────────────────────────────────────
function redirectToLogin() {
  sessionStorage.removeItem(CONFIG.SESSION_KEY);
  sessionStorage.removeItem('poh_user');
  window.location.href = 'login.html';
}

function showApp() {
  document.getElementById('main-container').style.display = 'block';
  var name = (App.user && App.user.display_name) || (App.user && App.user.username) || '';
  document.getElementById('user-display').textContent = name.toUpperCase();
  navigate('dashboard');
}

document.getElementById('btn-logout').onclick = async function() {
  if (!confirm('Logout?')) return;
  try { await API.logout(App.token); } catch(e) {}
  redirectToLogin();
};

window.onSessionExpired = function() {
  toast('Sesi berakhir. Silakan login kembali.', 'error');
  setTimeout(redirectToLogin, 1500);
};

// ── APP STARTUP ───────────────────────────────────────────────────
async function bootstrap() {
  var savedTheme = localStorage.getItem('poh_theme') || 'dark';
  setTheme(savedTheme);
  if (localStorage.getItem('poh_sidebar') === '1') {
    document.getElementById('sidebar').classList.add('collapsed');
  }
  var token = sessionStorage.getItem(CONFIG.SESSION_KEY);
  if (!token) { redirectToLogin(); return; }
  App.token = token;
  try {
    var userRaw = sessionStorage.getItem('poh_user');
    App.user = userRaw ? JSON.parse(userRaw) : {};
  } catch(e) { App.user = {}; }
  try {
    var validated = await API.call('validateSession', token);
    App.user = validated || App.user;
    showApp();
  } catch(err) { redirectToLogin(); }
}

window.addEventListener('DOMContentLoaded', bootstrap);
