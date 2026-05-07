/* views/compose.js — WhatsApp Compose with working generate */
App.views.compose = {
  async render() {
    var main = document.getElementById('main-content');
    main.innerHTML = '<div class="page-header"><div><div class="eyebrow">DAILY COMM WORKFLOW</div><h1>COMPOSE</h1></div></div>' +
      '<div class="banner info mono">WORKFLOW: 1) Generate data → 2) Copy ke Claude.ai → 3) Generate draft WA → 4) Review & kirim.</div>' +
      '<div class="form-grid mb-3 mt-3"><div class="card"><h3>DAILY REPORT</h3><p class="text-soft text-sm mb-3">Ringkasan harian semua project aktif.</p>' +
      '<button class="btn" onclick="App.views.compose.genDaily()">GENERATE DAILY →</button></div>' +
      '<div class="card"><h3>PROJECT REPORT</h3><p class="text-soft text-sm mb-3">Pilih satu project.</p>' +
      '<select class="select mb-2" id="compose-proj"><option value="">— PILIH —</option></select>' +
      '<button class="btn" onclick="App.views.compose.genProject()">GENERATE PROJECT →</button></div></div>' +
      '<div id="compose-output"></div>';
    try {
      var projs = await API.getProjects(App.token);
      var sel = document.getElementById('compose-proj');
      if(sel) sel.innerHTML = '<option value="">— PILIH —</option>' + (projs||[]).map(function(p){return '<option value="'+p.project_id+'">'+escapeHtml(p.nomor_proyek)+' · '+escapeHtml(p.nama_proyek)+'</option>';}).join('');
    }catch(e){}
  },
  async genDaily() {
    toast('Mengumpulkan data…','info');
    try { var r = await API.call('exportDailyReportMarkdown', App.token);
      App.views.compose.showOut('DAILY REPORT', r.content || r.markdown || JSON.stringify(r, null, 2));
    }catch(e){ toast(e.message,'error'); }
  },
  async genProject() {
    var id = document.getElementById('compose-proj').value;
    if(!id){toast('Pilih project.','error');return;}
    toast('Generating…','info');
    try { var r = await API.call('exportProjectMarkdown', App.token, {project_id:id});
      App.views.compose.showOut('PROJECT REPORT', r.content || r.markdown || JSON.stringify(r, null, 2));
    }catch(e){ toast(e.message,'error'); }
  },
  showOut: function(title, content) {
    var out = document.getElementById('compose-output'); if(!out) return;
    out.innerHTML = '<div class="card mt-3"><div class="flex justify-between items-center mb-2"><h3>'+escapeHtml(title)+'</h3></div>' +
      '<textarea class="textarea" id="md-out" style="height:340px;font-family:var(--font-mono);font-size:12px;white-space:pre">'+escapeHtml(content)+'</textarea>' +
      '<div class="flex gap-2 mt-3"><button class="btn" onclick="navigator.clipboard.writeText(document.getElementById(\'md-out\').value);toast(\'Copied!\',\'success\')">📋 COPY</button>' +
      '<a href="https://claude.ai/new" target="_blank" class="btn btn-secondary">→ CLAUDE.AI</a>' +
      '<button class="btn btn-ghost" onclick="document.getElementById(\'compose-output\').innerHTML=\'\'">TUTUP</button></div></div>';
    out.scrollIntoView({behavior:'smooth'});
  }
};
