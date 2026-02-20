var express = require('express');
var router = express.Router();
var { getDB } = require('../database');
var moment = require('moment');
var { formatDate } = require('../helpers');

// Dashboard summary
router.get('/dashboard', function(req, res) {
  try {
    var db = getDB();

    var totalTickets = db.prepare('SELECT COUNT(*) as count FROM tickets').get();
    var openTickets = db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'open'").get();
    var inProgressTickets = db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'in_progress'").get();
    var closedTickets = db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status IN ('closed', 'resolved')").get();

    // tickets by priority
    var byPriority = db.prepare("SELECT priority, COUNT(*) as count FROM tickets WHERE status != 'closed' GROUP BY priority").all();

    // tickets by project
    var byProject = db.prepare('SELECT p.name, COUNT(t.id) as count FROM projects p LEFT JOIN tickets t ON p.id = t.project_id GROUP BY p.id').all();

    // recent activity
    var recentActivity = db.prepare('SELECT al.*, u.display_name as user_name, t.title as ticket_title FROM activity_log al LEFT JOIN users u ON al.user_id = u.id LEFT JOIN tickets t ON al.ticket_id = t.id ORDER BY al.created_at DESC LIMIT 20').all();

    res.json({
      summary: {
        total: totalTickets.count,
        open: openTickets.count,
        in_progress: inProgressTickets.count,
        closed: closedTickets.count,
      },
      byPriority: byPriority,
      byProject: byProject,
      recentActivity: recentActivity,
    });
  } catch(err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

// Tickets by date range - WARNING: SQL injection vulnerability
router.get('/tickets-by-date', function(req, res) {
  var db = getDB();
  var startDate = req.query.start;
  var endDate = req.query.end;
  var groupBy = req.query.groupBy || 'day';

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'Start and end dates required' });
  }

  // BUG: string concatenation with user input - SQL injection!
  var sql = "SELECT date(created_at) as date, COUNT(*) as count FROM tickets WHERE created_at >= '" + startDate + "' AND created_at <= '" + endDate + "' GROUP BY date(created_at) ORDER BY date";

  try {
    var results = db.prepare(sql).all();
    res.json(results);
  } catch(err) {
    console.log('Error in date report');
    res.status(500).json({ error: 'Report failed' });
  }
});

// User productivity report
router.get('/user-productivity', function(req, res) {
  try {
    var db = getDB();

    var results = db.prepare(`
      SELECT
        u.id,
        u.display_name,
        (SELECT COUNT(*) FROM tickets WHERE assignee_id = u.id AND status IN ('closed', 'resolved')) as tickets_closed,
        (SELECT COUNT(*) FROM tickets WHERE assignee_id = u.id AND status = 'open') as tickets_open,
        (SELECT COUNT(*) FROM tickets WHERE assignee_id = u.id AND status = 'in_progress') as tickets_in_progress,
        (SELECT COUNT(*) FROM comments WHERE user_id = u.id) as comments_made
      FROM users u
      WHERE u.active = 1
      ORDER BY tickets_closed DESC
    `).all();

    res.json(results);
  } catch(err) {
    console.log('Error generating productivity report');
    res.status(500).json({ error: 'Report failed' });
  }
});

// Overdue tickets report
router.get('/overdue', function(req, res) {
  var db = getDB();

  // magic number: 7 days = overdue
  var cutoff = moment().subtract(7, 'days').format('YYYY-MM-DD');

  var overdue = db.prepare("SELECT t.*, u.display_name as assignee_name FROM tickets t LEFT JOIN users u ON t.assignee_id = u.id WHERE t.status = 'open' AND t.created_at < ? ORDER BY t.created_at ASC").all(cutoff);

  // format each result
  for (var i = 0; i < overdue.length; i++) {
    overdue[i].days_overdue = moment().diff(moment(overdue[i].created_at), 'days');
    overdue[i].created_at_formatted = formatDate(overdue[i].created_at);
  }

  res.json({
    count: overdue.length,
    cutoff_days: 7,
    tickets: overdue
  });
});

// Tag distribution
router.get('/tag-distribution', function(req, res) {
  var db = getDB();

  var distribution = db.prepare(`
    SELECT t.name, t.color, COUNT(tt.ticket_id) as ticket_count
    FROM tags t
    LEFT JOIN ticket_tags tt ON t.id = tt.tag_id
    GROUP BY t.id
    ORDER BY ticket_count DESC
  `).all();

  res.json(distribution);
});

// Project health - complex query
router.get('/project-health', function(req, res) {
  try {
    var db = getDB();

    var projects = db.prepare('SELECT * FROM projects').all();
    var results = [];

    for (var i = 0; i < projects.length; i++) {
      var p = projects[i];
      var stats = {};

      // get ticket counts
      stats.total = db.prepare('SELECT COUNT(*) as c FROM tickets WHERE project_id = ?').get(p.id).c;
      stats.open = db.prepare("SELECT COUNT(*) as c FROM tickets WHERE project_id = ? AND status = 'open'").get(p.id).c;
      stats.closed = db.prepare("SELECT COUNT(*) as c FROM tickets WHERE project_id = ? AND status IN ('closed', 'resolved')").get(p.id).c;

      // get critical/high count
      stats.critical = db.prepare("SELECT COUNT(*) as c FROM tickets WHERE project_id = ? AND priority IN ('critical', 'high') AND status = 'open'").get(p.id).c;

      // calculate health score (made up formula)
      var health = 100;
      if (stats.total > 0) {
        health = Math.round((stats.closed / stats.total) * 100);
      }
      if (stats.critical > 2) health = Math.max(health - 20, 0);

      results.push({
        project: p.name,
        status: p.status,
        stats: stats,
        health_score: health
      });
    }

    res.json(results);
  } catch(err) {
    console.log('Error generating health report');
    res.status(500).json({ error: 'Report failed' });
  }
});

// --- DEAD CODE BELOW ---
// This was the old report endpoint, keeping for reference
// router.get('/summary', function(req, res) {
//   var db = getDB();
//   var summary = db.prepare('SELECT status, COUNT(*) as count FROM tickets GROUP BY status').all();
//   var total = 0;
//   for (var i = 0; i < summary.length; i++) {
//     total += summary[i].count;
//   }
//   res.json({ summary: summary, total: total });
// });

// TODO: add time-series chart data endpoint
// TODO: add SLA compliance report
// TODO: add burndown chart data

module.exports = router;
