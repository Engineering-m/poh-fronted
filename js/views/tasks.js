/* views/tasks.js — Tasks with create/edit form + Requests with form */
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
    var projMap = {};
    try { var projs = await API.getProjects(App.token); (projs||[]).forEach(function(p){projMap[p.project_id]=p.nama_proyek;}); } catch(e){}
    var rows = todos.map(function(t) {
      var isOverdue = t.due_date && t.due_date < todayStr() && t.status !== 'done';
      return '<tr '+(isOverdue?'style="background:var(--red-soft)"':'')+'>' +
        '<td><input type="checkbox" '+(t.status==='done'?'checked':'')+' onchange="App.views.tasks.toggle(\''+t.todo_id+'\',this.checked)" /></td>' +
        '<td><span class="badge '+escapeHtml(t.prioritas)+'">'+escapeHtml(t.prioritas)+'</span></td>' +
        '<td><strong>'+escapeHtml(t.deskripsi)+'</strong>'+(t.catatan?'<br><span class="text-soft text-sm">'+escapeHtml(t.catatan)+'</span>':'')+'</td>' +
        '<td>'+escapeHtml(t.pemberi_tugas)+'</td>' +
        '<td>'+(t.project_id?escapeHtml(projMap[t.project_id]||t.project_id):'<span class="text-soft">—</span>')+'</td>' +
        '<td><span class="badge '+(t.status==='done'?'completed':'draft')+'">'+escapeHtml(t.status)+'</span></td>' +
        '<td class="text-mono">'+escapeHtml(fmtDateLocal(t.due_date)||'—')+'</td>' +
        '<td class="row-actions"><button class="btn btn-sm btn-ghost" onclick="App.views.tasks.openModal(\''+t.todo_id+'\')">EDIT</button>' +
        '<button class="btn btn-sm btn-ghost" onclick="App.views.tasks.del(\''+t.todo_id+'\')">✕</button></td></tr>';
    }).join('');
    el.innerHTML = todos.length ?
      '<div class="table-wrap"><table class="tbl"><thead><tr><th></th><th>PRIO</th><th>DESKRIPSI</th><th>PEMBERI</th><th>PROJECT</th><th>STATUS</th><th>DUE</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div>'
      : '<div class="empty"><div class="empty-icon">✓</div><div class="empty-title">NO TASKS</div><button class="btn" onclick="App.views.tasks.openModal()">+ TAMBAH</button></div>';
  },
  async toggle(todoId, isDone) {
    try{await API.call('updateTodo',App.token,{todo_id:todoId,status:isDone?'done':'todo'});toast(isDone?'✓ Done!':'Reset.','success');App.views.tasks.refresh();}catch(e){toast(e.message,'error');}
  },
  async openModal(todoId) {
    var isEdit = !!todoId; var t = null; var projects = [];
    try{
      if(isEdit){var list = await API.getTodos(App.token); t=(list||[]).find(function(x){return x.todo_id===todoId;});}
      projects = await API.getProjects(App.token)||[];
    }catch(e){}
    var html = '<div class="form-row"><label>DESKRIPSI *</label><textarea class="textarea" id="td-desc">'+escapeHtml(t?t.deskripsi:'')+'</textarea></div>' +
      '<div class="form-grid"><div class="form-row"><label>PEMBERI TUGAS *</label><input class="input" id="td-from" value="'+escapeHtml(t?t.pemberi_tugas:((App.user&&App.user.display_name)||''))+'" /></div>' +
      '<div class="form-row"><label>PRIORITAS</label><select class="select" id="td-prio">'+['low','medium','high','urgent'].map(function(p){return '<option value="'+p+'" '+((t?t.prioritas:'medium')===p?'selected':'')+'>'+p+'</option>';}).join('')+'</select></div></div>' +
      '<div class="form-grid"><div class="form-row"><label>PROJECT (opsional)</label><select class="select" id="td-proj"><option value="">— LOOSE —</option>'+projects.map(function(p){return '<option value="'+p.project_id+'" '+((t&&t.project_id)===p.project_id?'selected':'')+'>'+escapeHtml(p.nomor_proyek)+'</option>';}).join('')+'</select></div>' +
      '<div class="form-row"><label>DUE DATE</label><input class="input" type="date" id="td-due" value="'+(t?t.due_date||'':'')+'" /></div></div>' +
      '<div class="form-grid"><div class="form-row"><label>STATUS</label><select class="select" id="td-st">'+['todo','in-progress','done','cancelled'].map(function(s){return '<option value="'+s+'" '+((t?t.status:'todo')===s?'selected':'')+'>'+s+'</option>';}).join('')+'</select></div>' +
      '<div class="form-row"><label>CATATAN</label><input class="input" id="td-cat" value="'+escapeHtml(t?t.catatan||'':'')+'" /></div></div>';
    Modal.open(isEdit?'EDIT TODO':'TAMBAH TODO', html,
      '<button class="btn btn-ghost" onclick="Modal.close()">BATAL</button><button class="btn" id="btn-save-td">SIMPAN</button>');
    document.getElementById('btn-save-td').onclick = async function() {
      var payload = {deskripsi:document.getElementById('td-desc').value.trim(),pemberi_tugas:document.getElementById('td-from').value.trim(),
        prioritas:document.getElementById('td-prio').value,project_id:document.getElementById('td-proj').value,
        due_date:document.getElementById('td-due').value,status:document.getElementById('td-st').value,catatan:document.getElementById('td-cat').value};
      if(!payload.deskripsi||!payload.pemberi_tugas){toast('Deskripsi & pemberi wajib.','error');return;}
      try{
        if(isEdit) await API.call('updateTodo',App.token,{todo_id:todoId,...payload});
        else await API.call('createTodo',App.token,payload);
        Modal.close();toast('Tersimpan.','success');App.views.tasks.refresh();
      }catch(e){toast(e.message,'error');}
    };
  },
  del: function(todoId) {
    Modal.confirm('HAPUS TODO?','Tidak bisa di-undo.',async function(){
      try{await API.call('deleteTodo',App.token,{todo_id:todoId});toast('Dihapus.','success');App.views.tasks.refresh();}catch(e){toast(e.message,'error');}
    });
  }
};

/* Requests with create/edit form */
App.views.requests = {
  async render() {
    var main = document.getElementById('main-content');
    main.innerHTML = '<div class="page-header"><div><div class="eyebrow">PRE-PROJECT PIPELINE</div><h1>REQUESTS</h1></div>' +
      '<button class="btn" onclick="App.views.requests.openModal()">+ TAMBAH REQUEST</button></div><div id="req-list"></div>';
    App.views.requests.refresh();
  },
  async refresh() {
    var el = document.getElementById('req-list'); if(!el) return;
    var reqs; try{reqs = await API.getRequests(App.token)||[];}catch(e){reqs=[];}
    if(!reqs.length){el.innerHTML='<div class="empty"><div class="empty-icon">✎</div><div class="empty-title">NO REQUESTS</div><button class="btn" onclick="App.views.requests.openModal()">+ TAMBAH</button></div>';return;}
    var cards = reqs.map(function(r){
      return '<div class="card mb-3"><div class="flex justify-between items-center mb-2"><div><span class="badge '+escapeHtml(r.prioritas)+'">'+escapeHtml(r.prioritas)+'</span> <span class="badge">'+escapeHtml(r.status)+'</span></div>' +
        '<span class="text-mono text-soft">'+escapeHtml(r.tanggal_request||'')+'</span></div>' +
        '<h3 style="margin-bottom:6px">'+escapeHtml(r.deskripsi)+'</h3><div class="text-sm">PEMOHON: '+escapeHtml(r.pemohon)+'</div>' +
        '<div class="flex gap-2 mt-3"><button class="btn btn-sm btn-ghost" onclick="App.views.requests.openModal(\''+r.request_id+'\')">EDIT</button>' +
        (r.status!=='converted'?'<button class="btn btn-sm" onclick="App.views.requests.convert(\''+r.request_id+'\')">→ CONVERT</button>':'')+
        '<button class="btn btn-sm btn-ghost" onclick="App.views.requests.del(\''+r.request_id+'\')">✕</button></div></div>';
    }).join('');
    el.innerHTML = cards;
  },
  async openModal(requestId) {
    var isEdit = !!requestId; var r = null;
    if(isEdit){try{r = await API.call('getRequest',App.token,{request_id:requestId});}catch(e){}}
    var html = '<div class="form-grid"><div class="form-row"><label>PEMOHON *</label><input class="input" id="rq-pemohon" value="'+escapeHtml(r?r.pemohon:'')+'" /></div>' +
      '<div class="form-row"><label>TANGGAL</label><input class="input" type="date" id="rq-tgl" value="'+(r?r.tanggal_request||'':todayStr())+'" /></div></div>' +
      '<div class="form-row"><label>DESKRIPSI *</label><input class="input" id="rq-desc" value="'+escapeHtml(r?r.deskripsi:'')+'" /></div>' +
      '<div class="form-row"><label>KONDISI AWAL</label><textarea class="textarea" id="rq-awal">'+escapeHtml(r?r.kondisi_awal||'':'')+'</textarea></div>' +
      '<div class="form-row"><label>TARGET</label><textarea class="textarea" id="rq-akhir">'+escapeHtml(r?r.kondisi_akhir_diinginkan||'':'')+'</textarea></div>' +
      '<div class="form-grid"><div class="form-row"><label>LOKASI</label><input class="input" id="rq-lok" value="'+escapeHtml(r?r.area_lokasi||'':'')+'" /></div>' +
      '<div class="form-row"><label>PRIORITAS</label><select class="select" id="rq-prio">'+['low','medium','high','urgent'].map(function(p){return '<option value="'+p+'" '+((r?r.prioritas:'medium')===p?'selected':'')+'>'+p+'</option>';}).join('')+'</select></div></div>';
    Modal.open(isEdit?'EDIT REQUEST':'TAMBAH REQUEST', html,
      '<button class="btn btn-ghost" onclick="Modal.close()">BATAL</button><button class="btn" id="btn-save-rq">SIMPAN</button>');
    document.getElementById('btn-save-rq').onclick = async function() {
      var payload = {pemohon:document.getElementById('rq-pemohon').value.trim(),tanggal_request:document.getElementById('rq-tgl').value,
        deskripsi:document.getElementById('rq-desc').value.trim(),kondisi_awal:document.getElementById('rq-awal').value,
        kondisi_akhir_diinginkan:document.getElementById('rq-akhir').value,area_lokasi:document.getElementById('rq-lok').value,
        prioritas:document.getElementById('rq-prio').value,status:r?r.status:'pending'};
      try{
        if(isEdit) await API.call('updateRequest',App.token,{request_id:requestId,...payload});
        else await API.call('createRequest',App.token,payload);
        Modal.close();toast('Tersimpan.','success');App.views.requests.refresh();
      }catch(e){toast(e.message,'error');}
    };
  },
  convert: function(requestId) {
    var html = '<div class="form-row"><label>NOMOR PROYEK *</label><input class="input" id="cv-no" /></div>' +
      '<div class="form-grid"><div class="form-row"><label>MULAI</label><input class="input" type="date" id="cv-mulai" /></div>' +
      '<div class="form-row"><label>SELESAI</label><input class="input" type="date" id="cv-selesai" /></div></div>';
    Modal.open('CONVERT KE PROJECT', html, '<button class="btn btn-ghost" onclick="Modal.close()">BATAL</button><button class="btn" id="btn-cv">CONVERT →</button>');
    document.getElementById('btn-cv').onclick = async function() {
      var no = document.getElementById('cv-no').value.trim(); if(!no){toast('Nomor wajib.','error');return;}
      try{var r = await API.call('convertRequestToProject',App.token,{request_id:requestId,nomor_proyek:no,
        tanggal_mulai:document.getElementById('cv-mulai').value,tanggal_selesai:document.getElementById('cv-selesai').value});
        Modal.close();toast('Converted!','success');navigate('projects',{id:r.project_id});}catch(e){toast(e.message,'error');}
    };
  },
  del: function(id) {
    Modal.confirm('HAPUS?','',async function(){try{await API.call('deleteRequest',App.token,{request_id:id});toast('Dihapus.','success');App.views.requests.refresh();}catch(e){toast(e.message,'error');}});
  }
};
