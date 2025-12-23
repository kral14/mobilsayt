const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    // Lazım olduqda IPC funksiyaları bura əlavə ediləcək
})
