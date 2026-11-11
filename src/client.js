const { app, BrowserWindow, Menu, dialog, shell, powerSaveBlocker } = require("electron");
const settings = require("./settings");
const duration = require("./duration");
const presence = require("./presence");
const updater = require("./updater");
const splash = require("./splash/splash-window");
const chromium = require("./chromium");
const MainWindow = require("./main-window");
const Shortcuts = require("./shortcuts");
const CacheManager = require("./cache");
const UsernameTracker = require("./username");
const DownloadGuard = require("./download-guard");
const pinning = require("./pinning");
const signing = require("./signing");
const { SHOW_MENU_BAR, ZOOM } = require("./config");
const { delay, timeout } = require("./utils");
const { logError } = require("./logger");
const { createMenuWindow } = require("./menu/menu-window");
const createMenuLogic = require("./menu/actions");

class Client {
    constructor() {
        this.quitting = false;
        this.splash = null;

        this.ctx = this.createMenuContext();
        this.menu = createMenuWindow(this.ctx, createMenuLogic(this.ctx));
        this.username = new UsernameTracker(() => this.onUsernameChange());

        this.main = new MainWindow({
            getZoom: () => settings.data.zoom,
            onFocus: () => this.shortcuts.register(),
            onBlur: () => this.shortcuts.unregister(),
            onClosed: () => {
                this.shortcuts.unregister();
                this.menu.close();
            },
            onFullscreenChange: () => this.menu.pushState(),
            onGamePage: () => this.username.read(),
            onInput: (event, input) => this.shortcuts.handleInput(event, input)
        });

        this.shortcuts = new Shortcuts({
            binds: () => settings.data.keybinds,
            canRegister: () => this.main.alive() && !this.quitting,
            actions: {
                menu: { gap: 400, run: () => this.menu.toggle() },
                fullscreen: { gap: 400, run: () => this.main.setFullscreen(!this.main.isFullscreen()) },
                reload: { gap: 1000, run: () => this.reloadPage() },
                zoomIn: { gap: 50, run: () => this.zoomBy(ZOOM.step) },
                zoomOut: { gap: 50, run: () => this.zoomBy(-ZOOM.step) }
            }
        });

        this.cache = new CacheManager({
            settings,
            main: this.main,
            dialogParent: () => this.ctx.dialogParent(),
            closeMenu: () => this.menu.close(),
            isQuitting: () => this.quitting
        });

        this.downloadGuard = new DownloadGuard(this.main);
    }

    createMenuContext() {
        const ctx = {
            settings,
            updater,
            duration,
            updateStatus: "",
            icon: chromium.windowIcon,
            win: () => this.main.get(),
            dialogParent: () => this.menu.getWindow() || this.main.get() || undefined,
            getUsername: () => this.username.get(),
            getZoom: () => settings.data.zoom,
            isFullscreen: () => this.main.isFullscreen(),
            setZoom: (factor) => this.setZoom(factor),
            zoomBy: (delta) => this.zoomBy(delta),
            setFullscreen: (on) => this.main.setFullscreen(on),
            clearCacheWithLogout: () => this.cache.clearWithLogout(),
            scheduleAutoClear: () => this.cache.schedule(),
            refreshPresence: () => this.refreshPresence(),
            setUpdateStatus: (text) => {
                ctx.updateStatus = text;
                this.menu.pushState();
            }
        };

        return ctx;
    }

    setZoom(factor) {
        const zoom = Math.min(ZOOM.max, Math.max(ZOOM.min, Math.round(factor * 100) / 100));
        settings.data.zoom = zoom;
        settings.save();
        this.main.applyZoom(zoom);
        this.menu.pushState();
    }

    zoomBy(delta) {
        this.setZoom(settings.data.zoom + delta);
    }

    reloadPage() {
        const focused = BrowserWindow.getFocusedWindow();
        const target = focused && focused !== this.menu.getWindow() ? focused : this.main.get();

        if (target && !target.isDestroyed())
            target.webContents.reload();
    }

    refreshPresence() {
        presence.configure({
            enabled: settings.data.discordEnabled,
            showName: settings.data.discordShowName,
            name: this.username.get()
        });
    }

    onUsernameChange() {
        this.refreshPresence();
        this.menu.pushState();
    }

    applyAppMenu() {
        const openMenu = () => this.menu.toggle();

        if (process.platform === "darwin") {
            Menu.setApplicationMenu(
                Menu.buildFromTemplate([{ role: "appMenu" }, { role: "editMenu" }, { label: "BWR", submenu: [{ label: "Open BWR Menu", click: openMenu }] }])
            );
        } else if (SHOW_MENU_BAR) {
            Menu.setApplicationMenu(Menu.buildFromTemplate([{ label: "BWR Menu", click: openMenu }]));
        } else {
            Menu.setApplicationMenu(null);
        }
    }

    async promptManualUpdate(update) {
        const parent = this.main.get();

        if (!parent)
            return;

        try {
            const { response } = await dialog.showMessageBox(parent, {
                type: "info",
                buttons: ["Open download page", "Later"],
                defaultId: 0,
                cancelId: 1,
                title: "Update Available",
                message: `Version ${update.version} is available (you have ${app.getVersion()}).`,
                detail: "This install cannot update itself automatically. Please download the new version."
            });

            if (response === 0 && !this.quitting)
                shell.openExternal(updater.RELEASES_URL);
        } catch (e) {
            logError(e);
        }
    }

    onPinFailure(hostname) {
        logError(new Error("certificate pin check failed for " + hostname));

        if (this.pinNoticeShown || this.quitting)
            return;

        this.pinNoticeShown = true;

        setImmediate(() => {
            dialog
                .showMessageBox(this.main.get() || undefined, {
                    type: "error",
                    title: "Secure Connection Failed",
                    message: "BWR could not verify a secure connection to the game servers.",
                    detail:
                        "Something on this computer or network is intercepting the connection. " +
                        'This is usually an antivirus "HTTPS / web scanning" feature, a web filter, or a proxy tool. ' +
                        "Turn it off or add an exception for binweevils.app, then restart the game. " +
                        "If this keeps happening, check for a newer version of the client."
                })
                .catch(logError);
        });
    }

    async startup() {
        pinning.install((hostname) => this.onPinFailure(hostname));
        signing.install();
        this.downloadGuard.watch();
        this.username.watch();
        this.applyAppMenu();

        const sp = splash.show(chromium.windowIcon());
        this.splash = sp;
        await sp.ready;
        const aborted = () => this.quitting || sp.isClosed();

        let pendingUpdate = null;

        if (app.isPackaged && !aborted()) {
            pendingUpdate = await updater.runLaunchUpdate(sp);

            if (pendingUpdate && pendingUpdate.installing)
                return;
        }

        if (aborted())
            return app.quit();

        sp.status(`Starting BWR v${app.getVersion()}`, null);

        if (signing.enabled())
            await timeout(signing.syncClock(), 4000).catch(() => {});

        await delay(500);

        if (aborted())
            return app.quit();

        this.main.create();
        powerSaveBlocker.start("prevent-app-suspension");
        this.refreshPresence();
        this.cache.schedule();
        sp.close();

        if (pendingUpdate)
            await this.promptManualUpdate(pendingUpdate);
    }

    onStartupError(err) {
        logError(err);

        if (this.splash)
            this.splash.close();

        if (this.quitting || this.main.alive())
            return;

        try {
            this.main.create();
        } catch (e) {
            logError(e);
            app.quit();
        }
    }

    start() {
        app.on("second-instance", () => this.main.restoreAndFocus());
        app.on("ready", () => this.startup().catch((err) => this.onStartupError(err)));

        app.on("window-all-closed", () => {
            if (process.platform !== "darwin")
                app.quit();
        });

        app.on("activate", () => {
            if (!this.main.alive() && app.isReady() && !this.quitting)
                this.main.create();
        });

        app.on("before-quit", () => {
            this.quitting = true;
            this.cache.stop();
        });

        app.on("will-quit", () => {
            this.shortcuts.unregister();
            presence.shutdown();
        });
    }
}

module.exports = Client;
