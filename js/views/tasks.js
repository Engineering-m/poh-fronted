/* views/tasks.js — Tasks & Requests */
App.views.tasks = {
  async render() {
    var main = document.getElementById('main-content');
    main.innerHTML = '<div class="page-header"><div><div class="eyebrow">PERSONAL WORKFLOW</div><h1>TASKS</h1></div>' +
      '<button class="btn" onclick="App.views.tasks.openModal()">+ TAMBAH TODO</button></div><div id="tasks-list"></div>';
    App.views.tasks.refresh();
  },
  async refresh() {
    var el = document.getElementById('tasks-list'); if (!el) return;
    var todos;
    try { todos = await API.getTodos(App.token) || []; } catch(e) { todos = []; }
    var rows = todos.map(function(t) {
      return '<tr><td><span class="badge ' + escapeHtml(t.prioritas) + '">' + escapeHtml(t.prioritas) + '</span></td>' +
        '<td><strong>' + escapeHtml(t.deskripsi) + '</strong></td><td>' + escapeHtml(t.pemberi_tugas) + '</td>' +
        '<td><span class="badge ' + (t.status==='done'?'completed':'draft') + '">' + escapeHtml(t.status) + '</span></td>' +
        '<td class="text-mono">' + escapeHtml(fmtDateLocal(t.due_date)||'—') + '</td></tr>';
    }).join('');
    el.innerHTML = todos.length ? '<div class="table-wrap"><table class="tbl"><thead><tr><th>PRIO</th><th>DESKRIPSI</th><th>PEMBERI</th><th>STATUS</th><th>DUE</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
      : '<div class="empty"><div class="empty-icon">✓</div><div class="empty-title">NO TASKS</div><button class="btn" onclick="App.views.tasks.openModal()">+ TAMBAH</button></div>';
  },
  openModal: function() { toast('Todo form akan tersedia di iterasi berikutnya.', 'info'); }
};

App.views.requests = {
  async render() {
    var main = document.getElementById('main-content');
    main.innerHTML = '<div class="page-header"><div><div class="eyebrow">PRE-PROJECT PIPELINE</div><h1>REQUESTS</h1></div>' +
      '<button class="btn" onclick="toast(\'Request form coming soon.\',\'info\')">+ TAMBAH</button></div><div id="req-list"></div>';
    var reqs;
    try { reqs = await API.getRequests(App.token) || []; } catch(e) { reqs = []; }
    var el = document.getElementById('req-list');
    if (!reqs.length) { el.innerHTML = '<div class="empty"><div class="empty-icon">✎</div><div class="empty-title">NO REQUESTS</div></div>'; return; }
    var cards = reqs.map(function(r) {
      return '<div class="card mb-3"><div class="flex justify-between items-center mb-2"><div><span class="badge ' + escapeHtml(r.prioritas) + '">' + escapeHtml(r.prioritas) + '</span> ' +
        '<span class="badge">' + escapeHtml(r.status) + '</span></div><span class="text-mono text-soft">' + escapeHtml(r.tanggal_request||'') + '</span></div>' +
        '<h3 style="margin-bottom:6px">' + escapeHtml(r.deskripsi) + '</h3>' +
        '<div class="text-sm">PEMOHON: ' + escapeHtml(r.pemohon) + '</div></div>';
    }).join('');
    el.innerHTML = cards;
  }
};
