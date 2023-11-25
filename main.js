const {app, globalShortcut, BrowserWindow, dialog, Menu} = require('electron');
const isDev = require('electron-is-dev');
const { autoUpdater } = require("electron-updater");
const DiscordRPC = require('discord-rpc');

const console = require('console');
app.console = new console.Console(process.stdout, process.stderr);

const path = require('path');
const { exit } = require('process');
var rpc;

try {
    let pluginName;

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
    //app.commandLine.appendSwitch("disable-http-cache");
    
    // Keep a global reference of the window object, if you don't, the window will
    // be closed automatically when the JavaScript object is garbage collected.
    autoUpdater.checkForUpdatesAndNotify();
    let mainWindow;
    var server = 'https://play.binweevils.net';

    const url = `${server}/update/${process.platform}/${app.getVersion()}`;
    
    Array.prototype.random = function () {
        return this[Math.floor((Math.random()*this.length))];
    }

    var userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 13_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/605.1.15 (KHTML, like Gecko)',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.105 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 12_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.2 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36 Edge/15.15063',
        'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 12_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.1 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.1 Safari/605.1.15'
    ];
    
    var Electrons = ['0.0.1', '0.10.1', '1.003.3', '0.232.4', '1.496.3', '3.78', '9.382'];
    
    function clearCache() {
        if(mainWindow != null)
        mainWindow.webContents.session.clearCache();
    }
    
    async function createWindow () {
        mainWindow = new BrowserWindow({
            width: 1920,
            height: 1080,
            backgroundColor: '#6BC414',
            title: "Bin Weevils Rewritten",
            icon: __dirname + '/favicon.ico',
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                plugins: true
            }
        });

        mainWindow.maximize();

        mainWindow.webContents.setZoomFactor(1.0);
        mainWindow.webContents.setVisualZoomLevelLimits(1, 5);
        mainWindow.webContents.setUserAgent(userAgents.random() +' Electron/v' + Electrons.random());
    
        //mainWindow.setMenu(null);
        mainWindow.webContents.session.clearCache();
    
        mainWindow.loadURL(server);
    
        // RICH PRESENCE START
        const clientId = '904829685064663090';
        DiscordRPC.register(clientId);
        const rpc = new DiscordRPC.Client({ transport: 'ipc' });
        const startTimestamp = new Date();

        rpc.on('ready', () => {
            rpc.setActivity({
                details: `Fall In, Flip Out!`,
                startTimestamp, 
                largeImageKey: `logo2`, 
                largeImageText: "Created with ♥ by Khoora & Alioth",
                buttons: [
                    {
                        "label": "Join Our Discord Server!",
                        "url": "https://discord.com/invite/F9F6zN8RhY"
                    }
                ]
            });
        });
        rpc.login({ clientId }).catch(console.error);

        mainWindow.on('closed', function () {
            mainWindow = null;
        });
    }

    app.on('ready', async () => {
        await createWindow();
           
        globalShortcut.register('CommandOrControl+=', () => {
            if (mainWindow) {
                const currentZoom = mainWindow.webContents.getZoomFactor();
                const newZoom = Math.min(currentZoom + 0.1, 5);
                mainWindow.webContents.setZoomFactor(newZoom);
            }
        });
    
        globalShortcut.register('CommandOrControl+-', () => {
            if (mainWindow) {
                const currentZoom = mainWindow.webContents.getZoomFactor();
                const newZoom = Math.max(currentZoom - 0.1, 0.5);
                mainWindow.webContents.setZoomFactor(newZoom);
            }
        });

        globalShortcut.register('F11', () => {
            if (mainWindow) {
                mainWindow.setFullScreen(!mainWindow.isFullScreen());
            }
        });

        const template = [
            { label: "AppVer: 1.0.4" }
        ];

        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
    });
    
    app.on('window-all-closed', function () {
      // On macOS it is common for applications and their menu bar
      // to stay active until the user quits explicitly with Cmd + Q
      if (process.platform !== 'darwin') app.quit();
    });
    
    app.on('activate', async function () {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) await createWindow();
    });

    app.on('will-quit', () => {
        // Unregister all shortcuts
        globalShortcut.unregisterAll();
    });

    //setInterval(clearCache, 600000);
}
catch(Exception) {
    app.quit();
    exit();
}