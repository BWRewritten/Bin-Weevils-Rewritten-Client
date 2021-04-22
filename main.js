const {app, BrowserWindow, dialog} = require('electron');
const isDev = require('electron-is-dev');
const { autoUpdater } = require("electron-updater");
const DiscordRPC = require('discord-rpc');

const console = require('console');
app.console = new console.Console(process.stdout, process.stderr);

//const {app, BrowserWindow} = require('electron');
const path = require('path');
var rpc = "";


let pluginName
switch (process.platform) {
    case 'win32':
        pluginName = 'flash/pepflashplayer64_32_0_0_303.dll'
        break
    case 'darwin':
        pluginName = 'flash/PepperFlashPlayer.plugin'
        break
    case 'linux':
        pluginName = 'flash/libpepflashplayer.so'
        break
}
app.commandLine.appendSwitch('ppapi-flash-path', path.join(__dirname, pluginName));
app.commandLine.appendSwitch("disable-http-cache");

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
autoUpdater.checkForUpdatesAndNotify();
let mainWindow;

const server = 'http://play.bwrewritten.com'
const url = `${server}/update/${process.platform}/${app.getVersion()}`

Array.prototype.random = function () {
    return this[Math.floor((Math.random()*this.length))];
}

var userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36', 'Mozilla/5.0 (Windows NT 5.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36', 'Mozilla/5.0 (Windows NT 6.2; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36', 
    'Mozilla/5.0 (iPhone; CPU iPhone OS 13_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1 Mobile/15E148 Safari/604.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/605.1.15 (KHTML, like Gecko)','Mozilla/5.0 (iPad; CPU OS 9_3_5 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Mobile/13G36', 
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36', 'Mozilla/4.0 (compatible; MSIE 6.0; Windows 98)', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.105 Safari/537.36', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 12_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.2 Mobile/15E148 Safari/604.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36 Edge/15.15063', 'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 12_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.1 Mobile/15E148 Safari/604.1','Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.0; .NET CLR 1.1.4322)','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.1 Safari/605.1.15'
];

var Electrons = ['0.0.1', '0.10.1', '1.003.3', '0.232.4', '1.496.3', '3.78', '9.382'];

function clearCache() {
    mainWindow.webContents.session.clearCache();
}

function createWindow () {
    mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        backgroundColor: '#6BC414',
        title: "Connecting...",
        icon: __dirname + '/favicon.ico',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            plugins: true
        }
    });
    mainWindow.maximize();
    mainWindow.webContents.setUserAgent(userAgents.random() +' Electron/v' +Electrons.random());

    mainWindow.setMenu(null);
    mainWindow.webContents.session.clearCache();

    mainWindow.loadURL('https://play.bwrewritten.com');

    // RICH PRESENCE START
    const clientId = '798226376003813475'; DiscordRPC.register(clientId); const rpc = new DiscordRPC.Client({ transport: 'ipc' }); const startTimestamp = new Date();
    rpc.on('ready', () => {
        rpc.setActivity({
            details: `Bin Weevils Rewritten`, 
            startTimestamp, 
            largeImageKey: `logo2`, 
            largeImageText: "Created by Darkk, HD, Jjs",
        });
    });
    rpc.login({ clientId }).catch(console.error);

    //mainWindow.webContents.openDevTools();

    mainWindow.on('closed', function () {
        mainWindow = null
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow();
});
setInterval(clearCache, 1*60*60);