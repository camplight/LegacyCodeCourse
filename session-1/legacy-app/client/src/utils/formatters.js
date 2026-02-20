var moment = require('moment');

function formatDate(dateStr) {
  if (!dateStr) return '';
  return moment(dateStr).format('MMM D, YYYY h:mm A');
}

function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  return num.toString();
}

function truncate(str, maxLen) {
  if (!str) return '';
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen) + '...';
}

function priorityColor(priority) {
  switch(priority) {
    case 'critical': return '#e74c3c';
    case 'high': return '#e67e22';
    case 'medium': return '#f39c12';
    case 'low': return '#27ae60';
    default: return '#95a5a6';
  }
}

export { formatDate, formatNumber, truncate, priorityColor };
