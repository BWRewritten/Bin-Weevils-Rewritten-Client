module.exports = {
    SHOW_MENU_BAR: false,
    FLASH_VERSION: "32.0.0.303",
    FLASH_FILES: {
        win32: process.arch === "x64" ? "pepflashplayer64_32_0_0_303.dll" : "pepflashplayer32_32_0_0_303.dll",
        darwin: "PepperFlashPlayer.plugin",
        linux: "libpepflashplayer.so"
    },
    ZOOM: { step: 0.1, min: 0.25, max: 5 },
    USERNAME_COOKIE: "weevil_name",
    GAME_URL_FRAGMENT: "binweevils.app/game"
};
