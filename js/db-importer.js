// db-importer.js – Handles DB import UI and IPC communication

export const dbImporter = {
  // Prompt is handled by existing modal in index.php; this function just opens it
  openPrompt() {
    const modal = document.getElementById('modal-db-import');
    if (modal) modal.style.display = 'flex';
  },

  // Called when user clicks Connect in the modal
  async connect() {
    const host = document.getElementById('db-host').value.trim();
    const port = parseInt(document.getElementById('db-port').value, 10) || 3306;
    const user = document.getElementById('db-user').value.trim();
    const password = document.getElementById('db-pass').value;
    const dbname = document.getElementById('db-name').value.trim();

    const config = { host, port, user, password, dbname };
    try {
      let schema;
      // Check if we are in Electron and the API is available
      if (window.electronAPI && typeof window.electronAPI.dbConnect === 'function') {
        schema = await window.electronAPI.dbConnect(config);
      } else {
        // Fallback to direct fetch (useful if running in browser or Electron API failed to load)
        const response = await fetch('api/db-schema.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config)
        });
        
        if (!response.ok) {
          const errText = await response.text();
          throw new Error(errText || `Server returned ${response.status}`);
        }
        schema = await response.json();
      }
      // Store schema in global state (state.js will have dbSchema)
      window.dispatchEvent(new CustomEvent('db-schema-loaded', { detail: schema }));
      // Close modal
      const modal = document.getElementById('modal-db-import');
      if (modal) modal.style.display = 'none';
    } catch (err) {
      alert('Failed to connect or fetch schema: ' + err.message);
    }
  },
};

// Attach click handler for the modal OK button
const connectBtn = document.getElementById('modal-db-import-ok');
if (connectBtn) {
  connectBtn.addEventListener('click', () => dbImporter.connect());
}
