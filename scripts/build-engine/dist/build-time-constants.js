"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBuildModeConstantNames = exports.getPlatformConstantNames = exports.setupBuildTimeConstants = void 0;
/**
 * @deprecated since v4.3.0, use `StatsQuery.prototype.constantManager` instead.
 */
function setupBuildTimeConstants({ mode, platform, flags, }) {
    const buildModeConstantNames = getBuildModeConstantNames();
    const platformConstantNames = getPlatformConstantNames();
    const result = {};
    platformConstantNames.forEach(name => result[name] = false);
    buildModeConstantNames.forEach(name => result[name] = false);
    if (mode) {
        if (!buildModeConstantNames.includes(mode)) {
            console.warn(`Unknown build mode constant: ${mode}`);
        }
        result[mode] = true;
    }
    if (!platformConstantNames.includes(platform)) {
        console.warn(`Unknown platform constant: ${platform}`);
    }
    result[platform] = true;
    Object.assign(result, flags);
    result.DEV = result.EDITOR || result.PREVIEW || result.TEST;
    result.DEBUG = result.DEBUG || result.DEV;
    result.RUNTIME_BASED = result.OPPO || result.VIVO || result.HUAWEI || result.COCOSPLAY || result.LINKSURE || result.QTT;
    result.MINIGAME = result.WECHAT || result.ALIPAY || result.XIAOMI || result.BYTEDANCE || result.BAIDU;
    result.JSB = result.NATIVE;
    result.SUPPORT_JIT = !(result.MINIGAME || result.RUNTIME_BASED);
    return result;
}
exports.setupBuildTimeConstants = setupBuildTimeConstants;
function getPlatformConstantNames() {
    return ['HTML5', 'WECHAT', 'ALIPAY', 'BAIDU', 'XIAOMI', 'BYTEDANCE', 'OPPO', 'VIVO', 'HUAWEI', 'NATIVE', 'COCOSPLAY', 'LINKSURE', 'QTT'];
}
exports.getPlatformConstantNames = getPlatformConstantNames;
function getBuildModeConstantNames() {
    return ['EDITOR', 'PREVIEW', 'BUILD', 'TEST'];
}
exports.getBuildModeConstantNames = getBuildModeConstantNames;
//# sourceMappingURL=build-time-constants.js.map