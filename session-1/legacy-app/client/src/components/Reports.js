import { fetchOverdueReport, fetchUserProductivity, fetchProjectHealth } from '../utils/api';
import { formatDate } from '../utils/formatters';

var currentReport = 'overdue'; // default

function renderReports(container) {
  if (!container) return;

  var html = '<div class="reports-view">';
  html += '<h2>Reports</h2>';
  html += '<div class="report-tabs">';
  html += '<button class="report-tab' + (currentReport === 'overdue' ? ' active' : '') + '" data-report="overdue">Overdue Tickets</button>';
  html += '<button class="report-tab' + (currentReport === 'productivity' ? ' active' : '') + '" data-report="productivity">User Productivity</button>';
  html += '<button class="report-tab' + (currentReport === 'health' ? ' active' : '') + '" data-report="health">Project Health</button>';
  html += '</div>';
  html += '<div id="report-content"><div class="loading">Loading report...</div></div>';
  html += '</div>';

  container.innerHTML = html;

  // tab click handlers
  var tabs = container.querySelectorAll('.report-tab');
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].addEventListener('click', function() {
      currentReport = this.getAttribute('data-report');
      // update active state
      var allTabs = container.querySelectorAll('.report-tab');
      for (var j = 0; j < allTabs.length; j++) allTabs[j].classList.remove('active');
      this.classList.add('active');
      loadReport(currentReport);
    });
  }

  loadReport(currentReport);
}

function loadReport(type) {
  var content = document.getElementById('report-content');
  if (!content) return;
  content.innerHTML = '<div class="loading">Loading report...</div>';

  if (type === 'overdue') {
    fetchOverdueReport()
      .then(function(data) {
        var html = '<div class="report-panel">';
        html += '<h3>Overdue Tickets <span class="badge">' + data.count + '</span></h3>';
        html += '<p class="text-muted">Tickets open for more than ' + data.cutoff_days + ' days</p>';

        if (data.tickets && data.tickets.length > 0) {
          html += '<table class="data-table">';
          html += '<thead><tr><th>ID</th><th>Title</th><th>Priority</th><th>Assignee</th><th>Days Overdue</th><th>Created</th></tr></thead>';
          html += '<tbody>';
          for (var i = 0; i < data.tickets.length; i++) {
            var t = data.tickets[i];
            html += '<tr class="ticket-row" data-ticket-id="' + t.id + '">';
            html += '<td>#' + t.id + '</td>';
            html += '<td>' + t.title + '</td>';
            html += '<td><span class="priority-badge priority-' + t.priority + '">' + t.priority + '</span></td>';
            html += '<td>' + (t.assignee_name || 'Unassigned') + '</td>';
            html += '<td class="overdue-days">' + t.days_overdue + ' days</td>';
            html += '<td>' + (t.created_at_formatted || formatDate(t.created_at)) + '</td>';
            html += '</tr>';
          }
          html += '</tbody></table>';
        } else {
          html += '<p class="empty-state">No overdue tickets!</p>';
        }
        html += '</div>';
        content.innerHTML = html;
        attachTicketLinks(content);
      })
      .catch(function() { content.innerHTML = '<div class="error">Failed to load overdue report.</div>'; });
  } else if (type === 'productivity') {
    fetchUserProductivity()
      .then(function(users) {
        var html = '<div class="report-panel">';
        html += '<h3>User Productivity</h3>';
        html += '<table class="data-table">';
        html += '<thead><tr><th>User</th><th>Closed</th><th>Open</th><th>In Progress</th><th>Comments</th></tr></thead>';
        html += '<tbody>';
        for (var i = 0; i < users.length; i++) {
          var u = users[i];
          html += '<tr>';
          html += '<td><strong>' + u.display_name + '</strong></td>';
          html += '<td class="num-cell">' + u.tickets_closed + '</td>';
          html += '<td class="num-cell">' + u.tickets_open + '</td>';
          html += '<td class="num-cell">' + u.tickets_in_progress + '</td>';
          html += '<td class="num-cell">' + u.comments_made + '</td>';
          html += '</tr>';
        }
        html += '</tbody></table>';
        html += '</div>';
        content.innerHTML = html;
      })
      .catch(function() { content.innerHTML = '<div class="error">Failed to load productivity report.</div>'; });
  } else if (type === 'health') {
    fetchProjectHealth()
      .then(function(projects) {
        var html = '<div class="report-panel">';
        html += '<h3>Project Health</h3>';
        html += '<div class="health-cards">';
        for (var i = 0; i < projects.length; i++) {
          var p = projects[i];
          var healthClass = p.health_score >= 70 ? 'good' : (p.health_score >= 40 ? 'warning' : 'bad');
          html += '<div class="health-card">';
          html += '<div class="health-header">';
          html += '<h4>' + p.project + '</h4>';
          html += '<div class="health-score health-' + healthClass + '">' + p.health_score + '%</div>';
          html += '</div>';
          html += '<div class="health-stats">';
          html += '<span>Total: ' + p.stats.total + '</span>';
          html += '<span>Open: ' + p.stats.open + '</span>';
          html += '<span>Closed: ' + p.stats.closed + '</span>';
          html += '<span>Critical/High: ' + p.stats.critical + '</span>';
          html += '</div>';
          html += '</div>';
        }
        html += '</div></div>';
        content.innerHTML = html;
      })
      .catch(function() { content.innerHTML = '<div class="error">Failed to load health report.</div>'; });
  }
}

function attachTicketLinks(container) {
  var rows = container.querySelectorAll('.ticket-row');
  for (var i = 0; i < rows.length; i++) {
    rows[i].addEventListener('click', function() {
      var ticketId = this.getAttribute('data-ticket-id');
      window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'ticket-detail', id: ticketId } }));
    });
  }
}

export { renderReports };
