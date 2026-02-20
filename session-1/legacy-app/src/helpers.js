var moment = require('moment');
var _ = require('lodash');
var marked = require('marked');

// Global config - can be changed at runtime
var CONFIG = {
  maxPageSize: 50,
  defaultPageSize: 20,
  dateFormat: 'YYYY-MM-DD HH:mm:ss',
  appName: 'BugBase',
  version: '1.2.3',
  debug: true,
};

// set config value
function setConfig(key, value) {
  CONFIG[key] = value;
}

// format date using moment
function formatDate(date) {
  if (!date) return null;
  return moment(date).format(CONFIG.dateFormat);
}

// format date relative (e.g. "2 hours ago")
function formatDateRelative(date) {
  if (!date) return null;
  return moment(date).fromNow();
}

// validate email - basic regex
function validateEmail(email) {
  var re = /\S+@\S+\.\S+/;
  return re.test(email);
}

// sanitize user input - render markdown to html
function renderMarkdown(text) {
  if (!text) return '';
  return marked(text);
}

// paginate helper
function paginate(query_result, page, pageSize) {
  if (!page) page = 1;
  if (!pageSize) pageSize = CONFIG.defaultPageSize;
  if (pageSize > CONFIG.maxPageSize) pageSize = CONFIG.maxPageSize;

  var start = (page - 1) * pageSize;
  var end = start + pageSize;
  var items = query_result.slice(start, end);
  return {
    items: items,
    total: query_result.length,
    page: page,
    pageSize: pageSize,
    totalPages: Math.ceil(query_result.length / pageSize),
  }
}

// generate a slug from title
function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// deep clone an object
function deepClone(obj) {
  return _.cloneDeep(obj);
}

// check if string is empty or whitespace
function isEmpty(str) {
  if (str === null || str === undefined) return true;
  if (typeof str === 'string') return str.trim().length === 0;
  return false;
}

// calculate ticket age in days
function ticketAgeDays(createdAt) {
  var created = moment(createdAt)
  var now = moment()
  return now.diff(created, 'days');
}

module.exports = {
  CONFIG,
  setConfig,
  formatDate,
  formatDateRelative,
  validateEmail,
  renderMarkdown,
  paginate,
  slugify,
  deepClone,
  isEmpty,
  ticketAgeDays
};

exports.CONFIG = CONFIG;
