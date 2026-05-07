/* views/projects.js — Projects view (placeholder - full version needs upload) */
App.views.projects = {
  chartInstance: null,
  async render(params) {
    if (params && params.id) return App.views.projects.renderDetail(params.id);
    return App.views.projects.renderList();
  },
  async renderList() {
    var main = document.getElementById('main-content');
    var data;
    try { data = await API.getProjects(App.token); }
    catch(err) { main.innerHTML = '<div class="banner critical">Gagal memuat: ' + escapeHtml(err.message) + '</div>'; return; }
    var rows = (data||[]).map(function(p) {
      return '<tr><td class="mono">' + escapeHtml(p.nomor_proyek||p.project_id) + '</td>' +
        '<td><a href="#" onclick="event.preventDefault();navigate(\'projects\',{id:\'' + p.project_id + '\'})">' + escapeHtml(p.nama_proyek) + '</a></td>' +
        '<td><span class="badge ' + escapeHtml(p.status) + '">' + escapeHtml(p.status) + '</span></td>' +
        '<td>' + escapeHtml(fmtDateLocal(p.tanggal_mulai)) + '</td>' +
        '<td>' + escapeHtml(fmtDateLocal(p.tanggal_selesai)) + '</td>' +
        '<td class="text-mono text-right">' + (p.activity_count||0) + '</td>' +
        '<td class="text-mono text-right">' + (p.progress_actual||0) + '%</td>' +
        '<td class="row-actions"><button class="btn btn-sm btn-ghost" onclick="navigate(\'projects\',{id:\'' + p.project_id + '\'})">BUKA</button></td></tr>';
    }).join('');
    main.innerHTML = '<div class="page-header"><div><div class="eyebrow">ALL PROJECTS</div><h1>PROJECTS</h1></div>' +
      '<button class="btn" onclick="App.views.projects.openCreateModal()">+ NEW PROJECT</button></div>' +
      (rows ? '<div class="table-wrap"><table class="tbl"><thead><tr><th>NO.</th><th>NAMA</th><th>STATUS</th><th>MULAI</th><th>SELESAI</th><th class="text-right">ACT</th><th class="text-right">PROGRESS</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>'
       : '<div class="empty"><div class="empty-icon">◻</div><div class="empty-title">NO PROJECTS</div><button class="btn" onclick="App.views.projects.openCreateModal()">+ NEW PROJECT</button></div>');
  },
  openCreateModal: function() {
    var html = '<div class="form-row"><label>NAMA PROYEK *</label><input class="input" id="np-nama" /></div>' +
      '<div class="form-row"><label>NOMOR PROYEK *</label><input class="input" id="np-no" /></div>' +
      '<div class="form-grid"><div class="form-row"><label>TANGGAL MULAI</label><input class="input" type="date" id="np-mulai" /></div>' +
      '<div class="form-row"><label>TANGGAL SELESAI</label><input class="input" type="date" id="np-selesai" /></div></div>' +
      '<div class="form-grid"><div class="form-row"><label>PEMOHON</label><input class="input" id="np-pemohon" /></div>' +
      '<div class="form-row"><label>LOKASI</label><input class="input" id="np-lokasi" /></div></div>' +
      '<div class="form-row"><label>KONDISI AWAL</label><textarea class="textarea" id="np-awal"></textarea></div>' +
      '<div class="form-row"><label>KONDISI AKHIR TARGET</label><textarea class="textarea" id="np-akhir"></textarea></div>';
    Modal.open('BUAT PROJECT BARU', html,
      '<button class="btn btn-ghost" onclick="Modal.close()">BATAL</button><button class="btn" id="btn-save-project">SIMPAN</button>');
    document.getElementById('btn-save-project').onclick = async function() {
      var payload = { nama_proyek: document.getElementById('np-nama').value.trim(), nomor_proyek: document.getElementById('np-no').value.trim(),
        tanggal_mulai: document.getElementById('np-mulai').value, tanggal_selesai: document.getElementById('np-selesai').value,
        pemohon: document.getElementById('np-pemohon').value, lokasi: document.getElementById('np-lokasi').value,
        kondisi_awal: document.getElementById('np-awal').value, kondisi_akhir_target: document.getElementById('np-akhir').value, status: 'active' };
      if (!payload.nama_proyek || !payload.nomor_proyek) { toast('Nama & Nomor wajib.', 'error'); return; }
      try { var r = await API.createProject(App.token, payload); Modal.close(); toast('Project dibuat.', 'success'); navigate('projects', { id: r.project_id }); }
      catch(e) { toast(e.message, 'error'); }
    };
  },
  async renderDetail(projectId) {
    var main = document.getElementById('main-content');
    try { var data = await API.getProjectDetail(App.token, projectId); }
    catch(err) { main.innerHTML = '<div class="banner critical">Gagal memuat detail: ' + escapeHtml(err.message) + '</div>'; return; }
    var p = data.project; App.state.currentProject = data;
    main.innerHTML = '<div class="page-header"><div><div class="eyebrow mono">' + escapeHtml(p.nomor_proyek) + '</div><h1>' + escapeHtml(p.nama_proyek) + '</h1>' +
      '<div class="flex items-center gap-2 mt-2"><span class="badge ' + escapeHtml(p.status) + '">' + escapeHtml(p.status) + '</span></div></div>' +
      '<div class="flex gap-2"><button class="btn btn-ghost btn-sm" onclick="navigate(\'projects\')">← BACK</button>' +
      '<button class="btn btn-sm" onclick="App.views.projects.exportExcel(\'' + projectId + '\')">⬇ EXCEL</button></div></div>' +
      '<div class="banner info mono">Detail view dengan S-Curve, activities, dan holidays akan tersedia setelah integrasi penuh.</div>';
  },
  async exportExcel(projectId) {
    toast('Mempersiapkan Excel…', 'info');
    try { var r = await API.exportExcel(App.token, projectId);
      Modal.open('EXCEL READY', '<p class="mono">File: ' + escapeHtml(r.file_name) + '</p><p class="mt-3"><a href="' + r.file_url + '" target="_blank" class="btn btn-secondary btn-sm">BUKA DI DRIVE</a> <a href="' + r.download_url + '" class="btn btn-sm">⬇ DOWNLOAD</a></p>',
        '<button class="btn" onclick="Modal.close()">OK</button>');
    } catch(e) { toast(e.message, 'error'); }
  }
};
