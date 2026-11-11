const { execFileSync } = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const bytenode = require("bytenode");

const root = path.join(__dirname, "..");
const localFile = path.join(root, ".build-secret");
const srcFile = path.join(root, "src", "signing.js");
const genFile = path.join(root, "src", "signing.gen.js");
const jscFile = path.join(root, "src", "signing.jsc");
const archFile = path.join(root, "src", "signing.arch.gen.js");
const legacyFiles = ["build-secret.js", "build-secret.jsc", "build-secret.gen.js"].map((f) => path.join(root, "src", f));
const version = require(path.join(root, "package.json")).version;

const targetArch = process.env.BUILD_ARCH || process.arch;

const electronArch = execFileSync(require("electron"), ["-p", "process.arch"], { env: Object.assign({}, process.env, { ELECTRON_RUN_AS_NODE: "1" }) })
    .toString()
    .trim();

if (electronArch !== targetArch) {
    console.error(
        `node_modules/electron is ${electronArch} but the build target is ${targetArch}. ` +
            `Reinstall Electron for ${targetArch} first (delete node_modules/electron/dist, then run ` +
            `node node_modules/electron/install.js with npm_config_arch=${targetArch}).`
    );

    process.exit(1);
}

if (process.argv.includes("--new")) {
    fs.writeFileSync(localFile, crypto.randomBytes(32).toString("hex") + "\n");
    console.log("Created a new key in .build-secret");
}

let secret = (process.env.BWR_BUILD_SECRET || "").trim();

if (!secret && fs.existsSync(localFile))
    secret = fs.readFileSync(localFile, "utf8").trim();

if (!/^[0-9a-f]{64}$/i.test(secret)) {
    console.error("No valid build secret found. Set BWR_BUILD_SECRET (64 hex characters) " + "or run: node scripts/write-build-secret.js --new");
    process.exit(1);
}

const key = Buffer.from(secret.toLowerCase(), "hex");
const mask = crypto.randomBytes(key.length);
const masked = Buffer.alloc(key.length);

for (let i = 0; i < key.length; i++)
    masked[i] = key[i] ^ mask[i];

const arr = (buf) => "[" + Array.from(buf).join(",") + "]";

const keyBlock =
    "const key = (() => {\n" +
    "  const d = " +
    arr(masked) +
    ";\n" +
    "  const m = " +
    arr(mask) +
    ";\n" +
    "  const b = Buffer.alloc(d.length);\n" +
    "  for (let i = 0; i < d.length; i++) b[i] = d[i] ^ m[i];\n" +
    "  return b;\n" +
    "})();";

const source = fs.readFileSync(srcFile, "utf8");
const marker = /\/\/ @key-start[\s\S]*?\/\/ @key-end/;

if (!marker.test(source)) {
    console.error("src/signing.js is missing the // @key-start ... // @key-end block.");
    process.exit(1);
}

fs.writeFileSync(
    genFile,
    source.replace(marker, () => keyBlock)
);

bytenode
    .compileFile({ filename: genFile, output: jscFile, electron: true })
    .then(() => {
        fs.unlinkSync(genFile);

        legacyFiles.forEach((f) => {
            if (fs.existsSync(f))
                fs.unlinkSync(f);
        });

        fs.writeFileSync(archFile, targetArch);
        console.log(`Wrote src/signing.jsc for version ${version} (${targetArch})`);
    })
    .catch((err) => {
        try {
            fs.unlinkSync(genFile);
        } catch (e) {}

        console.error("Failed to compile src/signing.jsc:", err);
        process.exit(1);
    });
