import { createTicket, fetchProjects, fetchUsers } from '../utils/api';

var _projects = null;
var _users = null;

function showNewTicketModal() {
  // remove existing modal if any
  var existing = document.getElementById('new-ticket-modal');
  if (existing) existing.remove();

  var overlay = document.createElement('div');
  overlay.id = 'new-ticket-modal';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2>New Ticket</h2>
        <button class="modal-close" id="close-modal">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>Title *</label>
          <input type="text" id="ticket-title" class="form-input" placeholder="Enter ticket title" />
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea id="ticket-desc" class="form-textarea" rows="4" placeholder="Describe the issue..."></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Project *</label>
            <select id="ticket-project" class="form-select"><option value="">Loading...</option></select>
          </div>
          <div class="form-group">
            <label>Priority</label>
            <select id="ticket-priority" class="form-select">
              <option value="low">Low</option>
              <option value="medium" selected>Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Type</label>
            <select id="ticket-type" class="form-select">
              <option value="bug">Bug</option>
              <option value="feature">Feature</option>
              <option value="task">Task</option>
              <option value="improvement">Improvement</option>
            </select>
          </div>
          <div class="form-group">
            <label>Assignee</label>
            <select id="ticket-assignee" class="form-select"><option value="">Loading...</option></select>
          </div>
        </div>
        <div class="form-group">
          <label>Estimated Hours</label>
          <input type="number" id="ticket-hours" class="form-input" placeholder="0" min="0" />
        </div>
        <div id="form-error" class="form-error" style="display:none;"></div>
      </div>
      <div class="modal-footer">
        <button class="btn" id="cancel-ticket">Cancel</button>
        <button class="btn btn-primary" id="submit-ticket">Create Ticket</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // load projects and users in parallel
  loadFormData();

  // event listeners
  document.getElementById('close-modal').addEventListener('click', closeModal);
  document.getElementById('cancel-ticket').addEventListener('click', closeModal);
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) closeModal();
  });

  document.getElementById('submit-ticket').addEventListener('click', function() {
    submitNewTicket();
  });
}

function loadFormData() {
  // fetch projects
  var projectPromise;
  if (_projects) {
    projectPromise = Promise.resolve(_projects);
  } else {
    projectPromise = fetchProjects().then(function(p) { _projects = p; return p; });
  }

  var userPromise;
  if (_users) {
    userPromise = Promise.resolve(_users);
  } else {
    userPromise = fetchUsers().then(function(u) { _users = u; return u; });
  }

  projectPromise.then(function(projects) {
    var sel = document.getElementById('ticket-project');
    if (!sel) return;
    var html = '<option value="">Select project...</option>';
    for (var i = 0; i < projects.length; i++) {
      html += '<option value="' + projects[i].id + '">' + projects[i].name + '</option>';
    }
    sel.innerHTML = html;
  });

  userPromise.then(function(users) {
    var sel = document.getElementById('ticket-assignee');
    if (!sel) return;
    var html = '<option value="">Unassigned</option>';
    for (var i = 0; i < users.length; i++) {
      if (users[i].active !== 0) {
        html += '<option value="' + users[i].id + '">' + users[i].display_name + '</option>';
      }
    }
    sel.innerHTML = html;
  });
}

function submitNewTicket() {
  var title = document.getElementById('ticket-title').value;
  var description = document.getElementById('ticket-desc').value;
  var project_id = document.getElementById('ticket-project').value;
  var priority = document.getElementById('ticket-priority').value;
  var type = document.getElementById('ticket-type').value;
  var assignee_id = document.getElementById('ticket-assignee').value;
  var estimated_hours = document.getElementById('ticket-hours').value;
  var errorEl = document.getElementById('form-error');

  // basic validation
  if (!title || !title.trim()) {
    errorEl.textContent = 'Title is required';
    errorEl.style.display = 'block';
    return;
  }
  if (!project_id) {
    errorEl.textContent = 'Please select a project';
    errorEl.style.display = 'block';
    return;
  }

  var data = {
    title: title,
    description: description || null,
    project_id: parseInt(project_id),
    priority: priority,
    type: type,
    reporter_id: 1, // hardcoded admin - no auth on client
    assignee_id: assignee_id ? parseInt(assignee_id) : null,
    estimated_hours: estimated_hours ? parseFloat(estimated_hours) : null,
  };

  var btn = document.getElementById('submit-ticket');
  btn.textContent = 'Creating...';
  btn.disabled = true;

  createTicket(data)
    .then(function(ticket) {
      closeModal();
      // navigate to the new ticket
      window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'ticket-detail', id: ticket.id } }));
    })
    .catch(function(err) {
      errorEl.textContent = 'Failed to create ticket. Check your input.';
      errorEl.style.display = 'block';
      btn.textContent = 'Create Ticket';
      btn.disabled = false;
    });
}

function closeModal() {
  var modal = document.getElementById('new-ticket-modal');
  if (modal) modal.remove();
}

export { showNewTicketModal };
