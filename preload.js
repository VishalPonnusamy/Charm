const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('charmAPI', {
  send: (config) => ipcRenderer.send('charm:update', config),
  onUpdate: (callback) => ipcRenderer.on('charm:update', (_e, config) => callback(config)),
  getCursor: () => ipcRenderer.invoke('cursor:get'),
  setIgnoreMouse: (ignore) => ipcRenderer.send('overlay:setIgnoreMouse', ignore),
  openCharmsFolder: () => ipcRenderer.send('charms:openFolder'),
  listCustomCharms: () => ipcRenderer.invoke('charms:listCustom'),
  saveCustomCharm: (payload) => ipcRenderer.invoke('charms:saveCustom', payload),
  updateCustomCharm: (payload) => ipcRenderer.invoke('charms:updateCustom', payload),
  replaceCustomCharmImage: (payload) => ipcRenderer.invoke('charms:replaceCustomImage', payload),
  deleteCustomCharm: (key) => ipcRenderer.invoke('charms:deleteCustom', key),
  saveState: (state) => ipcRenderer.send('state:save', state),
  loadState: () => ipcRenderer.invoke('state:load'),
});
