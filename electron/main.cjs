const { app, BrowserWindow, Menu, dialog, ipcMain } = require("electron");
const path = require("node:path");

Menu.setApplicationMenu(null);

ipcMain.handle("dialog:select-folder", async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showOpenDialog(window, {
        properties: ["openDirectory", "createDirectory"],
        title: "Select a folder to scan"
    });
    return result.canceled ? null : result.filePaths[0];
});

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 800,
        title: "AI Folder Organizer",
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, "preload.cjs"),
            contextIsolation: true,
            nodeIntegration: false
        }
    });
    win.setMenu(null);
    win.setMenuBarVisibility(false);
    win.on("page-title-updated", (event) => {
        event.preventDefault();
        win.setTitle("AI Folder Organizer");
    });

    if (app.isPackaged) {
        win.loadFile(path.join(__dirname, "../dist/index.html"));
    } else {
        win.loadURL("http://127.0.0.1:5173");
    }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});
