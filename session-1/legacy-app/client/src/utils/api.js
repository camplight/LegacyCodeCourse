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

export { fetchDashboard, fetchTickets, fetchTicket, fetchProjects, createTicket };
