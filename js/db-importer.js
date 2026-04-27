// db-importer.js – Handles DB import UI and IPC communication
import { state } from './state.js';
import { showToast } from './cursor.js';

export const dbImporter = {
  init() {
    this.fetchSavedConfig();
    
    const connectBtn = document.getElementById('modal-db-import-ok');
    if (connectBtn) {
      connectBtn.addEventListener('click', () => this.connect());
    }

    // Listen for driver changes to update default port
    const driverSel = document.getElementById('db-driver');
    if (driverSel) {
      driverSel.addEventListener('change', (e) => {
        const portInput = document.getElementById('db-port');
        if (e.target.value === 'mysql') portInput.value = '3306';
        if (e.target.value === 'pgsql') portInput.value = '5432';
        // SQLite doesn't use port
      });
    }
  },

  async fetchSavedConfig() {
    try {
      const response = await fetch('api/db-config.php');
      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          state.savedDbConfig = data.config;
          this.autoFill(data.config);
        }
      }
    } catch (err) {
      console.error('Failed to fetch saved DB config', err);
    }
  },

  autoFill(config) {
    if (document.getElementById('db-driver')) document.getElementById('db-driver').value = config.driver || 'mysql';
    if (document.getElementById('db-host')) document.getElementById('db-host').value = config.host || '';
    if (document.getElementById('db-port')) document.getElementById('db-port').value = config.port || '';
    if (document.getElementById('db-user')) document.getElementById('db-user').value = config.user || '';
    if (document.getElementById('db-pass')) document.getElementById('db-pass').value = config.password || '';
    if (document.getElementById('db-name')) document.getElementById('db-name').value = config.dbname || '';
    if (document.getElementById('db-save-config')) document.getElementById('db-save-config').checked = true;
  },

  // Prompt is handled by existing modal in index.php; this function just opens it
  openPrompt() {
    const modal = document.getElementById('modal-db-import');
    if (modal) modal.style.display = 'flex';
  },

  // Called when user clicks Connect in the modal
  async connect() {
    const driver = document.getElementById('db-driver').value;
    const host = document.getElementById('db-host').value.trim();
    const port = parseInt(document.getElementById('db-port').value, 10) || 3306;
    const user = document.getElementById('db-user').value.trim();
    const password = document.getElementById('db-pass').value;
    const dbname = document.getElementById('db-name').value.trim();
    const saveConfig = document.getElementById('db-save-config').checked;

    const config = { driver, host, port, user, password, dbname };
    
    try {
      let schema;
      // Check if we are in Electron and the API is available
      if (window.electronAPI && typeof window.electronAPI.dbConnect === 'function') {
        schema = await window.electronAPI.dbConnect(config);
      } else {
        // Fallback to direct fetch
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

      // If successful and saveConfig is checked, save to user profile
      if (saveConfig) {
        await fetch('api/db-config.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config)
        });
      }

      // Store schema in global state (state.js will have dbSchema)
      window.dispatchEvent(new CustomEvent('db-schema-loaded', { detail: schema }));
      // Close modal
      const modal = document.getElementById('modal-db-import');
      if (modal) modal.style.display = 'none';
      showToast('Database connected', 'success');
    } catch (err) {
      alert('Failed to connect or fetch schema: ' + err.message);
    }
  },
};

// Bootstrap on load
document.addEventListener('DOMContentLoaded', () => {
  dbImporter.init();
});
