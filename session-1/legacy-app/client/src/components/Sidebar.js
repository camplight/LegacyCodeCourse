import { fetchProjects } from '../utils/api';

function renderSidebar(container) {
  if (!container) return;

  container.innerHTML = `
    <nav class="sidebar">
      <ul class="sidebar-menu">
        <li class="sidebar-item active"><a href="#" data-view="dashboard">Dashboard</a></li>
        <li class="sidebar-item"><a href="#" data-view="tickets">Tickets</a></li>
        <li class="sidebar-item"><a href="#" data-view="projects">Projects</a></li>
        <li class="sidebar-item"><a href="#" data-view="reports">Reports</a></li>
      </ul>
      <div class="sidebar-projects" id="sidebar-projects">
        <h3>Projects</h3>
        <div class="loading-small">Loading...</div>
      </div>
    </nav>
  `;

  // load projects into sidebar
  fetchProjects()
    .then(function(projects) {
      var projectsEl = document.getElementById('sidebar-projects');
      if (!projectsEl) return;
      var html = '<h3>Projects</h3><ul class="project-list">';
      for (var i = 0; i < projects.length; i++) {
        html += '<li class="project-item">';
        html += '<span class="project-name">' + projects[i].name + '</span>';
        html += '<span class="project-count">' + (projects[i].open_tickets || 0) + ' open</span>';
        html += '</li>';
      }
      html += '</ul>';
      projectsEl.innerHTML = html;
    })
    .catch(function(err) {
      console.log('Failed to load projects');
    });
}

export { renderSidebar };
