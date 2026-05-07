/* views/settings.js — Settings */
App.views.settings = {
  async render() {
    var main = document.getElementById('main-content');
    var user = App.user || {};
    main.innerHTML = '<div class="page-header"><div><div class="eyebrow">CONFIGURATION</div><h1>SETTINGS</h1></div></div>' +
      '<div class="card mb-3"><h3>AKUN</h3><p class="text-soft text-sm mb-2">Logged in: <strong>' + escapeHtml(user.display_name||'') + '</strong> (' + escapeHtml(user.username||'') + ')</p>' +
      '<button class="btn btn-secondary btn-sm" onclick="App.views.settings.changePw()">GANTI PASSWORD</button></div>' +
      '<div class="card mb-3"><h3>INTEGRATION: DATA MESIN APP</h3><div class="form-row"><label>SPREADSHEET ID</label><input class="input" id="cfg-mesin" /></div>' +
      '<button class="btn btn-sm" onclick="App.views.settings.saveCfg(\'data_mesin_ss_id\',document.getElementById(\'cfg-mesin\').value)">SIMPAN</button></div>' +
      '<div class="card mb-3"><h3>BACKUP</h3><p class="text-soft text-sm mb-2">Snapshot ke POH_Backups di Drive.</p>' +
      '<button class="btn btn-sm" onclick="App.views.settings.backup()">BACKUP SEKARANG</button></div>' +
      '<div class="card mb-3"><h3>TENTANG</h3><p class="text-mono text-sm">ENGINEERING SYSTEM V' + CONFIG.APP_VERSION + '</p>' +
      '<p class="text-soft text-sm">GitHub Pages + Google Apps Script + Google Sheets</p></div>';
  },
  changePw: function() {
    Modal.open('GANTI PASSWORD',
      '<div class="form-row"><label>PASSWORD LAMA</label><input class="input" type="password" id="pw-old" /></div>' +
      '<div class="form-row"><label>PASSWORD BARU</label><input class="input" type="password" id="pw-new" /></div>' +
      '<div class="form-row"><label>KONFIRMASI</label><input class="input" type="password" id="pw-confirm" /></div>',
      '<button class="btn btn-ghost" onclick="Modal.close()">BATAL</button><button class="btn" id="btn-pw">SIMPAN</button>');
    document.getElementById('btn-pw').onclick = async function() {
      var o=document.getElementById('pw-old').value, n=document.getElementById('pw-new').value, c=document.getElementById('pw-confirm').value;
      if (!o||!n) { toast('Field wajib.','error'); return; }
      if (n!==c) { toast('Konfirmasi tidak cocok.','error'); return; }
      try { await API.call('changePassword',App.token,{old_password:o,new_password:n}); Modal.close(); toast('Password diubah.','success'); }
      catch(e) { toast(e.message,'error'); }
    };
  },
  saveCfg: async function(k,v) {
    try { await API.call('setIntegrationConfig',App.token,{key:k,value:v}); toast('Disimpan.','success'); }
    catch(e) { toast(e.message,'error'); }
  },
  backup: async function() {
    toast('Backup berjalan…','info');
    try { var r = await API.call('dailyBackup',App.token); toast('Backup OK: '+r.name,'success'); }
    catch(e) { toast(e.message,'error'); }
  }
};
