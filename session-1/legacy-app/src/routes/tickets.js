var express = require('express');
var router = express.Router();
var { getDB } = require('../database');
var { formatDate, isEmpty, paginate, renderMarkdown, slugify, ticketAgeDays } = require('../helpers');
var moment = require('moment')

// GET all tickets with optional filters
router.get('/', function(req, res) {
  try {
    var db = getDB();
    var status = req.query.status;
    var priority = req.query.priority;
    var project_id = req.query.project_id;
    var assignee_id = req.query.assignee_id;
    var search = req.query.search;
    var page = parseInt(req.query.page) || 1;
    var pageSize = parseInt(req.query.pageSize) || 20;

    console.log('Fetching tickets with filters:', req.query);

    // build query dynamically
    var sql = 'SELECT t.*, u1.display_name as reporter_name, u2.display_name as assignee_name, p.name as project_name FROM tickets t LEFT JOIN users u1 ON t.reporter_id = u1.id LEFT JOIN users u2 ON t.assignee_id = u2.id LEFT JOIN projects p ON t.project_id = p.id WHERE 1=1';
    var params = [];

    if (status) {
      sql += ' AND t.status = ?';
      params.push(status);
    }
    if (priority) {
      sql += ' AND t.priority = ?';
      params.push(priority);
    }
    if (project_id) {
      sql += ' AND t.project_id = ?';
      params.push(project_id);
    }
    if (assignee_id) {
      sql += ' AND t.assignee_id = ?';
      params.push(assignee_id);
    }
    if (search) {
      sql += " AND (t.title LIKE ? OR t.description LIKE ?)";
      params.push('%' + search + '%');
      params.push('%' + search + '%');
    }

    sql += ' ORDER BY t.created_at DESC';

    var results = db.prepare(sql).all(...params);

    // format dates for each result
    for (var i = 0; i < results.length; i++) {
      results[i].created_at_formatted = formatDate(results[i].created_at);
      results[i].age_days = ticketAgeDays(results[i].created_at);
    }

    // paginate
    var paginated = paginate(results, page, pageSize);

    res.json(paginated);
  } catch(err) {
    console.log('Error fetching tickets: ' + err.message);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// GET single ticket by ID with all related data
router.get('/:id', function(req, res) {
  try {
    var db = getDB();
    var id = req.params.id;

    console.log('Fetching ticket #' + id);

    var ticket = db.prepare('SELECT t.*, u1.display_name as reporter_name, u1.email as reporter_email, u2.display_name as assignee_name FROM tickets t LEFT JOIN users u1 ON t.reporter_id = u1.id LEFT JOIN users u2 ON t.assignee_id = u2.id WHERE t.id = ?').get(id);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // get comments
    var comments = db.prepare('SELECT c.*, u.display_name as author_name FROM comments c LEFT JOIN users u ON c.user_id = u.id WHERE c.ticket_id = ? ORDER BY c.created_at ASC').all(id);

    // render markdown for each comment
    for (var i = 0; i < comments.length; i++) {
      comments[i].body_html = renderMarkdown(comments[i].body);
      comments[i].created_at_formatted = formatDate(comments[i].created_at);
    }

    // get tags
    var tags = db.prepare('SELECT t.* FROM tags t INNER JOIN ticket_tags tt ON t.id = tt.tag_id WHERE tt.ticket_id = ?').all(id);

    // get attachments
    var attachments = db.prepare('SELECT a.*, u.display_name as uploader_name FROM attachments a LEFT JOIN users u ON a.user_id = u.id WHERE a.ticket_id = ?').all(id);

    // get activity log
    var activities = db.prepare('SELECT al.*, u.display_name as user_name FROM activity_log al LEFT JOIN users u ON al.user_id = u.id WHERE al.ticket_id = ? ORDER BY al.created_at DESC').all(id);

    // get sub-tickets
    var subTickets = db.prepare('SELECT id, title, status, priority FROM tickets WHERE parent_id = ?').all(id);

    // format the description as markdown
    ticket.description_html = renderMarkdown(ticket.description);
    ticket.created_at_formatted = formatDate(ticket.created_at);
    ticket.age_days = ticketAgeDays(ticket.created_at);

    ticket.comments = comments;
    ticket.tags = tags;
    ticket.attachments = attachments;
    ticket.activities = activities;
    ticket.sub_tickets = subTickets;

    res.json(ticket);
  } catch(err) {
    console.log('Error fetching ticket: ' + err.message);
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

// POST create a new ticket
router.post('/', function(req, res) {
  try {
    var db = getDB();
    var { title, description, status, priority, type, project_id, reporter_id, assignee_id, parent_id, estimated_hours, tags } = req.body;

    // validation
    if (!title || isEmpty(title)) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!project_id) {
      return res.status(400).json({ error: 'Project ID is required' });
    }
    if (!reporter_id) {
      return res.status(400).json({ error: 'Reporter ID is required' });
    }

    // check project exists
    var project = db.prepare('SELECT id FROM projects WHERE id = ?').get(project_id);
    if (!project) {
      return res.status(400).json({ error: 'Project not found' });
    }

    // check reporter exists
    var reporter = db.prepare('SELECT id FROM users WHERE id = ?').get(reporter_id);
    if (!reporter) {
      return res.status(400).json({ error: 'Reporter not found' });
    }

    // check assignee if provided
    if (assignee_id) {
      var assignee = db.prepare('SELECT id FROM users WHERE id = ?').get(assignee_id);
      if (!assignee) {
        return res.status(400).json({ error: 'Assignee not found' });
      }
    }

    // check parent ticket if provided
    if (parent_id) {
      var parent = db.prepare('SELECT id FROM tickets WHERE id = ?').get(parent_id);
      if (!parent) {
        return res.status(400).json({ error: 'Parent ticket not found' });
      }
    }

    // validate priority
    if (priority && !['low', 'medium', 'high', 'critical'].includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority. Must be: low, medium, high, critical' });
    }

    // validate status
    if (status && !['open', 'in_progress', 'closed', 'resolved', 'wontfix'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // validate type
    if (type && !['bug', 'feature', 'task', 'improvement'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type' });
    }

    console.log('Creating ticket: ' + title);

    var result = db.prepare('INSERT INTO tickets (title, description, status, priority, type, project_id, reporter_id, assignee_id, parent_id, estimated_hours) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
      title,
      description || null,
      status || 'open',
      priority || 'medium',
      type || 'bug',
      project_id,
      reporter_id,
      assignee_id || null,
      parent_id || null,
      estimated_hours || null
    );

    var ticketId = result.lastInsertRowid;

    // add tags if provided
    if (tags && tags.length > 0) {
      var insertTag = db.prepare('INSERT OR IGNORE INTO ticket_tags (ticket_id, tag_id) VALUES (?, ?)');
      for (var i = 0; i < tags.length; i++) {
        insertTag.run(ticketId, tags[i]);
      }
    }

    // log activity
    db.prepare('INSERT INTO activity_log (ticket_id, user_id, action, details) VALUES (?, ?, ?, ?)').run(ticketId, reporter_id, 'created', 'Ticket created');

    var newTicket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId);
    res.status(201).json(newTicket);
  } catch(err) {
    console.log('Error creating ticket: ' + err.message);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// PUT update a ticket
router.put('/:id', function(req, res) {
  try {
    var db = getDB();
    var id = req.params.id;
    var updates = req.body;

    // check ticket exists
    var existing = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // validate priority if provided
    if (updates.priority && !['low', 'medium', 'high', 'critical'].includes(updates.priority)) {
      return res.status(400).json({ error: 'Invalid priority. Must be: low, medium, high, critical' });
    }

    // validate status if provided
    if (updates.status && !['open', 'in_progress', 'closed', 'resolved', 'wontfix'].includes(updates.status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // build update query
    var fields = [];
    var params = [];
    if (updates.title !== undefined) { fields.push('title = ?'); params.push(updates.title); }
    if (updates.description !== undefined) { fields.push('description = ?'); params.push(updates.description); }
    if (updates.status !== undefined) { fields.push('status = ?'); params.push(updates.status); }
    if (updates.priority !== undefined) { fields.push('priority = ?'); params.push(updates.priority); }
    if (updates.type !== undefined) { fields.push('type = ?'); params.push(updates.type); }
    if (updates.assignee_id !== undefined) { fields.push('assignee_id = ?'); params.push(updates.assignee_id); }
    if (updates.estimated_hours !== undefined) { fields.push('estimated_hours = ?'); params.push(updates.estimated_hours); }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    fields.push("updated_at = datetime('now')");

    // handle closing
    if (updates.status === 'closed' || updates.status === 'resolved') {
      fields.push("closed_at = datetime('now')");
    }

    var sql = 'UPDATE tickets SET ' + fields.join(', ') + ' WHERE id = ?';
    params.push(id);

    db.prepare(sql).run(...params);

    // log activity for status changes
    if (updates.status && updates.status !== existing.status) {
      db.prepare('INSERT INTO activity_log (ticket_id, user_id, action, details) VALUES (?, ?, ?, ?)').run(id, req.user ? req.user.id : 1, 'status_changed', 'Changed status from ' + existing.status + ' to ' + updates.status);
    }

    // log activity for priority changes
    if (updates.priority && updates.priority !== existing.priority) {
      db.prepare('INSERT INTO activity_log (ticket_id, user_id, action, details) VALUES (?, ?, ?, ?)').run(id, req.user ? req.user.id : 1, 'priority_changed', 'Changed priority from ' + existing.priority + ' to ' + updates.priority);
    }

    var updated = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
    res.json(updated);
  } catch(err) {
    console.log('Error updating ticket: ' + err.message);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

// DELETE a ticket
router.delete('/:id', function(req, res) {
  try {
    var db = getDB();
    var id = req.params.id;

    var ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // delete related data first
    db.prepare('DELETE FROM comments WHERE ticket_id = ?').run(id);
    db.prepare('DELETE FROM ticket_tags WHERE ticket_id = ?').run(id);
    db.prepare('DELETE FROM attachments WHERE ticket_id = ?').run(id);
    db.prepare('DELETE FROM activity_log WHERE ticket_id = ?').run(id);
    // update child tickets
    db.prepare('UPDATE tickets SET parent_id = NULL WHERE parent_id = ?').run(id);
    // delete ticket
    db.prepare('DELETE FROM tickets WHERE id = ?').run(id);

    console.log('Deleted ticket #' + id);
    res.json({ message: 'Ticket deleted', id: id });
  } catch(err) {
    console.log('Error deleting ticket');
    res.status(500).json({ error: 'Failed to delete ticket' });
  }
});

// POST add comment to ticket
router.post('/:id/comments', function(req, res) {
  try {
    var db = getDB();
    var ticket_id = req.params.id;
    var { user_id, body } = req.body;

    if (!body || isEmpty(body)) {
      return res.status(400).json({ error: 'Comment body is required' });
    }
    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // check ticket exists
    var ticket = db.prepare('SELECT id FROM tickets WHERE id = ?').get(ticket_id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    var result = db.prepare('INSERT INTO comments (ticket_id, user_id, body) VALUES (?, ?, ?)').run(ticket_id, user_id, body);

    // log activity
    db.prepare('INSERT INTO activity_log (ticket_id, user_id, action, details) VALUES (?, ?, ?, ?)').run(ticket_id, user_id, 'commented', 'Added comment');

    var comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(comment);
  } catch(err) {
    console.log('Error adding comment');
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

module.exports = router;
