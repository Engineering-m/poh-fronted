/* views/manpower.js — Manpower view */
App.views.manpower = {
  async render() {
    var main = document.getElementById('main-content');
    main.innerHTML = '<div class="page-header"><div><div class="eyebrow">WORKFORCE</div><h1>MANPOWER</h1></div>' +
      '<button class="btn btn-sm" onclick="App.views.manpower.openModal()">+ TAMBAH</button></div><div id="mp-list"></div>';
    App.views.manpower.refresh();
  },
  async refresh() {
    var el = document.getElementById('mp-list'); if (!el) return;
    el.innerHTML = '<div class="loading-state">LOADING…</div>';
    var data;
    try { data = await API.getManpower(App.token); } catch(err) { el.innerHTML = '<div class="banner critical">' + escapeHtml(err.message) + '</div>'; return; }
    var rows = (data||[]).map(function(m) {
      return '<tr><td class="mono">' + escapeHtml(m.manpower_id) + '</td><td><strong>' + escapeHtml(m.nama) + '</strong>' +
        (m.nama_panggilan ? ' <span class="text-soft text-sm">(' + escapeHtml(m.nama_panggilan) + ')</span>' : '') + '</td>' +
        '<td>' + (m.roles_array||[]).map(function(r){return '<span class="badge medium">'+escapeHtml(r)+'</span>';}).join(' ') + '</td>' +
        '<td><span class="badge ' + (m.status==='active'?'active':'archived') + '">' + escapeHtml(m.status) + '</span></td></tr>';
    }).join('');
    el.innerHTML = (data&&data.length) ? '<div class="table-wrap"><table class="tbl"><thead><tr><th>ID</th><th>NAMA</th><th>ROLES</th><th>STATUS</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
      : '<div class="empty"><div class="empty-icon">⚇</div><div class="empty-title">NO MANPOWER</div><button class="btn" onclick="App.views.manpower.openModal()">+ TAMBAH</button></div>';
  },
  openModal: function() { toast('Manpower form akan tersedia di iterasi berikutnya.', 'info'); }
};
