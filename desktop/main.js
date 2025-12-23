const { app, BrowserWindow } = require('electron')
const path = require('path')
const isDev = process.env.NODE_ENV === 'development'

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    })

    // development mode-da localhost-u yüklə, production-da dist qovluğunu
    const startUrl = isDev
        ? 'http://localhost:5173'
        : `file://${path.join(__dirname, '../web/dist/index.html')}`

    mainWindow.loadURL(startUrl)

    if (isDev) {
        mainWindow.webContents.openDevTools()
    }
}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})
