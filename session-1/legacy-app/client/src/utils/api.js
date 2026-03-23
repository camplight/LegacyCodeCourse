var API_URL = process.env.API_URL || '/api';

function fetchDashboard() {
  return fetch(API_URL + '/reports/dashboard')
    .then(function(res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
}

function fetchTickets(params) {
  var query = '';
  if (params) {
    var parts = [];
    for (var key in params) {
      if (params[key] !== undefined && params[key] !== null) {
        parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
      }
    }
    if (parts.length) query = '?' + parts.join('&');
  }

  return fetch(API_URL + '/tickets' + query)
    .then(function(res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
}

function fetchTicket(id) {
  return fetch(API_URL + '/tickets/' + id)
    .then(function(res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
}

function fetchProjects() {
  return fetch(API_URL + '/projects')
    .then(function(res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
}

function fetchProject(id) {
  return fetch(API_URL + '/projects/' + id)
    .then(function(res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
}

function createTicket(data) {
  return fetch(API_URL + '/tickets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(function(res) {
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  });
}

function updateTicket(id, data) {
  return fetch(API_URL + '/tickets/' + id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(function(res) {
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  });
}

function fetchUsers() {
  return fetch(API_URL + '/users')
    .then(function(res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
}

function fetchOverdueReport() {
  return fetch(API_URL + '/reports/overdue')
    .then(function(res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
}

function fetchUserProductivity() {
  return fetch(API_URL + '/reports/user-productivity')
    .then(function(res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
}

function fetchProjectHealth() {
  return fetch(API_URL + '/reports/project-health')
    .then(function(res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
}

function addComment(ticketId, userId, body) {
  return fetch(API_URL + '/tickets/' + ticketId + '/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, body: body }),
  }).then(function(res) {
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  });
}

export { fetchDashboard, fetchTickets, fetchTicket, fetchProjects, fetchProject, createTicket, updateTicket, fetchUsers, fetchOverdueReport, fetchUserProductivity, fetchProjectHealth, addComment };
