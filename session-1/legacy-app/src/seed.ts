import { getDB, initSchema } from './database';
const crypto = require('crypto');

// quick hash - not secure but whatever
function hashPw(password: string) {
  return crypto.createHash('md5').update(password).digest('hex');
}

function seed() {
  const db: any = initSchema();

  // clear existing data
  db.exec('DELETE FROM activity_log');
  db.exec('DELETE FROM ticket_tags');
  db.exec('DELETE FROM attachments');
  db.exec('DELETE FROM comments');
  db.exec('DELETE FROM tickets');
  db.exec('DELETE FROM projects');
  db.exec('DELETE FROM tags');
  db.exec('DELETE FROM users');

  // reset autoincrement
  db.exec("DELETE FROM sqlite_sequence");

  // Users
  const insertUser = db.prepare('INSERT INTO users (username, email, password_hash, display_name, role) VALUES (?, ?, ?, ?, ?)');
  insertUser.run('admin', 'admin@bugbase.local', hashPw('admin123'), 'Admin User', 'admin');
  insertUser.run('jsmith', 'john.smith@example.com', hashPw('password'), 'John Smith', 'developer');
  insertUser.run('jane_doe', 'jane@example.com', hashPw('jane2024'), 'Jane Doe', 'developer');
  insertUser.run('bob', 'bob.wilson@example.com', hashPw('bob!pass'), 'Bob Wilson', 'tester');
  insertUser.run('alice_m', 'alice@example.com', hashPw('alice'), 'Alice Martinez', 'manager');

  // Projects
  const insertProject = db.prepare('INSERT INTO projects (name, description, slug, owner_id, status) VALUES (?, ?, ?, ?, ?)');
  insertProject.run('BugBase Core', 'The main BugBase application', 'bugbase-core', 1, 'active');
  insertProject.run('Mobile App', 'BugBase mobile client', 'mobile-app', 5, 'active');
  insertProject.run('Legacy API', 'Old REST API - deprecated', 'legacy-api', 2, 'archived');

  // Tags
  const insertTag = db.prepare('INSERT INTO tags (name, color) VALUES (?, ?)');
  insertTag.run('bug', '#e74c3c');
  insertTag.run('feature', '#2ecc71');
  insertTag.run('urgent', '#e67e22');
  insertTag.run('documentation', '#3498db');
  insertTag.run('refactor', '#9b59b6');
  insertTag.run('wontfix', '#95a5a6');
  insertTag.run('performance', '#f39c12');

  // Tickets - mix of statuses and priorities
  const insertTicket = db.prepare('INSERT INTO tickets (title, description, status, priority, type, project_id, reporter_id, assignee_id, parent_id, estimated_hours) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  insertTicket.run('Login page crashes on Safari', 'Users report blank white screen on Safari 16', 'open', 'high', 'bug', 1, 2, 3, null, 4);
  insertTicket.run('Add dark mode support', 'Users have requested dark mode theme', 'open', 'medium', 'feature', 1, 4, null, null, 20);
  insertTicket.run('Fix SQL injection in search', 'Search endpoint is vulnerable to SQL injection', 'open', 'critical', 'bug', 1, 1, 2, null, 2);
  insertTicket.run('Update dependencies', 'Several packages are outdated', 'in_progress', 'medium', 'task', 1, 2, 2, null, 8);
  insertTicket.run('Investigate Safari CSS', 'Sub-task: check CSS grid support', 'open', 'high', 'task', 1, 3, 3, 1, 2);
  insertTicket.run('Mobile login not working', 'Authentication fails on iOS app', 'open', 'critical', 'bug', 2, 4, 2, null, 6);
  insertTicket.run('Push notifications', 'Implement push notification support', 'open', 'low', 'feature', 2, 5, null, null, 40);
  insertTicket.run('API rate limiting', 'Add rate limiting to all endpoints', 'closed', 'medium', 'feature', 3, 1, 2, null, 12);
  insertTicket.run('Fix CORS headers', 'CORS not configured for mobile origin', 'closed', 'high', 'bug', 3, 3, 2, null, 1);
  insertTicket.run('Memory leak in worker', 'Worker process grows unbounded', 'open', 'high', 'bug', 1, 2, null, null, null);
  insertTicket.run('Add export to CSV', 'Export ticket list to CSV format', 'in_progress', 'low', 'feature', 1, 5, 3, null, 6);
  insertTicket.run('Dashboard loading slow', 'Takes 5+ seconds to load main dashboard', 'open', 'high', 'bug', 1, 4, null, null, null);
  insertTicket.run('Write API documentation', 'Document all REST endpoints', 'open', 'low', 'task', 3, 5, null, null, 16);
  insertTicket.run('User avatar upload', 'Allow users to upload profile pictures', 'open', 'low', 'feature', 1, 3, null, null, 8);
  insertTicket.run('Fix date formatting', 'Dates show in wrong timezone', 'closed', 'medium', 'bug', 1, 2, 3, null, 1);

  // Comments
  const insertComment = db.prepare('INSERT INTO comments (ticket_id, user_id, body) VALUES (?, ?, ?)');
  insertComment.run(1, 3, 'I can reproduce this on Safari 16.2. Looks like a flexbox issue.');
  insertComment.run(1, 2, 'Could be related to the CSS grid changes we made last sprint.');
  insertComment.run(3, 1, 'This is critical - we need to fix the parameterized queries ASAP.');
  insertComment.run(3, 2, 'Working on it now. The reports endpoint is the worst offender.');
  insertComment.run(6, 4, 'Getting 401 even with valid token. Might be a JWT expiry issue.');
  insertComment.run(10, 2, 'Heap snapshot shows event listeners not being cleaned up.');
  insertComment.run(12, 4, 'Profiling shows N+1 queries on the ticket list.');
  insertComment.run(12, 1, 'We should add pagination and lazy loading.');

  // Ticket tags
  const insertTicketTag = db.prepare('INSERT INTO ticket_tags (ticket_id, tag_id) VALUES (?, ?)');
  insertTicketTag.run(1, 1); // Safari bug -> bug
  insertTicketTag.run(1, 3); // Safari bug -> urgent
  insertTicketTag.run(2, 2); // Dark mode -> feature
  insertTicketTag.run(3, 1); // SQL injection -> bug
  insertTicketTag.run(3, 3); // SQL injection -> urgent
  insertTicketTag.run(4, 5); // Update deps -> refactor
  insertTicketTag.run(6, 1); // Mobile login -> bug
  insertTicketTag.run(6, 3); // Mobile login -> urgent
  insertTicketTag.run(10, 1); // Memory leak -> bug
  insertTicketTag.run(10, 7); // Memory leak -> performance
  insertTicketTag.run(12, 7); // Dashboard slow -> performance
  insertTicketTag.run(13, 4); // API docs -> documentation

  // Attachments
  const insertAttachment = db.prepare('INSERT INTO attachments (ticket_id, user_id, filename, filepath, mimetype, size) VALUES (?, ?, ?, ?, ?, ?)');
  insertAttachment.run(1, 3, 'safari-screenshot.png', '/uploads/safari-screenshot.png', 'image/png', 245000);
  insertAttachment.run(10, 2, 'heap-snapshot.json', '/uploads/heap-snapshot.json', 'application/json', 1520000);
  insertAttachment.run(12, 4, 'profile-results.html', '/uploads/profile-results.html', 'text/html', 89000);

  // Activity log
  const insertActivity = db.prepare('INSERT INTO activity_log (ticket_id, user_id, action, details) VALUES (?, ?, ?, ?)');
  insertActivity.run(1, 2, 'created', 'Ticket created');
  insertActivity.run(1, 3, 'commented', 'Added comment');
  insertActivity.run(3, 1, 'priority_changed', 'Changed priority from high to critical');
  insertActivity.run(4, 2, 'status_changed', 'Changed status to in_progress');
  insertActivity.run(8, 2, 'closed', 'Ticket resolved and closed');
  insertActivity.run(9, 2, 'closed', 'CORS fix deployed');
  insertActivity.run(6, 4, 'created', 'Ticket created');
  insertActivity.run(11, 3, 'assigned', 'Assigned to Jane Doe');
  insertActivity.run(15, 3, 'closed', 'Date formatting fixed');

  console.log('Seed data inserted successfully!');
  console.log('  - 5 users');
  console.log('  - 3 projects');
  console.log('  - 15 tickets');
  console.log('  - 8 comments');
  console.log('  - 7 tags');
  console.log('  - 3 attachments');
  console.log('  - 9 activity log entries');
}

seed();
