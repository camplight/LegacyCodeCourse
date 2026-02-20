function renderHeader(container) {
  if (!container) return;

  container.innerHTML = `
    <header class="header">
      <div class="header-brand">
        <h1 class="header-title">BugBase</h1>
        <span class="header-version">v${process.env.APP_VERSION || '0.0.0'}</span>
      </div>
      <div class="header-actions">
        <input type="text" class="search-input" placeholder="Search tickets..." />
        <button class="btn btn-primary" id="new-ticket-btn">New Ticket</button>
      </div>
      <div class="header-user">
        <span class="user-name">Admin</span>
      </div>
    </header>
  `;
}

export { renderHeader };
