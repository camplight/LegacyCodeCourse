import { fetchProjects, fetchProject } from '../utils/api';
import { formatDate } from '../utils/formatters';

function renderProjectList(container) {
  if (!container) return;
  container.innerHTML = '<div class="loading">Loading projects...</div>';

  fetchProjects()
    .then(function(projects) {
      var html = '<div class="projects-view">';
      html += '<h2>Projects</h2>';
      html += '<div class="project-cards">';

      for (var i = 0; i < projects.length; i++) {
        var p = projects[i];
        html += '<div class="project-card" data-project-id="' + p.id + '">';
        html += '<div class="project-card-header">';
        html += '<h3>' + p.name + '</h3>';
        html += '<span class="project-status-badge status-' + p.status + '">' + p.status + '</span>';
        html += '</div>';
        if (p.description) {
          html += '<p class="project-desc">' + p.description + '</p>';
        }
        html += '<div class="project-stats">';
        html += '<div class="stat"><span class="stat-num">' + (p.ticket_count || 0) + '</span><span class="stat-label">Total</span></div>';
        html += '<div class="stat"><span class="stat-num">' + (p.open_tickets || 0) + '</span><span class="stat-label">Open</span></div>';
        html += '<div class="stat"><span class="stat-num">' + (p.closed_tickets || 0) + '</span><span class="stat-label">Closed</span></div>';
        html += '</div>';
        html += '<div class="project-meta">';
        html += '<span>Owner: ' + (p.owner_name || 'Unknown') + '</span>';
        html += '</div>';
        html += '</div>';
      }

      html += '</div>';

      // project detail area
      html += '<div id="project-detail-area"></div>';

      html += '</div>';
      container.innerHTML = html;

      // click handlers on project cards
      var cards = container.querySelectorAll('.project-card');
      for (var j = 0; j < cards.length; j++) {
        cards[j].addEventListener('click', function() {
          var id = this.getAttribute('data-project-id');
          // highlight selected
          var all = container.querySelectorAll('.project-card');
          for (var x = 0; x < all.length; x++) all[x].classList.remove('selected');
          this.classList.add('selected');
          loadProjectDetail(id);
        });
      }
    })
    .catch(function(err) {
      console.log('Failed to load projects', err);
      container.innerHTML = '<div class="error">Failed to load projects.</div>';
    });
}

function loadProjectDetail(id) {
  var detailArea = document.getElementById('project-detail-area');
  if (!detailArea) return;
  detailArea.innerHTML = '<div class="loading-small">Loading project details...</div>';

  fetchProject(id)
    .then(function(project) {
      var html = '<div class="project-detail-panel">';
      html += '<h3>' + project.name + '</h3>';

      if (project.recent_tickets && project.recent_tickets.length > 0) {
        html += '<h4>Recent Tickets</h4>';
        html += '<table class="data-table">';
        html += '<thead><tr><th>ID</th><th>Title</th><th>Status</th><th>Priority</th></tr></thead>';
        html += '<tbody>';
        for (var i = 0; i < project.recent_tickets.length; i++) {
          var t = project.recent_tickets[i];
          html += '<tr class="ticket-row" data-ticket-id="' + t.id + '">';
          html += '<td>#' + t.id + '</td>';
          html += '<td>' + t.title + '</td>';
          html += '<td><span class="status-badge status-' + t.status + '">' + (t.status || '').replace('_', ' ') + '</span></td>';
          html += '<td><span class="priority-badge priority-' + t.priority + '">' + (t.priority || '') + '</span></td>';
          html += '</tr>';
        }
        html += '</tbody></table>';
      } else {
        html += '<p class="empty-state">No tickets in this project.</p>';
      }

      html += '</div>';
      detailArea.innerHTML = html;

      // ticket click handlers
      var rows = detailArea.querySelectorAll('.ticket-row');
      for (var j = 0; j < rows.length; j++) {
        rows[j].addEventListener('click', function() {
          var ticketId = this.getAttribute('data-ticket-id');
          window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'ticket-detail', id: ticketId } }));
        });
      }
    })
    .catch(function() {
      detailArea.innerHTML = '<div class="error">Failed to load project.</div>';
    });
}

export { renderProjectList };
