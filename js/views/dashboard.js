/* views/dashboard.js — Editorial Dashboard */
App.views.dashboard = {
  async render() {
    var main = document.getElementById('main-content');
    var data;
    try { data = await API.getDashboard(App.token); }
    catch (err) { main.innerHTML = '<div class="banner critical">Gagal memuat dashboard: ' + escapeHtml(err.message) + '</div>'; return; }

    var bannersHtml = '';
    (data.banners || []).forEach(function(b) {
      bannersHtml += '<div class="banner ' + escapeHtml(b.severity) + '">' + escapeHtml(b.message) + '</div>';
    });

    var stats = data.stats || {};
    var projGrid = '';
    (data.project_cards || []).forEach(function(p) {
      var sev = p.severity || 'on-track';
      projGrid += '<div class="proj-card" onclick="navigate(\'projects\', { id: \'' + escapeHtml(p.project_id) + '\' })">' +
        '<div class="proj-card-no mono">' + escapeHtml(p.nomor_proyek || p.project_id) + '</div>' +
        '<div class="proj-card-title">' + escapeHtml(p.nama_proyek) + '</div>' +
        '<div class="flex items-center gap-2"><span class="badge ' + escapeHtml(sev) + '">' + sev.toUpperCase() + '</span>' +
        '<span class="text-mono text-soft">' + (p.activity_count||0) + ' ACTIVITY</span></div>' +
        '<div class="proj-card-progress"><div class="proj-card-progress-bar ' + escapeHtml(sev) + '" style="width:' + Math.min(100, p.progress_actual||0) + '%"></div></div>' +
        '<div class="proj-card-meta"><span class="mono">' + (p.progress_actual||0) + '%</span><span>' + escapeHtml(fmtDateLocal(p.tanggal_selesai)) + '</span></div></div>';
    });
    if (!projGrid) projGrid = '<div class="empty"><div class="empty-icon">◻</div><div class="empty-title">NO ACTIVE PROJECTS</div><div class="empty-sub">Buat project baru untuk mulai tracking.</div><button class="btn" onclick="navigate(\'projects\')">+ NEW PROJECT</button></div>';

    var mpHtml = '';
    (data.todays_manpower || []).forEach(function(p) {
      var items = (p.items||[]).map(function(it) {
        return '<span class="cal-pill ' + (it.has_conflict?'conflict':'') + '">' + escapeHtml(it.project_name) + ' · ' + escapeHtml(it.activity_name) + ' · ' + it.jam_total + 'h</span>';
      }).join('');
      mpHtml += '<div class="card" style="padding:16px"><div class="flex justify-between items-center mb-2"><strong>' + escapeHtml(p.nama_panggilan||p.nama) + '</strong><span class="text-mono text-soft">' + (p.items||[]).length + ' TASK</span></div><div>' + items + '</div></div>';
    });
    if (!mpHtml) mpHtml = '<div class="text-soft text-mono" style="padding:20px">Tidak ada assignment hari ini.</div>';

    main.innerHTML =
      '<div class="page-header"><div>' +
        '<div class="eyebrow">' + escapeHtml(data.today_display||'') + '</div>' +
        '<h1>HALO, ' + escapeHtml((App.user && App.user.display_name)||'') + '</h1></div>' +
        '<div class="flex gap-2"><button class="btn btn-ghost btn-sm" onclick="App.views.dashboard.render()">↻ REFRESH</button>' +
        '<button class="btn btn-sm" onclick="navigate(\'compose\')">✉ COMPOSE</button></div></div>' +
      bannersHtml +
      '<div class="stat-grid">' +
        '<div class="stat-card info"><div class="stat-label">ACTIVE PROJECTS</div><div class="stat-value">' + (stats.active_projects||0) + '</div></div>' +
        '<div class="stat-card ' + ((stats.overdue_todos||0)>0?'critical':'') + '"><div class="stat-label">OVERDUE</div><div class="stat-value">' + (stats.overdue_todos||0) + '</div></div>' +
        '<div class="stat-card ' + ((stats.due_today_todos||0)>0?'warning':'') + '"><div class="stat-label">DUE TODAY</div><div class="stat-value">' + (stats.due_today_todos||0) + '</div></div>' +
        '<div class="stat-card ' + ((stats.conflicts_this_week||0)>0?'warning':'') + '"><div class="stat-label">CONFLICTS</div><div class="stat-value">' + (stats.conflicts_this_week||0) + '</div></div>' +
        '<div class="stat-card ' + ((stats.critical_projects||0)>0?'critical':'') + '"><div class="stat-label">CRITICAL</div><div class="stat-value">' + (stats.critical_projects||0) + '</div></div>' +
        '<div class="stat-card"><div class="stat-label">PENDING REQ</div><div class="stat-value">' + (stats.pending_requests||0) + '</div></div></div>' +
      '<div class="mb-3 flex items-center justify-between"><h2>ACTIVE PROJECTS</h2>' +
        '<button class="btn btn-sm" onclick="App.views.projects && App.views.projects.openCreateModal()">+ NEW PROJECT</button></div>' +
      '<div class="proj-grid mb-4">' + projGrid + '</div>' +
      '<div class="mb-3 flex items-center justify-between"><h2>TODAY\'S MANPOWER</h2>' +
        '<button class="btn btn-secondary btn-sm" onclick="navigate(\'manpower\')">VIEW ALL →</button></div>' +
      '<div class="proj-grid">' + mpHtml + '</div>';
  }
};
