/* views/manpower.js — Manpower with create/edit form */
App.views.manpower = {
  async render() {
    var main = document.getElementById('main-content');
    main.innerHTML = '<div class="page-header"><div><div class="eyebrow">WORKFORCE</div><h1>MANPOWER</h1></div>' +
      '<button class="btn" onclick="App.views.manpower.openModal()">+ TAMBAH ORANG</button></div><div id="mp-list"></div>';
    App.views.manpower.refresh();
  },
  async refresh() {
    var el = document.getElementById('mp-list'); if (!el) return;
    el.innerHTML = '<div class="loading-state">LOADING…</div>';
    var data;
    try { data = await API.getManpower(App.token); } catch(err) { el.innerHTML = '<div class="banner critical">' + escapeHtml(err.message) + '</div>'; return; }
    var rows = (data||[]).map(function(m) {
      return '<tr><td class="mono">' + escapeHtml(m.manpower_id) + '</td>' +
        '<td><strong>' + escapeHtml(m.nama) + '</strong>' + (m.nama_panggilan?' <span class="text-soft text-sm">('+escapeHtml(m.nama_panggilan)+')</span>':'') + '</td>' +
        '<td>' + (m.roles_array||[]).map(function(r){return '<span class="badge medium">'+escapeHtml(r)+'</span>';}).join(' ') + '</td>' +
        '<td><span class="badge '+(m.status==='active'?'active':'archived')+'">'+escapeHtml(m.status)+'</span></td>' +
        '<td class="row-actions"><button class="btn btn-sm btn-ghost" onclick="App.views.manpower.openModal(\''+m.manpower_id+'\')">EDIT</button>' +
        '<button class="btn btn-sm btn-ghost" onclick="App.views.manpower.del(\''+m.manpower_id+'\')">✕</button></td></tr>';
    }).join('');
    el.innerHTML = (data&&data.length) ?
      '<div class="table-wrap"><table class="tbl"><thead><tr><th>ID</th><th>NAMA</th><th>ROLES</th><th>STATUS</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>'
      : '<div class="empty"><div class="empty-icon">⚇</div><div class="empty-title">NO MANPOWER</div><button class="btn" onclick="App.views.manpower.openModal()">+ TAMBAH</button></div>';
  },
  async openModal(manpowerId) {
    var isEdit = !!manpowerId; var mp = null;
    if (isEdit) { try { mp = await API.call('getManpowerDetail', App.token, {manpower_id:manpowerId}); } catch(e){} }
    var html = '<div class="form-grid"><div class="form-row"><label>NAMA LENGKAP *</label><input class="input" id="mp-nama" value="'+escapeHtml(mp?mp.nama:'')+'" /></div>' +
      '<div class="form-row"><label>NAMA PANGGILAN</label><input class="input" id="mp-pgl" value="'+escapeHtml(mp?mp.nama_panggilan:'')+'" /></div></div>' +
      '<div class="form-row"><label>ROLES (pisah koma) *</label>' +'<input class="input" id="mp-roles" value="'+(mp&&mp.roles_array?escapeHtml(mp.roles_array.join(', ')):'')+'" ' +'placeholder="welder, technician, operator…" /></div>' +
      '<div class="form-row"><label>SKILLS (pisah koma)</label><input class="input" id="mp-skills" value="'+(mp&&mp.skills_array?escapeHtml(mp.skills_array.join(', ')):'')+'" placeholder="ASME B31.3, GTAW, ER310…" /></div>' +
      '<div class="form-grid"><div class="form-row"><label>KONTAK</label><input class="input" id="mp-kontak" value="'+escapeHtml(mp?mp.kontak||'':'')+'" /></div>' +
      '<div class="form-row"><label>STATUS</label><select class="select" id="mp-status">'+['active','inactive','archived'].map(function(s){return '<option value="'+s+'" '+(mp&&mp.status===s?'selected':'')+'>'+s+'</option>';}).join('')+'</select></div></div>' +
      '<div class="form-row"><label>CATATAN</label><textarea class="textarea" id="mp-cat">'+escapeHtml(mp?mp.catatan||'':'')+'</textarea></div>';
    Modal.open(isEdit?'EDIT ORANG':'TAMBAH ORANG', html,
      '<button class="btn btn-ghost" onclick="Modal.close()">BATAL</button><button class="btn" id="btn-save-mp">SIMPAN</button>');
    document.getElementById('btn-save-mp').onclick = async function() {
      var roles  = document.getElementById('mp-roles').value.split(',').map(function(s){return s.trim();}).filter(Boolean);
      var skills = document.getElementById('mp-skills').value.split(',').map(function(s){return s.trim();}).filter(Boolean);
      var payload = {nama:..., roles:roles, skills:skills, ...
        skills:skills, kontak:document.getElementById('mp-kontak').value, status:document.getElementById('mp-status').value, catatan:document.getElementById('mp-cat').value};
      if(!payload.nama){toast('Nama wajib.','error');return;}
      try{
        if(isEdit) await API.call('updateManpower',App.token,{manpower_id:manpowerId,...payload});
        else await API.call('createManpower',App.token,payload);
        Modal.close();toast('Tersimpan.','success');App.views.manpower.refresh();
      }catch(e){toast(e.message,'error');}
    };
  },
  del: function(id) {
    Modal.confirm('HAPUS?','Orang dengan assignment akan diset inactive.',async function(){
      try{await API.call('deleteManpower',App.token,{manpower_id:id});toast('Dihapus.','success');App.views.manpower.refresh();}catch(e){toast(e.message,'error');}
    });
  }
};
