"use strict";

class Platform {
    constructor(name, buildConfigurationKey, nodeName) {
        this.name = name;
        this.buildConfigurationKey = buildConfigurationKey;
        this.nodeName = nodeName;
    }
    toString() {
        return this.name;
    }
    static fromString(name) {
        switch (name) {
            case Platform.OSX.nodeName:
            case Platform.OSX.name:
                return Platform.OSX;
            case Platform.WINDOWS.nodeName:
            case Platform.WINDOWS.name:
            case Platform.WINDOWS.buildConfigurationKey:
                return Platform.WINDOWS;
            case Platform.LINUX.nodeName:
                return Platform.LINUX;
        }
        throw new Error("Unknown platform: " + name);
    }
}
Platform.OSX = new Platform("osx", "osx", "darwin");
Platform.LINUX = new Platform("linux", "linux", "linux");
Platform.WINDOWS = new Platform("windows", "win", "win32");
exports.Platform = Platform;
function getProductName(metadata, devMetadata) {
    return devMetadata.build.productName || metadata.productName || metadata.name;
}
exports.getProductName = getProductName;
//# sourceMappingURL=metadata.js.map