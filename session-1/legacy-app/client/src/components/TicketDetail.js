import { fetchTicket, updateTicket, addComment } from '../utils/api';
import { formatDate } from '../utils/formatters';

function renderTicketDetail(container, ticketId) {
  if (!container) return;
  container.innerHTML = '<div class="loading">Loading ticket #' + ticketId + '...</div>';

  fetchTicket(ticketId)
    .then(function(ticket) {
      var html = '<div class="ticket-detail">';

      // back button
      html += '<div class="detail-nav">';
      html += '<button class="btn btn-back" id="back-to-tickets">&larr; Back to Tickets</button>';
      html += '</div>';

      // ticket header
      html += '<div class="ticket-header">';
      html += '<div class="ticket-header-left">';
      html += '<h1 class="ticket-title-main">#' + ticket.id + ' - ' + ticket.title + '</h1>';
      html += '<div class="ticket-meta">';
      html += '<span class="status-badge status-' + ticket.status + '">' + (ticket.status || '').replace('_', ' ') + '</span> ';
      html += '<span class="priority-badge priority-' + ticket.priority + '">' + (ticket.priority || '') + '</span> ';
      html += '<span class="ticket-type type-' + ticket.type + '">' + (ticket.type || '') + '</span>';
      html += '</div></div>';

      // quick actions
      html += '<div class="ticket-actions">';
      html += '<select id="status-change" class="filter-select">';
      var statuses = ['open', 'in_progress', 'closed', 'resolved', 'wontfix'];
      for (var s = 0; s < statuses.length; s++) {
        html += '<option value="' + statuses[s] + '"' + (ticket.status === statuses[s] ? ' selected' : '') + '>' + statuses[s].replace('_', ' ') + '</option>';
      }
      html += '</select>';
      html += '<button class="btn btn-primary" id="save-status-btn">Update Status</button>';
      html += '</div></div>';

      // two column layout
      html += '<div class="ticket-body">';

      // left column - description + comments
      html += '<div class="ticket-main-col">';

      // description
      html += '<div class="ticket-section">';
      html += '<h3>Description</h3>';
      if (ticket.description_html) {
        html += '<div class="ticket-description">' + ticket.description_html + '</div>';
      } else if (ticket.description) {
        html += '<div class="ticket-description">' + ticket.description + '</div>';
      } else {
        html += '<div class="ticket-description empty">No description provided.</div>';
      }
      html += '</div>';

      // sub-tickets
      if (ticket.sub_tickets && ticket.sub_tickets.length > 0) {
        html += '<div class="ticket-section">';
        html += '<h3>Sub-tickets</h3>';
        html += '<ul class="sub-ticket-list">';
        for (var st = 0; st < ticket.sub_tickets.length; st++) {
          var sub = ticket.sub_tickets[st];
          html += '<li class="sub-ticket-item">';
          html += '<a href="#" class="sub-ticket-link" data-ticket-id="' + sub.id + '">#' + sub.id + ' ' + sub.title + '</a>';
          html += ' <span class="status-badge status-' + sub.status + '">' + sub.status + '</span>';
          html += '</li>';
        }
        html += '</ul></div>';
      }

      // comments
      html += '<div class="ticket-section">';
      html += '<h3>Comments (' + (ticket.comments ? ticket.comments.length : 0) + ')</h3>';
      if (ticket.comments && ticket.comments.length > 0) {
        for (var c = 0; c < ticket.comments.length; c++) {
          var comment = ticket.comments[c];
          html += '<div class="comment">';
          html += '<div class="comment-header">';
          html += '<span class="comment-author">' + (comment.author_name || 'Unknown') + '</span>';
          html += '<span class="comment-date">' + formatDate(comment.created_at) + '</span>';
          html += '</div>';
          html += '<div class="comment-body">' + (comment.body_html || comment.body) + '</div>';
          html += '</div>';
        }
      } else {
        html += '<p class="empty-state">No comments yet.</p>';
      }
      html += '</div>';

      // add comment form
      html += '<div class="ticket-section">';
      html += '<h3>Add Comment</h3>';
      html += '<textarea id="comment-body" class="comment-textarea" placeholder="Write a comment..." rows="3"></textarea>';
      html += '<button class="btn btn-primary" id="add-comment-btn">Add Comment</button>';
      html += '</div>';

      html += '</div>'; // end main col

      // right column - sidebar info
      html += '<div class="ticket-side-col">';

      html += '<div class="ticket-info-card">';
      html += '<h3>Details</h3>';
      html += '<dl class="info-list">';
      html += '<dt>Reporter</dt><dd>' + (ticket.reporter_name || 'Unknown') + '</dd>';
      html += '<dt>Assignee</dt><dd>' + (ticket.assignee_name || 'Unassigned') + '</dd>';
      html += '<dt>Created</dt><dd>' + formatDate(ticket.created_at) + '</dd>';
      if (ticket.updated_at) {
        html += '<dt>Updated</dt><dd>' + formatDate(ticket.updated_at) + '</dd>';
      }
      if (ticket.closed_at) {
        html += '<dt>Closed</dt><dd>' + formatDate(ticket.closed_at) + '</dd>';
      }
      if (ticket.estimated_hours) {
        html += '<dt>Estimate</dt><dd>' + ticket.estimated_hours + 'h</dd>';
      }
      html += '<dt>Age</dt><dd>' + (ticket.age_days || 0) + ' days</dd>';
      html += '</dl></div>';

      // tags
      if (ticket.tags && ticket.tags.length > 0) {
        html += '<div class="ticket-info-card">';
        html += '<h3>Tags</h3>';
        html += '<div class="tag-list">';
        for (var tg = 0; tg < ticket.tags.length; tg++) {
          var tag = ticket.tags[tg];
          html += '<span class="tag" style="background:' + (tag.color || '#ccc') + '">' + tag.name + '</span>';
        }
        html += '</div></div>';
      }

      // attachments
      if (ticket.attachments && ticket.attachments.length > 0) {
        html += '<div class="ticket-info-card">';
        html += '<h3>Attachments</h3>';
        html += '<ul class="attachment-list">';
        for (var a = 0; a < ticket.attachments.length; a++) {
          var att = ticket.attachments[a];
          html += '<li>' + att.filename + ' <span class="text-muted">(' + Math.round(att.size / 1024) + ' KB)</span></li>';
        }
        html += '</ul></div>';
      }

      // activity log
      if (ticket.activities && ticket.activities.length > 0) {
        html += '<div class="ticket-info-card">';
        html += '<h3>Activity</h3>';
        html += '<ul class="mini-activity-list">';
        for (var al = 0; al < ticket.activities.length; al++) {
          var act = ticket.activities[al];
          html += '<li><strong>' + (act.user_name || '?') + '</strong> ' + act.action + '<br><span class="text-muted">' + formatDate(act.created_at) + '</span></li>';
        }
        html += '</ul></div>';
      }

      html += '</div>'; // end side col
      html += '</div>'; // end ticket-body
      html += '</div>'; // end ticket-detail

      container.innerHTML = html;

      // event listeners

      // back button
      document.getElementById('back-to-tickets').addEventListener('click', function() {
        window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'tickets' } }));
      });

      // status update
      document.getElementById('save-status-btn').addEventListener('click', function() {
        var newStatus = document.getElementById('status-change').value;
        updateTicket(ticketId, { status: newStatus })
          .then(function() {
            renderTicketDetail(container, ticketId); // reload
          })
          .catch(function(err) {
            alert('Failed to update status');
          });
      });

      // add comment
      document.getElementById('add-comment-btn').addEventListener('click', function() {
        var body = document.getElementById('comment-body').value;
        if (!body || !body.trim()) {
          alert('Please enter a comment');
          return;
        }
        // hardcoded user id = 1 (admin), because we dont have auth on the client
        addComment(ticketId, 1, body)
          .then(function() {
            renderTicketDetail(container, ticketId); // reload
          })
          .catch(function(err) {
            alert('Failed to add comment');
          });
      });

      // sub-ticket links
      var subLinks = container.querySelectorAll('.sub-ticket-link');
      for (var sl = 0; sl < subLinks.length; sl++) {
        subLinks[sl].addEventListener('click', function(e) {
          e.preventDefault();
          var id = this.getAttribute('data-ticket-id');
          window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'ticket-detail', id: id } }));
        });
      }
    })
    .catch(function(err) {
      console.log('Error loading ticket', err);
      container.innerHTML = '<div class="error">Failed to load ticket #' + ticketId + '</div>';
    });
}

export { renderTicketDetail };
