const { app, BrowserWindow, screen, ipcMain, globalShortcut, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const { BUILT_IN_GALLERY } = require('./charm-draw.js');

const CHARMS_DIR = path.join(__dirname, 'charms');
const MANIFEST_PATH = path.join(CHARMS_DIR, 'gallery.json');   // the ONE editable list — built-ins + anything added
const STATE_PATH = path.join(CHARMS_DIR, 'session-state.json'); // what was hanging last time the app closed

// First run: seed the editable gallery from the built-in set so every charm — shipped
// or user-added — lives in the same file and can be edited/replaced/deleted the same way.
function readCustomManifest() {
  try { return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8')); }
  catch {
    const seeded = BUILT_IN_GALLERY.map((e) => ({ ...e }));
    writeCustomManifest(seeded);
    return seeded;
  }
}
function writeCustomManifest(list) {
  fs.mkdirSync(CHARMS_DIR, { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(list, null, 2));
}

function readState() {
  try { return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8')); }
  catch { return null; } // nothing saved yet — Studio falls back to its own defaults
}
function writeState(state) {
  fs.mkdirSync(CHARMS_DIR, { recursive: true });
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

let studioWin, overlayWin;

const OVERLAY_H = 700;

function createOverlay() {
  const { width } = screen.getPrimaryDisplay().workAreaSize;

  overlayWin = new BrowserWindow({
    width: width,   // full monitor width — no more cramped/cut-off range
    height: OVERLAY_H,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    hasShadow: false,
    resizable: false,
    skipTaskbar: true,
    focusable: false,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  overlayWin.setAlwaysOnTop(true, 'screen-saver');
  // ignore clicks (pass through to apps below) but still forward mousemove to us,
  // so the renderer can detect hovering over a charm and ask to stop ignoring.
  overlayWin.setIgnoreMouseEvents(true, { forward: true });
  overlayWin.loadFile('overlay.html');
}

function createStudio() {
  studioWin = new BrowserWindow({
    width: 620,
    height: 820,
    title: 'Charm Studio',
    backgroundColor: '#15120f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  studioWin.loadFile('studio.html');
}

// Relay charm config changes from Studio -> Overlay
ipcMain.on('charm:update', (event, config) => {
  if (overlayWin) overlayWin.webContents.send('charm:update', config);
});

// Overlay asks for the cursor position (it has no direct access to the screen module)
ipcMain.handle('cursor:get', () => screen.getCursorScreenPoint());

// Overlay toggles this as the cursor enters/leaves a charm, so clicks only get
// "caught" (for dragging) while actually over a charm; everywhere else stays click-through.
ipcMain.on('overlay:setIgnoreMouse', (event, ignore) => {
  if (overlayWin) overlayWin.setIgnoreMouseEvents(ignore, { forward: true });
});

// Studio asks to open the charms/ folder directly in the OS file explorer, so there's
// never a question of where to drop a new picture in.
ipcMain.on('charms:openFolder', () => {
  shell.openPath(CHARMS_DIR);
});

// Studio asks for every custom charm the user has saved so far, to merge into the gallery.
ipcMain.handle('charms:listCustom', () => readCustomManifest());

// Permanently save an imported image into charms/ and record it (name + category) so it
// shows up in the gallery every time the app opens, not just for this session.
ipcMain.handle('charms:saveCustom', (event, { dataUrl, label, category }) => {
  const list = readCustomManifest();
  const slug = (label || 'charm').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-+|-+$)/g, '') || 'charm';

  fs.mkdirSync(CHARMS_DIR, { recursive: true });
  let filename = `custom-${slug}.png`, n = 1;
  while (fs.existsSync(path.join(CHARMS_DIR, filename))) filename = `custom-${slug}-${++n}.png`;

  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  fs.writeFileSync(path.join(CHARMS_DIR, filename), Buffer.from(base64, 'base64'));

  const entry = {
    key: `custom-${slug}-${Date.now()}`,
    label: label || 'My charm',
    category: category || 'Classic',
    meaning: 'Added by you',
    file: `charms/${filename}`,
  };
  list.push(entry);
  writeCustomManifest(list);
  return entry;
});

// Edit a saved charm's name/category (fixes a wrong category without re-uploading)
ipcMain.handle('charms:updateCustom', (event, { key, label, category }) => {
  const list = readCustomManifest();
  const entry = list.find((e) => e.key === key);
  if (!entry) return null;
  if (label) entry.label = label;
  if (category) entry.category = category;
  writeCustomManifest(list);
  return entry;
});

// Swap the picture for an existing saved charm, keeping its name/category/key
ipcMain.handle('charms:replaceCustomImage', (event, { key, dataUrl }) => {
  const list = readCustomManifest();
  const entry = list.find((e) => e.key === key);
  if (!entry) return null;
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  fs.writeFileSync(path.join(__dirname, entry.file), Buffer.from(base64, 'base64'));
  return entry;
});

// Delete a saved charm entirely (manifest entry + its file on disk)
ipcMain.handle('charms:deleteCustom', (event, key) => {
  const list = readCustomManifest();
  const idx = list.findIndex((e) => e.key === key);
  if (idx === -1) return false;
  const [removed] = list.splice(idx, 1);
  writeCustomManifest(list);
  try { fs.unlinkSync(path.join(__dirname, removed.file)); } catch { /* best effort */ }
  return true;
});

// Studio saves the full current scene (charm count, positions, designs, rope style)
// every time something changes, so the exact same setup is there next time it opens.
ipcMain.on('state:save', (event, state) => { writeState(state); });
ipcMain.handle('state:load', () => readState());

app.whenReady().then(() => {
  createOverlay();
  createStudio();
  globalShortcut.register('CommandOrControl+Shift+Q', () => app.quit());
});

app.on('window-all-closed', () => app.quit());
