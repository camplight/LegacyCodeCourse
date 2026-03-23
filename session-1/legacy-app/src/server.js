// register ts-node so we can require .ts files from .js
require('ts-node').register({ transpileOnly: true });

var express = require('express');
var path = require('path');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var cors = require('cors');

var app = express();
var PORT = process.env.PORT || 3000; // TODO: make configurable

// middleware setup - order matters!
var logLevel = process.env.LOG_LEVEL || 'dev';
app.use(morgan(logLevel));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// CORS setup
var corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({ origin: corsOrigin }));

// serve static frontend files
app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));

// load dotenv if available
try {
  require('dotenv').config();
} catch(e) {
  // dotenv not needed in production
}

// import database - initialize on startup
var { initSchema } = require('./database');
initSchema();

// auth middleware
var authMiddleware = require('./middleware/auth');
app.use(authMiddleware);

// Routes
var ticketRoutes = require('./routes/tickets');
var userRoutes = require('./routes/users');
var projectRoutes = require('./routes/projects');
var reportRoutes = require('./routes/reports');

app.use('/api/tickets', ticketRoutes);
app.use('/api/users', userRoutes.router);
app.use('/api/projects', projectRoutes.router);
app.use('/api/reports', reportRoutes);

// health check
app.get('/health', function(req, res) {
  res.json({ status: 'ok' });
});

// serve frontend for all non-API routes (SPA)
app.get('*', function(req, res) {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// global error handler - catches everything
app.use(function(err, req, res, next) {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// start server
if (require.main === module) {
  app.listen(PORT, function() {
    console.log('BugBase server running on http://localhost:' + PORT);
    console.log('Environment: ' + (process.env.NODE_ENV || 'development'));
  });
}

module.exports = app;
