const crypto = require("crypto");
const { session } = require("electron");
const { isInternalHost } = require("./urls");

const ROOT_CA_PINS = {
    "Let's Encrypt - ISRG Root X1": "C5+lpZ7tcVwmwQIMcRtPbsQtWLABXhQzejna0wHFr8M=",
    "Let's Encrypt - ISRG Root X2": "diGVwiVYbubAI3RW4hB9xU8e/CH2GnkuvVFZE8zmgzI=",
    "Google Trust Services - GTS Root R1": "hxqRlPTu1bMS/0DITB1SSu0vd4u/8l8TjPgfaAp63Gc=",
    "Google Trust Services - GTS Root R2": "Vfd95BwDeSQo+NUYxVEEIlvkOlWY2SalKK1lPhzOx78=",
    "Google Trust Services - GTS Root R3": "QXnt2YHvdHR3tJYmQIr0Paosp6t/nggsEGD4QJZ3Q0g=",
    "Google Trust Services - GTS Root R4": "mEflZT5enoR1FuXLgYYGqnVEoZvmf9c2bVBpiOjYQ0c=",
    "SSL.com Root Certification Authority RSA": "0cRTd+vc1hjNFlHcLgLCHXUeWqn80bNDH/bs9qMTSPo=",
    "SSL.com Root Certification Authority ECC": "oyD01TTXvpfBro3QSZc1vIlcMjrdLTiL/M9mLCPX+Zo=",
    "SSL.com TLS RSA Root CA 2022": "K89VOmb1cJAN3TK6bf4ezAbJGC1mLcG2Dh97dnwr3VQ=",
    "SSL.com TLS ECC Root CA 2022": "G/ANXI8TwJTdF+AFBM8IiIUPEv0Gf6H5LA/b9guG4yE="
};

const PINS = new Set(Object.values(ROOT_CA_PINS));

const MAX_CHAIN = 10;
const hashCache = new Map();
const debugSeen = new Set();

function spkiHash(cert) {
    if (hashCache.has(cert.fingerprint))
        return hashCache.get(cert.fingerprint);

    let hash = null;

    try {
        const der = crypto.createPublicKey(cert.data).export({ type: "spki", format: "der" });
        hash = crypto.createHash("sha256").update(der).digest("base64");
    } catch (e) {}

    hashCache.set(cert.fingerprint, hash);

    return hash;
}

function chainOf(certificate) {
    const chain = [];
    let cert = certificate;

    while (cert && chain.length < MAX_CHAIN) {
        chain.push(cert);
        cert = cert.issuerCert;
    }

    return chain;
}

function debug(hostname, verdict, chain) {
    if (!process.env.BWR_DEBUG || debugSeen.has(hostname))
        return;

    debugSeen.add(hostname);
    console.log(`pin: ${hostname} ${verdict}`);
    chain.forEach((cert) => console.log(`pin:   ${cert.subjectName} ${spkiHash(cert)}`));
}

function install(onFailure) {
    session.defaultSession.setCertificateVerifyProc((request, callback) => {
        if (!isInternalHost(request.hostname))
            return callback(-3);

        if (request.verificationResult !== "net::OK")
            return callback(-3);

        let pinned = false;
        let chain = [];

        try {
            chain = chainOf(request.certificate);
            pinned = chain.some((cert) => PINS.has(spkiHash(cert)));
        } catch (e) {}

        debug(request.hostname, pinned ? "OK" : "REJECTED", chain);

        if (pinned)
            return callback(0);

        try {
            onFailure(request.hostname);
        } catch (e) {}

        callback(-2);
    });
}

module.exports = { install };
