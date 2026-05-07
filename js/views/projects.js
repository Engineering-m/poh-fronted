/* views/projects.js — Full projects view with S-Curve, Activities, Holidays */
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
        '<td>' + escapeHtml(fmtDateLocal(p.tanggal_mulai)) + '</td><td>' + escapeHtml(fmtDateLocal(p.tanggal_selesai)) + '</td>' +
        '<td class="text-mono text-right">' + (p.activity_count||0) + '</td><td class="text-mono text-right">' + (p.progress_actual||0) + '%</td>' +
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
    var data;
    try { data = await API.getProjectDetail(App.token, projectId); }
    catch(err) { main.innerHTML = '<div class="banner critical">Gagal memuat: ' + escapeHtml(err.message) + '</div>'; return; }
    var p = data.project; var acts = data.activities||[]; var hols = data.holidays||[];
    App.state.currentProject = data;
    main.innerHTML = '<div class="page-header"><div><div class="eyebrow mono">' + escapeHtml(p.nomor_proyek) + ' · ' + escapeHtml(p.project_id) + '</div>' +
      '<h1>' + escapeHtml(p.nama_proyek) + '</h1>' +
      '<div class="flex items-center gap-2 mt-2"><span class="badge ' + escapeHtml(p.status) + '">' + escapeHtml(p.status) + '</span>' +
      '<span class="text-soft text-sm">' + escapeHtml(fmtDateLocal(p.tanggal_mulai)) + ' → ' + escapeHtml(fmtDateLocal(p.tanggal_selesai)) + '</span></div></div>' +
      '<div class="flex gap-2"><button class="btn btn-ghost btn-sm" onclick="navigate(\'projects\')">← BACK</button>' +
      '<button class="btn btn-sm" onclick="App.views.projects.exportExcel(\'' + projectId + '\')">⬇ EXCEL</button></div></div>' +
      '<div class="tabs">' +
        '<div class="tab active" data-tab="overview" onclick="App.views.projects.switchTab(\'' + projectId + '\',\'overview\')">OVERVIEW</div>' +
        '<div class="tab" data-tab="activities" onclick="App.views.projects.switchTab(\'' + projectId + '\',\'activities\')">ACTIVITIES (' + acts.length + ')</div>' +
        '<div class="tab" data-tab="holidays" onclick="App.views.projects.switchTab(\'' + projectId + '\',\'holidays\')">HOLIDAYS (' + hols.length + ')</div>' +
        '<div class="tab" data-tab="info" onclick="App.views.projects.switchTab(\'' + projectId + '\',\'info\')">INFO</div></div>' +
      '<div id="tab-content"></div>';
    App.views.projects.switchTab(projectId, 'overview');
  },
  switchTab: function(projectId, tab) {
    document.querySelectorAll('.tab').forEach(function(t){t.classList.toggle('active',t.dataset.tab===tab);});
    var tc = document.getElementById('tab-content');
    if (tab==='overview') return App.views.projects.renderOverviewTab(projectId, tc);
    if (tab==='activities') return App.views.projects.renderActivitiesTab(projectId, tc);
    if (tab==='holidays') return App.views.projects.renderHolidaysTab(projectId, tc);
    if (tab==='info') return App.views.projects.renderInfoTab(projectId, tc);
  },
  async renderOverviewTab(projectId, tc) {
    tc.innerHTML = '<div class="loading-state">MEMUAT S-CURVE…</div>';
    var sc;
    try { sc = await API.getSCurve(App.token, projectId); }
    catch(err) { tc.innerHTML = '<div class="banner critical">Gagal memuat S-Curve: ' + escapeHtml(err.message) + '</div>'; return; }
    var vb = '';
    if (sc.variance) {
      var v = sc.variance; var sign = v.deviation >= 0 ? '+' : '';
      vb = '<div class="banner ' + v.severity + '"><strong>' + v.severity.toUpperCase() + '</strong> — Planned: ' + v.planned_pct + '% · Actual: ' + v.actual_pct + '% · Deviation: ' + sign + v.deviation + '%</div>';
    }
    tc.innerHTML = vb +
      '<div class="scurve-wrap"><div class="flex justify-between items-center mb-2"><h3>S-CURVE</h3>' +
      '<span class="text-mono text-soft">' + (sc.dates||[]).length + ' HARI · ' + (sc.holidays||[]).length + ' LIBUR</span></div>' +
      '<div class="scurve-canvas-wrap"><canvas id="scurve-canvas"></canvas></div></div>' +
      '<div id="overview-act-tbl"></div>';
    App.views.projects.drawSCurve(sc);
    App.views.projects.renderActivitiesTable(projectId, document.getElementById('overview-act-tbl'));
  },
  drawSCurve: function(sc) {
    var ctx = document.getElementById('scurve-canvas').getContext('2d');
    if (App.views.projects.chartInstance) App.views.projects.chartInstance.destroy();
    var labels = (sc.dates||[]).map(function(d){var p=d.split('-');return p[2]+'/'+p[1];});
    var todayIdx = sc.today_index;
    var cs = getComputedStyle(document.documentElement);
    var ink = cs.getPropertyValue('--ink').trim();
    var inkSoft = cs.getPropertyValue('--ink-soft').trim();
    var accent = '#FFFFFF';
    var blue = cs.getPropertyValue('--blue').trim();
    var holidayPlugin = {
      id:'holidayBg',
      beforeDraw:function(chart){
        var c=chart.ctx,ca=chart.chartArea,sx=chart.scales.x;
        if(!ca||!sx) return;
        (sc.dates||[]).forEach(function(d,i){
          if(!(sc.holidays||[]).includes(d)) return;
          var x=sx.getPixelForValue(i);var hw=(ca.right-ca.left)/sc.dates.length/2;
          c.save();c.fillStyle='rgba(255,68,68,0.12)';c.fillRect(x-hw,ca.top,hw*2,ca.bottom-ca.top);c.restore();
        });
        if(todayIdx>=0){var x=sx.getPixelForValue(todayIdx);c.save();c.strokeStyle='#FFD700';c.setLineDash([4,4]);c.lineWidth=1.5;
          c.beginPath();c.moveTo(x,ca.top);c.lineTo(x,ca.bottom);c.stroke();c.fillStyle='#FFD700';c.font='11px monospace';c.fillText('TODAY',x+4,ca.top+12);c.restore();}
      }
    };
    App.views.projects.chartInstance = new Chart(ctx, {
      type:'line',
      data:{labels:labels,datasets:[
        {label:'Planned',data:sc.planned_cumulative,borderColor:blue,backgroundColor:blue+'22',borderWidth:2,pointRadius:0,tension:0.3},
        {label:'Actual',data:sc.actual_cumulative,borderColor:accent,backgroundColor:accent+'22',borderWidth:2,pointRadius:3,pointHoverRadius:5,spanGaps:false}
      ]},
      options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},
        scales:{x:{ticks:{color:inkSoft,maxRotation:0,autoSkip:true}},y:{min:0,max:100,ticks:{color:inkSoft,callback:function(v){return v+'%';}}}},
        plugins:{legend:{labels:{color:ink}},tooltip:{callbacks:{label:function(c){return c.dataset.label+': '+(c.parsed.y===null?'—':c.parsed.y+'%');}}}}},
      plugins:[holidayPlugin]
    });
  },
  renderActivitiesTable: function(projectId, container) {
    var acts = (App.state.currentProject && App.state.currentProject.activities) || [];
    var rows = acts.map(function(a){
      return '<tr><td class="text-mono">' + a.nomor_urut + '</td>' +
        '<td>' + (a.scope_addition?'<span class="badge warning">SCOPE+'+a.scope_addition_round+'</span> ':'')+escapeHtml(a.nama_activity) + '</td>' +
        '<td>' + escapeHtml(a.pic) + '</td>' +
        '<td class="text-mono text-sm">' + escapeHtml(fmtDateLocal(a.tanggal_mulai)) + '</td>' +
        '<td class="text-mono text-sm">' + escapeHtml(fmtDateLocal(a.tanggal_selesai)) + '</td>' +
        '<td class="text-mono text-right">' + a.durasi_hari + '</td>' +
        '<td class="text-mono text-right">' + (a.bobot_pct||0).toFixed(1).replace('.',',') + '%' + (a.bobot_locked?' 🔒':'') + '</td>' +
        '<td><div class="pb-inline"><div class="pb-inline-fill" style="width:'+(a.progress_actual||0)+'%"></div></div> <span class="text-mono text-sm">'+(a.progress_actual||0)+'%</span></td>' +
        '<td class="row-actions"><button class="btn btn-sm btn-ghost" onclick="App.views.projects.openProgressModal(\''+a.activity_id+'\')">+ PROGRESS</button>' +
        '<button class="btn btn-sm btn-ghost" onclick="App.views.projects.openActivityModal(\''+projectId+'\',\''+a.activity_id+'\')">EDIT</button>' +
        '<button class="btn btn-sm btn-ghost" onclick="App.views.projects.deleteActivity(\''+a.activity_id+'\')">✕</button></td></tr>';
    }).join('');
    var totalBobot = acts.reduce(function(s,a){return s+(a.bobot_pct||0);},0);
    container.innerHTML = '<div class="flex justify-between items-center mb-2 mt-3"><h3>ACTIVITIES</h3>' +
      '<div class="flex gap-2"><span class="text-mono text-soft">BOBOT: '+totalBobot.toFixed(1).replace('.',',')+'%</span>' +
      '<button class="btn btn-sm btn-secondary" onclick="App.views.projects.recalcWeights(\''+projectId+'\')">↻ RECALC</button>' +
      '<button class="btn btn-sm" onclick="App.views.projects.openActivityModal(\''+projectId+'\')">+ ACTIVITY</button></div></div>' +
      '<div class="table-wrap"><table class="tbl"><thead><tr><th>NO</th><th>ACTIVITY</th><th>PIC</th><th>MULAI</th><th>SELESAI</th><th class="text-right">DURASI</th><th class="text-right">BOBOT</th><th>PROGRESS</th><th></th></tr></thead>' +
      '<tbody>' + (rows||'<tr><td colspan="9" class="text-soft text-sm" style="text-align:center;padding:24px">Belum ada activity.</td></tr>') + '</tbody></table></div>';
  },
  renderActivitiesTab: function(projectId, tc) { App.views.projects.renderActivitiesTable(projectId, tc); },
  openActivityModal: function(projectId, activityId) {
    var isEdit = !!activityId;
    var act = isEdit ? (App.state.currentProject.activities||[]).find(function(a){return a.activity_id===activityId;}) : null;
    var html = '<div class="form-row"><label>NAMA ACTIVITY *</label><input class="input" id="ac-nama" value="'+escapeHtml(act?act.nama_activity:'')+'" /></div>' +
      '<div class="form-grid"><div class="form-row"><label>PIC *</label><input class="input" id="ac-pic" value="'+escapeHtml(act?act.pic:'')+'" /></div>' +
      '<div class="form-row"><label>TYPE</label><select class="select" id="ac-type">'+['welding','electrical','mechanical','civil','admin','other'].map(function(t){return '<option value="'+t+'" '+(act&&act.activity_type===t?'selected':'')+'>'+t+'</option>';}).join('')+'</select></div></div>' +
      '<div class="form-grid"><div class="form-row"><label>TANGGAL MULAI *</label><input class="input" type="date" id="ac-mulai" value="'+(act?act.tanggal_mulai:'')+'" /></div>' +
      '<div class="form-row"><label>TANGGAL SELESAI *</label><input class="input" type="date" id="ac-selesai" value="'+(act?act.tanggal_selesai:'')+'" /></div></div>' +
      '<div class="form-grid"><div class="form-row"><label>JENIS</label><select class="select" id="ac-jenis"><option value="internal" '+(act&&act.jenis_pengerjaan==='internal'?'selected':'')+'>internal</option><option value="vendor" '+(act&&act.jenis_pengerjaan==='vendor'?'selected':'')+'>vendor</option></select></div>' +
      '<div class="form-row"><label>BOBOT MANUAL (%)</label><input class="input" type="number" step="0.1" id="ac-bobot" value="'+(act&&act.bobot_locked?act.bobot_pct:'')+'" /></div></div>' +
      '<div class="form-row"><label>CATATAN</label><textarea class="textarea" id="ac-catatan">'+escapeHtml(act?act.catatan:'')+'</textarea></div>';
    Modal.open(isEdit?'EDIT ACTIVITY':'TAMBAH ACTIVITY', html,
      '<button class="btn btn-ghost" onclick="Modal.close()">BATAL</button><button class="btn" id="btn-save-act">SIMPAN</button>');
    document.getElementById('btn-save-act').onclick = async function() {
      var bv = document.getElementById('ac-bobot').value;
      var payload = {project_id:projectId, nama_activity:document.getElementById('ac-nama').value.trim(), pic:document.getElementById('ac-pic').value.trim(),
        activity_type:document.getElementById('ac-type').value, tanggal_mulai:document.getElementById('ac-mulai').value,
        tanggal_selesai:document.getElementById('ac-selesai').value, jenis_pengerjaan:document.getElementById('ac-jenis').value, catatan:document.getElementById('ac-catatan').value};
      if(bv){payload.bobot_pct=parseFloat(bv);payload.bobot_locked=true;}
      try{
        if(isEdit) await API.updateActivity(App.token,{activity_id:activityId,...payload});
        else await API.createActivity(App.token,payload);
        Modal.close();toast('Activity tersimpan.','success');await App.views.projects.refresh(projectId);
      }catch(e){toast(e.message,'error');}
    };
  },
  openProgressModal: function(activityId) {
    var act = (App.state.currentProject.activities||[]).find(function(a){return a.activity_id===activityId;});
    var html = '<div class="text-soft text-sm mb-3">'+escapeHtml(act?act.nama_activity:'')+'</div>' +
      '<div class="form-grid"><div class="form-row"><label>TANGGAL *</label><input class="input" type="date" id="pg-tgl" value="'+todayStr()+'" /></div>' +
      '<div class="form-row"><label>PROGRESS % *</label><input class="input" type="number" step="0.1" min="0" max="100" id="pg-pct" value="'+(act?act.progress_actual:0)+'" /></div></div>' +
      '<div class="form-row"><label>CATATAN</label><textarea class="textarea" id="pg-cat"></textarea></div>';
    Modal.open('CATAT PROGRESS', html, '<button class="btn btn-ghost" onclick="Modal.close()">BATAL</button><button class="btn" id="btn-save-pg">SIMPAN</button>');
    document.getElementById('btn-save-pg').onclick = async function() {
      try{await API.addProgress(App.token,{activity_id:activityId,tanggal_progress:document.getElementById('pg-tgl').value,
        progress_pct:parseFloat(document.getElementById('pg-pct').value),catatan:document.getElementById('pg-cat').value});
        Modal.close();toast('Progress dicatat.','success');await App.views.projects.refresh(App.state.currentProject.project.project_id);
      }catch(e){toast(e.message,'error');}
    };
  },
  deleteActivity: function(activityId) {
    Modal.confirm('HAPUS ACTIVITY?','Activity dan data terkait akan dihapus.',async function(){
      try{await API.deleteActivity(App.token,activityId);toast('Dihapus.','success');await App.views.projects.refresh(App.state.currentProject.project.project_id);}catch(e){toast(e.message,'error');}
    });
  },
  async recalcWeights(projectId) {
    try{await API.call('recalculateProjectWeights',App.token,{project_id:projectId});toast('Bobot dihitung ulang.','success');await App.views.projects.refresh(projectId);}catch(e){toast(e.message,'error');}
  },
  async refresh(projectId) {
    var data = await API.getProjectDetail(App.token, projectId);
    App.state.currentProject = data;
    var activeTab = document.querySelector('.tab.active');
    App.views.projects.switchTab(projectId, activeTab?activeTab.dataset.tab:'overview');
  },
  renderHolidaysTab: function(projectId, tc) {
    var holidays = (App.state.currentProject&&App.state.currentProject.holidays)||[];
    var rows = holidays.map(function(h){
      return '<tr><td class="text-mono">'+escapeHtml(fmtDateLocal(h.tanggal))+'</td><td>'+escapeHtml(h.keterangan||'')+'</td>' +
        '<td><button class="btn btn-sm btn-ghost" onclick="App.views.projects.deleteHoliday(\''+h.holiday_id+'\')">✕</button></td></tr>';
    }).join('');
    tc.innerHTML = '<div class="flex justify-between items-center mb-3"><h3>HARI LIBUR ('+holidays.length+')</h3>' +
      '<button class="btn btn-sm" onclick="App.views.projects.openHolidayModal(\''+projectId+'\')">+ TAMBAH</button></div>' +
      '<div class="table-wrap"><table class="tbl"><thead><tr><th>TANGGAL</th><th>KETERANGAN</th><th></th></tr></thead>' +
      '<tbody>'+(rows||'<tr><td colspan="3" class="text-soft" style="text-align:center;padding:24px">Belum ada hari libur.</td></tr>')+'</tbody></table></div>' +
      '<div class="banner info mt-3">Hari libur tidak dihitung sebagai hari kerja dan diwarnai merah saat export Excel.</div>';
  },
  openHolidayModal: function(projectId) {
    var html = '<div class="form-row"><label>TANGGAL *</label><input class="input" type="date" id="hd-tgl" value="'+todayStr()+'" /></div>' +
      '<div class="form-row"><label>KETERANGAN</label><input class="input" id="hd-ket" placeholder="e.g. Libur Idul Fitri" /></div>';
    Modal.open('TAMBAH HARI LIBUR', html, '<button class="btn btn-ghost" onclick="Modal.close()">BATAL</button><button class="btn" id="btn-save-hd">SIMPAN</button>');
    document.getElementById('btn-save-hd').onclick = async function() {
      var tgl=document.getElementById('hd-tgl').value;if(!tgl){toast('Tanggal wajib.','error');return;}
      try{await API.call('addHoliday',App.token,{project_id:projectId,tanggal:tgl,keterangan:document.getElementById('hd-ket').value});
        Modal.close();toast('Ditambahkan.','success');await App.views.projects.refresh(projectId);}catch(e){toast(e.message,'error');}
    };
  },
  deleteHoliday: function(holidayId) {
    Modal.confirm('HAPUS HARI LIBUR?','Bobot akan dihitung ulang.',async function(){
      try{await API.call('deleteHoliday',App.token,{holiday_id:holidayId});toast('Dihapus.','success');
        await App.views.projects.refresh(App.state.currentProject.project.project_id);}catch(e){toast(e.message,'error');}
    });
  },
  renderInfoTab: function(projectId, tc) {
    var p = App.state.currentProject.project;
    tc.innerHTML = '<div class="card mb-3"><div class="eyebrow">IDENTITAS</div><div class="form-grid mt-2">' +
      '<div><strong>Nomor:</strong> '+escapeHtml(p.nomor_proyek)+'</div><div><strong>Pemohon:</strong> '+escapeHtml(p.pemohon||'—')+'</div>' +
      '<div><strong>Lokasi:</strong> '+escapeHtml(p.lokasi||'—')+'</div><div><strong>PIM:</strong> '+escapeHtml(p.pim_number||'—')+'</div></div></div>' +
      '<div class="card mb-3"><div class="eyebrow">KONDISI AWAL</div><p class="mt-2">'+escapeHtml(p.kondisi_awal||'—')+'</p></div>' +
      '<div class="card mb-3"><div class="eyebrow">TARGET</div><p class="mt-2">'+escapeHtml(p.kondisi_akhir_target||'—')+'</p></div>' +
      '<div class="flex gap-2 mt-3"><button class="btn btn-secondary btn-sm" onclick="App.views.projects.editMeta(\''+projectId+'\')">EDIT INFO</button>' +
      '<button class="btn btn-danger btn-sm" onclick="App.views.projects.deleteProject(\''+projectId+'\')">HAPUS</button></div>';
  },
  editMeta: function(projectId) {
    var p = App.state.currentProject.project;
    var html = '<div class="form-row"><label>NAMA</label><input class="input" id="ep-nama" value="'+escapeHtml(p.nama_proyek)+'" /></div>' +
      '<div class="form-grid"><div class="form-row"><label>NOMOR</label><input class="input" id="ep-no" value="'+escapeHtml(p.nomor_proyek)+'" /></div>' +
      '<div class="form-row"><label>STATUS</label><select class="select" id="ep-status">'+['draft','active','on-hold','completed','archived'].map(function(s){return '<option value="'+s+'" '+(p.status===s?'selected':'')+'>'+s+'</option>';}).join('')+'</select></div></div>' +
      '<div class="form-grid"><div class="form-row"><label>PEMOHON</label><input class="input" id="ep-pemohon" value="'+escapeHtml(p.pemohon||'')+'" /></div>' +
      '<div class="form-row"><label>LOKASI</label><input class="input" id="ep-lokasi" value="'+escapeHtml(p.lokasi||'')+'" /></div></div>';
    Modal.open('EDIT PROJECT', html, '<button class="btn btn-ghost" onclick="Modal.close()">BATAL</button><button class="btn" id="btn-save-meta">SIMPAN</button>');
    document.getElementById('btn-save-meta').onclick = async function() {
      try{await API.updateProject(App.token,{project_id:projectId,nama_proyek:document.getElementById('ep-nama').value.trim(),
        nomor_proyek:document.getElementById('ep-no').value.trim(),status:document.getElementById('ep-status').value,
        pemohon:document.getElementById('ep-pemohon').value,lokasi:document.getElementById('ep-lokasi').value});
        Modal.close();toast('Updated.','success');await App.views.projects.refresh(projectId);}catch(e){toast(e.message,'error');}
    };
  },
  deleteProject: function(projectId) {
    Modal.confirm('HAPUS PERMANEN?','Semua data akan dihapus.',async function(){
      try{await API.deleteProject(App.token,projectId);toast('Dihapus.','success');navigate('projects');}catch(e){toast(e.message,'error');}
    });
  },
  async exportExcel(projectId) {
    toast('Mempersiapkan Excel…','info');
    try{var r = await API.exportExcel(App.token,projectId);
      Modal.open('EXCEL READY','<p class="mono">'+escapeHtml(r.file_name)+'</p><p class="mt-3"><a href="'+r.file_url+'" target="_blank" class="btn btn-secondary btn-sm">DRIVE</a> <a href="'+r.download_url+'" class="btn btn-sm">⬇ DOWNLOAD</a></p>',
        '<button class="btn" onclick="Modal.close()">OK</button>');}catch(e){toast(e.message,'error');}
  }
};
