const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktop", {
    isElectron: true,
    platform: process.platform,
    selectFolder: () => ipcRenderer.invoke("dialog:select-folder")
});
