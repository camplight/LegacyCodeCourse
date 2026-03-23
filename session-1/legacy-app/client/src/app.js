import { renderHeader } from './components/Header';
import { renderSidebar } from './components/Sidebar';
import { renderDashboard } from './components/Dashboard';
import { renderTicketList, resetFilters, currentFilters } from './components/TicketList';
import { renderTicketDetail } from './components/TicketDetail';
import { renderProjectList } from './components/ProjectList';
import { renderReports } from './components/Reports';
import { showNewTicketModal } from './components/NewTicketForm';
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
  loadView('dashboard');

  // setup navigation
  setupNavigation();
  setupSearch();
  setupNewTicketButton();
}

function setupNavigation() {
  // sidebar nav clicks - use event delegation
  document.addEventListener('click', function(e) {
    var link = e.target.closest('.sidebar-item a');
    if (link) {
      e.preventDefault();
      var view = link.getAttribute('data-view');
      if (view) {
        // update active class
        var items = document.querySelectorAll('.sidebar-item');
        for (var i = 0; i < items.length; i++) items[i].classList.remove('active');
        link.parentElement.classList.add('active');

        loadView(view);
      }
    }

    // sidebar project clicks
    var projectItem = e.target.closest('.sidebar-projects .project-item');
    if (projectItem) {
      loadView('projects');
    }
  });

  // listen for custom navigate events from components
  window.addEventListener('navigate', function(e) {
    var detail = e.detail;
    if (detail.view === 'ticket-detail' && detail.id) {
      loadView('ticket-detail', { id: detail.id });
    } else if (detail.view) {
      loadView(detail.view, detail);
    }
  });
}

function setupSearch() {
  // debounce search with a timer - classic legacy pattern
  var searchTimer = null;

  document.addEventListener('input', function(e) {
    if (e.target.classList.contains('search-input')) {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function() {
        var query = e.target.value.trim();
        if (query.length >= 2) {
          resetFilters();
          currentFilters.search = query;
          loadView('tickets');
          // update sidebar active state
          var items = document.querySelectorAll('.sidebar-item');
          for (var i = 0; i < items.length; i++) {
            var a = items[i].querySelector('a');
            if (a && a.getAttribute('data-view') === 'tickets') {
              items[i].classList.add('active');
            } else {
              items[i].classList.remove('active');
            }
          }
        } else if (query.length === 0) {
          // cleared search, go back to dashboard
          resetFilters();
          loadView('dashboard');
        }
      }, 400);
    }
  });

  // handle enter key in search
  document.addEventListener('keydown', function(e) {
    if (e.target.classList.contains('search-input') && e.key === 'Enter') {
      clearTimeout(searchTimer);
      var query = e.target.value.trim();
      if (query.length > 0) {
        resetFilters();
        currentFilters.search = query;
        loadView('tickets');
      }
    }
  });
}

function setupNewTicketButton() {
  document.addEventListener('click', function(e) {
    if (e.target.id === 'new-ticket-btn' || e.target.closest('#new-ticket-btn')) {
      showNewTicketModal();
    }
  });
}

function loadView(view, opts) {
  currentView = view;
  var mainContent = document.getElementById('main-content');
  if (!mainContent) return;

  switch(view) {
    case 'dashboard':
      mainContent.innerHTML = '<div class="loading">Loading dashboard...</div>';
      fetchDashboard()
        .then(function(data) {
          renderDashboard(mainContent, data);
        })
        .catch(function(err) {
          console.log('Failed to load dashboard:', err);
          mainContent.innerHTML = '<div class="error">Failed to load dashboard. Is the server running?</div>';
        });
      break;

    case 'tickets':
      resetFilters();
      if (opts && opts.search) currentFilters.search = opts.search;
      renderTicketList(mainContent, opts);
      break;

    case 'ticket-detail':
      if (opts && opts.id) {
        renderTicketDetail(mainContent, opts.id);
      } else {
        mainContent.innerHTML = '<div class="error">No ticket ID specified.</div>';
      }
      break;

    case 'projects':
      renderProjectList(mainContent);
      break;

    case 'reports':
      renderReports(mainContent);
      break;

    default:
      mainContent.innerHTML = '<div class="error">Unknown view: ' + view + '</div>';
  }
}

export { initApp, loadView };
