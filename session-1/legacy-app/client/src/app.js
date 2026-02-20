import { renderHeader } from './components/Header';
import { renderSidebar } from './components/Sidebar';
import { renderDashboard } from './components/Dashboard';
import { fetchDashboard } from './utils/api';

var currentView = 'dashboard';

function initApp() {
  var appEl = document.getElementById('app');
  if (!appEl) return;

  appEl.innerHTML = `
    <div class="app-layout">
      <div id="header-container"></div>
      <div class="app-body">
        <div id="sidebar-container"></div>
        <div id="main-content" class="main-content"></div>
      </div>
    </div>
  `;

  renderHeader(document.getElementById('header-container'));
  renderSidebar(document.getElementById('sidebar-container'));
  loadDashboard();
}

function loadDashboard() {
  var mainContent = document.getElementById('main-content');
  mainContent.innerHTML = '<div class="loading">Loading dashboard...</div>';

  fetchDashboard()
    .then(function(data) {
      renderDashboard(mainContent, data);
    })
    .catch(function(err) {
      console.log('Failed to load dashboard:', err);
      mainContent.innerHTML = '<div class="error">Failed to load dashboard. Is the server running?</div>';
    });
}

export { initApp, loadDashboard };
