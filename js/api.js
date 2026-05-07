// js/api.js — GAS CORS-safe via JSONP

var API = {

  async call(action, token, payload) {
    if (token === undefined) token = null;
    if (payload === undefined) payload = {};
    try {
      var params = new URLSearchParams();
      params.append('action', action);
      if (token) params.append('token', token);
      if (payload && typeof payload === 'object' && Object.keys(payload).length > 0) {
        params.append('payload', JSON.stringify(payload));
      }
      var url = CONFIG.API_URL + '?' + params.toString();
      var json = await API._jsonp(url);

      if (json.ok === false) {
        if (json.code === 'EXPIRED' || json.code === 'INVALID_SESSION' || json.code === 'NO_TOKEN') {
          if (window.onSessionExpired) window.onSessionExpired();
        }
        throw new Error(json.error || json.message || 'API error');
      }
      if (json.status === 'error') throw new Error(json.message || 'Unknown error');
      return json.data !== undefined ? json.data : json;
    } catch (err) {
      console.error('[API] ' + action + ' failed:', err);
      throw err;
    }
  },

  _jsonp(url) {
    return new Promise(function(resolve, reject) {
      var cb = '_pohcb_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
      var timeout = setTimeout(function() {
        delete window[cb];
        if (script.parentNode) script.parentNode.removeChild(script);
        reject(new Error('Request timeout'));
      }, 30000);

      window[cb] = function(data) {
        clearTimeout(timeout);
        delete window[cb];
        if (script.parentNode) script.parentNode.removeChild(script);
        resolve(data);
      };

      var script = document.createElement('script');
      script.src = url + '&callback=' + cb;
      script.onerror = function() {
        clearTimeout(timeout);
        delete window[cb];
        if (script.parentNode) script.parentNode.removeChild(script);
        reject(new Error('Network error'));
      };
      document.head.appendChild(script);
    });
  },

  async login(u, p) { return API.call('login', null, { username: u, password: p }); },
  logout(t) { return API.call('logout', t); },
  async getProjects(t) { return API.call('getProjects', t); },
  async getProjectDetail(t, id) { return API.call('getProjectDetail', t, { project_id: id }); },
  async createProject(t, d) { return API.call('createProject', t, d); },
  async updateProject(t, d) { return API.call('updateProject', t, d); },
  async deleteProject(t, id) { return API.call('deleteProject', t, { project_id: id }); },
  async getSCurve(t, id) { return API.call('getSCurveData', t, { project_id: id }); },
  async getActivities(t, id) { return API.call('getActivities', t, { project_id: id }); },
  async createActivity(t, d) { return API.call('createActivity', t, d); },
  async updateActivity(t, d) { return API.call('updateActivity', t, d); },
  async deleteActivity(t, id) { return API.call('deleteActivity', t, { activity_id: id }); },
  async addProgress(t, d) { return API.call('addProgress', t, d); },
  async getDashboard(t) { return API.call('getDashboardData', t); },
  async getManpower(t) { return API.call('getManpower', t); },
  async createAssignment(t, d) { return API.call('createAssignment', t, d); },
  async getAssignments(t, id) { return API.call('getAssignments', t, id ? { project_id: id } : {}); },
  async getRequests(t) { return API.call('getRequests', t); },
  async getTodos(t) { return API.call('getTodos', t); },
  async exportExcel(t, id) { return API.call('exportProjectToExcel', t, { project_id: id }); }
};
