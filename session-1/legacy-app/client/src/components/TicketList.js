import { fetchTickets } from '../utils/api';
import { formatDate, truncate } from '../utils/formatters';

// global filter state - yeah its global, deal with it
var currentFilters = {
  status: null,
  priority: null,
  project_id: null,
  search: null,
  page: 1,
};

function renderTicketList(container, opts) {
  if (!container) return;

  // merge opts into filters
  if (opts) {
    if (opts.status !== undefined) currentFilters.status = opts.status;
    if (opts.priority !== undefined) currentFilters.priority = opts.priority;
    if (opts.project_id !== undefined) currentFilters.project_id = opts.project_id;
    if (opts.search !== undefined) currentFilters.search = opts.search;
    if (opts.page !== undefined) currentFilters.page = opts.page;
  }

  container.innerHTML = '<div class="loading">Loading tickets...</div>';

  fetchTickets(currentFilters)
    .then(function(response) {
      var tickets = response.items || response.data || response;
      var total = response.total || tickets.length;
      var page = response.page || 1;
      var pageSize = response.pageSize || 20;

      var html = '<div class="ticket-list-view">';

      // filter bar
      html += '<div class="ticket-filters">';
      html += '<h2>Tickets</h2>';
      html += '<div class="filter-controls">';
      html += '<select id="filter-status" class="filter-select">';
      html += '<option value="">All Statuses</option>';
      html += '<option value="open"' + (currentFilters.status === 'open' ? ' selected' : '') + '>Open</option>';
      html += '<option value="in_progress"' + (currentFilters.status === 'in_progress' ? ' selected' : '') + '>In Progress</option>';
      html += '<option value="closed"' + (currentFilters.status === 'closed' ? ' selected' : '') + '>Closed</option>';
      html += '<option value="resolved"' + (currentFilters.status === 'resolved' ? ' selected' : '') + '>Resolved</option>';
      html += '</select>';
      html += '<select id="filter-priority" class="filter-select">';
      html += '<option value="">All Priorities</option>';
      html += '<option value="critical"' + (currentFilters.priority === 'critical' ? ' selected' : '') + '>Critical</option>';
      html += '<option value="high"' + (currentFilters.priority === 'high' ? ' selected' : '') + '>High</option>';
      html += '<option value="medium"' + (currentFilters.priority === 'medium' ? ' selected' : '') + '>Medium</option>';
      html += '<option value="low"' + (currentFilters.priority === 'low' ? ' selected' : '') + '>Low</option>';
      html += '</select>';
      html += '<span class="ticket-count">' + total + ' ticket' + (total !== 1 ? 's' : '') + '</span>';
      html += '</div></div>';

      // ticket table
      html += '<table class="data-table ticket-table">';
      html += '<thead><tr>';
      html += '<th>ID</th><th>Title</th><th>Status</th><th>Priority</th><th>Project</th><th>Assignee</th><th>Created</th>';
      html += '</tr></thead>';
      html += '<tbody>';

      if (tickets.length === 0) {
        html += '<tr><td colspan="7" class="empty-state">No tickets found</td></tr>';
      }

      for (var i = 0; i < tickets.length; i++) {
        var t = tickets[i];
        html += '<tr class="ticket-row" data-ticket-id="' + t.id + '">';
        html += '<td class="ticket-id">#' + t.id + '</td>';
        html += '<td class="ticket-title-cell">' + truncate(t.title, 60) + '</td>';
        html += '<td><span class="status-badge status-' + t.status + '">' + (t.status || '').replace('_', ' ') + '</span></td>';
        html += '<td><span class="priority-badge priority-' + t.priority + '">' + (t.priority || '') + '</span></td>';
        html += '<td>' + (t.project_name || '-') + '</td>';
        html += '<td>' + (t.assignee_name || 'Unassigned') + '</td>';
        html += '<td class="date-cell">' + formatDate(t.created_at) + '</td>';
        html += '</tr>';
      }

      html += '</tbody></table>';

      // pagination
      if (total > pageSize) {
        var totalPages = Math.ceil(total / pageSize);
        html += '<div class="pagination">';
        for (var p = 1; p <= totalPages; p++) {
          html += '<button class="page-btn' + (p === page ? ' active' : '') + '" data-page="' + p + '">' + p + '</button>';
        }
        html += '</div>';
      }

      html += '</div>';
      container.innerHTML = html;

      // attach event listeners - the old fashioned way
      var rows = container.querySelectorAll('.ticket-row');
      for (var j = 0; j < rows.length; j++) {
        rows[j].addEventListener('click', function() {
          var ticketId = this.getAttribute('data-ticket-id');
          // dispatch custom event so app.js can handle navigation
          window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'ticket-detail', id: ticketId } }));
        });
      }

      var statusFilter = document.getElementById('filter-status');
      if (statusFilter) {
        statusFilter.addEventListener('change', function() {
          currentFilters.status = this.value || null;
          currentFilters.page = 1;
          renderTicketList(container);
        });
      }

      var priorityFilter = document.getElementById('filter-priority');
      if (priorityFilter) {
        priorityFilter.addEventListener('change', function() {
          currentFilters.priority = this.value || null;
          currentFilters.page = 1;
          renderTicketList(container);
        });
      }

      var pageButtons = container.querySelectorAll('.page-btn');
      for (var k = 0; k < pageButtons.length; k++) {
        pageButtons[k].addEventListener('click', function(e) {
          e.stopPropagation();
          currentFilters.page = parseInt(this.getAttribute('data-page'));
          renderTicketList(container);
        });
      }
    })
    .catch(function(err) {
      console.log('Error loading tickets', err);
      container.innerHTML = '<div class="error">Failed to load tickets. Is the server running?</div>';
    });
}

function resetFilters() {
  currentFilters = { status: null, priority: null, project_id: null, search: null, page: 1 };
}

export { renderTicketList, resetFilters, currentFilters };
