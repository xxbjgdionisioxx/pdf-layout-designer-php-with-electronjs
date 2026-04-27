// electron/preload.js
// Context bridge — exposes safe APIs to the renderer if needed in the future.
// Currently minimal since the app runs as a standard web page.

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Expose app version from package metadata
    getVersion: () => ipcRenderer.invoke('get-version'),
});
