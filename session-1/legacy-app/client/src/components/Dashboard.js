import { formatNumber, formatDate } from '../utils/formatters';

function renderDashboard(container, data) {
  if (!container || !data) return;

  var summary = data.summary || {};

  var html = '<div class="dashboard">';

  // Summary cards
  html += '<div class="dashboard-cards">';
  html += createCard('Total Tickets', summary.total || 0, 'total');
  html += createCard('Open', summary.open || 0, 'open');
  html += createCard('In Progress', summary.in_progress || 0, 'progress');
  html += createCard('Closed', summary.closed || 0, 'closed');
  html += '</div>';

  // Priority breakdown
  html += '<div class="dashboard-section">';
  html += '<h2>By Priority</h2>';
  html += '<table class="data-table">';
  html += '<thead><tr><th>Priority</th><th>Count</th></tr></thead>';
  html += '<tbody>';
  if (data.byPriority) {
    for (var i = 0; i < data.byPriority.length; i++) {
      var p = data.byPriority[i];
      html += '<tr><td><span class="priority-badge priority-' + p.priority + '">' + p.priority + '</span></td>';
      html += '<td>' + p.count + '</td></tr>';
    }
  }
  html += '</tbody></table></div>';

  // Recent activity
  html += '<div class="dashboard-section">';
  html += '<h2>Recent Activity</h2>';
  html += '<ul class="activity-list">';
  if (data.recentActivity) {
    for (var j = 0; j < Math.min(data.recentActivity.length, 10); j++) {
      var a = data.recentActivity[j];
      html += '<li class="activity-item">';
      html += '<span class="activity-user">' + (a.user_name || 'Unknown') + '</span> ';
      html += '<span class="activity-action">' + a.action + '</span> ';
      html += '<span class="activity-ticket">' + (a.ticket_title || '') + '</span>';
      html += '<span class="activity-date">' + formatDate(a.created_at) + '</span>';
      html += '</li>';
    }
  }
  html += '</ul></div>';

  html += '</div>';
  container.innerHTML = html;
}

function createCard(label, value, type) {
  return '<div class="dashboard-card card-' + type + '">' +
    '<div class="card-value">' + formatNumber(value) + '</div>' +
    '<div class="card-label">' + label + '</div>' +
    '</div>';
}

export { renderDashboard };
