/* ═══════════════════════════════════════════════════════════════
   app.js — router, auth, helpers
   App object defined in app-init.js (loaded first)
   ═══════════════════════════════════════════════════════════════ */

// ── TOAST ───────────────────────────────────────────────────────
var _toastQueue = [];
var _toastActive = 0;
var _toastMax = 3;

function toast(msg, type) {
  type = type || 'info';
  if (_toastActive >= _toastMax) { _toastQueue.push({msg:msg,type:type}); return; }
  _showToast(msg, type);
}

function _showToast(msg, type) {
  _toastActive++;
  var t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  var container = document.getElementById('toast-container');
  if (!container) return;
  container.appendChild(t);
  setTimeout(function() {
    t.style.opacity = '0';
    setTimeout(function() {
      t.remove();
      _toastActive--;
      if (_toastQueue.length > 0) {
        var next = _toastQueue.shift();
        _showToast(next.msg, next.type);
      }
    }, 200);
  }, 3500);
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
    document.getElementById('modal-confirm-btn').onclick = function() {
      Modal.close();
      onConfirm();
    };
  }
};
document.getElementById('modal-close').onclick = function() { Modal.close(); };
document.getElementById('modal-backdrop').onclick = function(e) {
  if (e.target.id === 'modal-backdrop') Modal.close();
};

// Keyboard: Esc closes modal
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') Modal.close();
});

// ── HELPERS ──────────────────────────────────────────────────────
function escapeHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;');
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
  return d.getFullYear() + '-' +
    String(d.getMonth()+1).padStart(2,'0') + '-' +
    String(d.getDate()).padStart(2,'0');
}

// ── THEME ─────────────────────────────────────────────────────────
function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('poh_theme', t);
  var btn = document.getElementById('btn-theme');
  if (btn) btn.textContent = t === 'dark' ? '◑' : '◐';
}

document.getElementById('btn-theme').onclick = function() {
  var cur = document.documentElement.getAttribute('data-theme');
  setTheme(cur === 'dark' ? 'light' : 'dark');
};

// ── SIDEBAR ───────────────────────────────────────────────────────
document.getElementById('btn-sidebar-toggle').onclick = function() {
  document.getElementById('sidebar').classList.toggle('collapsed');
  localStorage.setItem('poh_sidebar',
    document.getElementById('sidebar').classList.contains('collapsed') ? '1' : '0'
  );
};

// ── ROUTER ────────────────────────────────────────────────────────
function navigate(route, params) {
  App.currentRoute = route;
  App.state.routeParams = params || {};

  // Update sidebar active state
  document.querySelectorAll('.nav-item').forEach(function(el) {
    el.classList.toggle('active', el.dataset.route === route);
  });

  // Update bottom nav active state (mobile)
  document.querySelectorAll('.bottom-nav-item').forEach(function(el) {
    el.classList.toggle('active', el.dataset.route === route);
  });

  // Update breadcrumb
  var crumb = document.getElementById('breadcrumb');
  if (crumb) crumb.textContent = route.toUpperCase();

  var view = App.views[route];
  var main = document.getElementById('main-content');
  if (!view) {
    main.innerHTML =
      '<div class="empty">' +
        '<div class="empty-icon">⚠</div>' +
        '<div class="empty-title">VIEW TIDAK TERSEDIA</div>' +
        '<div class="empty-sub mono">route: ' + escapeHtml(route) + '</div>' +
      '</div>';
    return;
  }

  main.innerHTML = '<div class="loading-state">LOADING…</div>';
  Promise.resolve(view.render(params || {})).catch(function(err) {
    console.error('view render error', err);
    main.innerHTML =
      '<div class="banner critical">Gagal memuat: ' +
      escapeHtml(err.message || String(err)) + '</div>';
  });
}

// Sidebar nav click handlers
document.querySelectorAll('.nav-item').forEach(function(el) {
  el.onclick = function(e) {
    e.preventDefault();
    var route = el.dataset.route;
    if (route) navigate(route);
  };
});

// Bottom nav click handlers (mobile)
document.querySelectorAll('.bottom-nav-item').forEach(function(el) {
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
  var name = (App.user && App.user.display_name) ||
             (App.user && App.user.username) || '';
  var el = document.getElementById('user-display');
  if (el) el.textContent = name.toUpperCase();
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

// ── LOADING BUTTON HELPER ─────────────────────────────────────────
// Usage: var done = btnLoading('btn-id', 'LOADING...'); → done(); or done('ERROR TEXT');
function btnLoading(id, loadingText) {
  var btn = document.getElementById(id);
  if (!btn) return function(){};
  var original = btn.textContent;
  btn.disabled = true;
  btn.textContent = loadingText || 'LOADING…';
  return function(errText) {
    btn.disabled = false;
    btn.textContent = errText || original;
  };
}

// ── APP STARTUP ───────────────────────────────────────────────────
async function bootstrap() {
  // Theme
  var savedTheme = localStorage.getItem('poh_theme') || 'dark';
  setTheme(savedTheme);

  // Sidebar state (desktop only)
  if (localStorage.getItem('poh_sidebar') === '1') {
    var sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.add('collapsed');
  }

  // Check session
  var token = sessionStorage.getItem(CONFIG.SESSION_KEY);
  if (!token) { redirectToLogin(); return; }
  App.token = token;

  // Load user
  try {
    var userRaw = sessionStorage.getItem('poh_user');
    App.user = userRaw ? JSON.parse(userRaw) : {};
  } catch(e) { App.user = {}; }

  // Validate session with server
  try {
    var validated = await API.call('validateSession', token);
    App.user = validated || App.user;
    showApp();
  } catch(err) {
    redirectToLogin();
  }
}

window.addEventListener('DOMContentLoaded', bootstrap);