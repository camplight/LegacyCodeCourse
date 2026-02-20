import './styles/main.scss';
import { initApp } from './app';

// wait for DOM
document.addEventListener('DOMContentLoaded', function() {
  console.log('BugBase v' + process.env.APP_VERSION + ' initializing...');
  initApp();
});
