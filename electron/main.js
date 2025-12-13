const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = !app.isPackaged;

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // For simple prototype; specific security hardening recommended for prod
            webSecurity: false // Often helps with local file access issues in prototypes
        },
        title: "IdeaBomb"
    });

    // Remove default menu for cleaner look (optional)
    win.setMenuBarVisibility(false);

    if (isDev) {
        // In dev, load the vite server
        win.loadURL('http://localhost:5173');
        // Open DevTools
        win.webContents.openDevTools();
    } else {
        // In prod, load the built index.html
        win.loadFile(path.join(__dirname, '../dist/index.html'));
    }
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
