const { contextBridge, ipcRenderer } = require('electron');

// Renderer işlemine açık API'ları tanımla
contextBridge.exposeInMainWorld('electronAPI', {
  veriKaydet: (key, data) => ipcRenderer.invoke('veri-kaydet', key, data),
  veriGetir: (key) => ipcRenderer.invoke('veri-getir', key),
  dosyaKaydet: (options) => ipcRenderer.invoke('dosya-kaydet', options)
});