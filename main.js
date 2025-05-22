const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');

// Electron Store tanımlaması - verileri saklama için
const store = new Store({
  name: 'mola-planlama-verileri'
});

// Varsayılan pencere oluşturma fonksiyonu
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'public', 'favicon.ico')
  });

  // HTML dosyasını yükle
  mainWindow.loadFile(path.join(__dirname, 'public', 'index.html'));
  
  // Developer araçlarını açma (hata ayıklama için)
  // mainWindow.webContents.openDevTools();
}

// Electron hazır olduğunda pencere oluştur
app.whenReady().then(() => {
  createWindow();
  
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Tüm pencereler kapatıldığında uygulamayı kapat
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// IPC İletişim Kanalları (Renderer ve Main Process arasında veri alışverişi)
ipcMain.handle('veri-kaydet', (event, key, data) => {
  store.set(key, data);
  return { success: true };
});

ipcMain.handle('veri-getir', (event, key) => {
  return store.get(key);
});

ipcMain.handle('dosya-kaydet', async (event, options) => {
  const { filePath } = await dialog.showSaveDialog({
    title: 'Kaydet',
    defaultPath: options.defaultPath,
    filters: options.filters
  });
  
  if (filePath) {
    try {
      fs.writeFileSync(filePath, options.data);
      return { success: true, filePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  return { success: false, canceled: true };
});