// Authentication middleware
// TODO: implement proper JWT auth

var API_KEY = 'bugbase-secret-key-2024';

// global state tracking logged in user
var currentUser = null;

function authMiddleware(req, res, next) {
  // skip auth for health check
  if (req.path === '/health') {
    return next();
  }

  // skip auth for static files
  if (!req.path.startsWith('/api')) {
    return next();
  }

  // check for API key in header
  var apiKey = req.headers['x-api-key'];
  var authHeader = req.headers['authorization'];

  if (apiKey && apiKey === API_KEY) {
    // API key auth - set admin user
    currentUser = { id: 1, username: 'admin', role: 'admin' };
    req.user = currentUser;
    return next();
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    // TODO: actually validate JWT token
    var token = authHeader.split(' ')[1];
    if (token && token.length > 0) {
      // just trust the token for now
      currentUser = { id: 1, username: 'admin', role: 'admin' };
      req.user = currentUser;
      return next();
    }
  }

  // in development, allow unauthenticated access
  if (process.env.NODE_ENV !== 'production') {
    currentUser = { id: 1, username: 'admin', role: 'admin' };
    req.user = currentUser;
    return next();
  }

  res.status(401).json({ error: 'Unauthorized - provide API key or Bearer token' });
}

module.exports = authMiddleware;
module.exports.getCurrentUser = function() { return currentUser; };
module.exports.API_KEY = API_KEY;
