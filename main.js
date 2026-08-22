const {app, globalShortcut, BrowserWindow, dialog, Menu} = require('electron');
const DiscordRPC = require('discord-rpc');

const console = require('console');
app.console = new console.Console(process.stdout, process.stderr);

const path = require('path');
const { exit } = require('process');

try {
    let sysPlatform = process.platform;
    let pluginNamePath;
    let basename = path.basename(__dirname);

    switch(sysPlatform) {
        case 'win32':
            let arch = process.arch;

            if(basename === "app") {
                pluginNamePath = path.join(__dirname, 'assets', 'flash', `pepflashplayer${arch === "x64" ? "64" : "32"}_32_0_0_303.dll`);
                break;
            }

            pluginNamePath = path.join(__dirname, 'assets', 'flash', `pepflashplayer${arch === "x64" ? "64" : "32"}_32_0_0_303.dll`);
            break;
        case 'darwin':
            if(basename === "app") {
                pluginNamePath = path.join(__dirname, 'flash', 'PepperFlashPlayer.plugin');
                break;
            }

            pluginNamePath = path.join('flash', 'PepperFlashPlayer.plugin');
            break;
        case 'linux':
            app.commandLine.appendSwitch('no-sandbox');

            if(basename === "app") {
                pluginNamePath = path.join(__dirname, 'assets', 'flash', 'libpepflashplayer.so');
                break;
            }

            pluginNamePath = path.join('assets', 'flash', 'libpepflashplayer.so');
            break;
    }

    app.commandLine.appendSwitch('ppapi-flash-path', pluginNamePath);
    app.commandLine.appendSwitch('ppapi-flash-version', '32.0.0.303');
    //app.commandLine.appendSwitch("disable-http-cache");
    
    // Keep a global reference of the window object, if you don't, the window will
    // be closed automatically when the JavaScript object is garbage collected.
    //autoUpdater.checkForUpdatesAndNotify();
    let mainWindow;
    const server = 'https://play.binweevils.app/';
    //const url = `${server}/update/${process.platform}/${app.getVersion()}`;
    
    Array.prototype.random = function () {
        return this[Math.floor((Math.random()*this.length))];
    }

    const userAgents = [
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
    
    const Electrons = ['0.0.1', '0.10.1', '1.003.3', '0.232.4', '1.496.3', '3.78', '9.382', '11.0.0'];
    
    async function createWindow () {
        if(!mainWindow) {
            mainWindow = new BrowserWindow({
                width: 1920,
                height: 1080,
                backgroundColor: '#6BC414',
                title: `Loading BWR v${app.getVersion()} ...`,
                icon: sysPlatform === 'linux' ? path.join(__dirname, 'icon.png') : sysPlatform === 'darwin' ? path.join(__dirname, 'icon.icns') : path.join(__dirname, 'assets', 'favicon.ico'),
                webPreferences: {
                    preload: path.join(__dirname, 'preload.js'),
                    plugins: true,
                }
            });
    
            mainWindow.maximize();
            mainWindow.webContents.setZoomFactor(1.0);
            mainWindow.webContents.setVisualZoomLevelLimits(1, 5);
            mainWindow.webContents.setUserAgent(userAgents.random() +' Electron/v' + Electrons.random());
            // mainWindow.webContents.session.loadExtension(pluginNamePath)
            // .catch(err => dialog.showMessageBox(mainWindow, {
            //     type: 'error',
            //     title: 'error caught | show to developers',
            //     message: err.toString() + '\n\n' + __dirname + '\n\n' + pluginNamePath
            // }));
        
            mainWindow.loadURL(server);

            // dialog.showMessageBox(mainWindow, {
            //     type: 'info',
            //     title: 'FLASH PATH TEST',
            //     message: pluginNamePath + ' || Base: ' + basename
            // });
        
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
                            "url": "https://discord.com/binweevils"
                        }
                    ]
                });
            });
            rpc.login({ clientId }).catch(console.error);
    
            mainWindow.on('closed', function () {
                mainWindow = null;
            });
        }
    }

    app.on('ready', async () => {
        await createWindow();
           
        if(sysPlatform !== 'darwin') {
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
                { label: "AppVer: 1.0.4" },
                {
                    label: "Clear Cache",
                    click: function() {
                        if (mainWindow !== null) {
                            mainWindow.webContents.session.clearCache().then(() => {
                                dialog.showMessageBox(mainWindow, {
                                    type: 'info',
                                    title: 'Cache Cleared',
                                    message: 'You will now be logged out.',
                                });
                            mainWindow.loadURL(server);
                            });
                        }
                    }
                },
                {
                    label: "DEV Tools",
                    click: function() {
                        if(mainWindow !== null) {
                            mainWindow.webContents.openDevTools();
                            dialog.showMessageBox(mainWindow, {
                                type: 'warning',
                                title: 'NOTICE',
                                message: 'DEV Tools are to be used to troubleshoot and report bugs and such to the BWR Team. Any attempts to exploit for benefiticial gain either for yourself or others could lead to a permanent ban on your accounts.',
                            });
                        }
                    }
                }
            ];

            const menu = Menu.buildFromTemplate(template);
            Menu.setApplicationMenu(menu);
        }
        else
        Menu.setApplicationMenu(null);
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
}
catch(Exception) {
    app.quit();
    exit();
}
