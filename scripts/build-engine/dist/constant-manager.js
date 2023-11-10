"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConstantManager = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
class ConstantManager {
    constructor(engineRoot) {
        this._engineRoot = engineRoot;
    }
    //#region export string
    exportDynamicConstants({ mode, platform, flags, }) {
        const config = this._getConfig();
        // init helper
        let result = '';
        if (this._hasCCGlobal(config)) {
            result += fs_extra_1.default.readFileSync(path_1.default.join(__dirname, '../static/helper-global-exporter.txt'), 'utf8') + '\n';
        }
        if (this._hasDynamic(config)) {
            result += fs_extra_1.default.readFileSync(path_1.default.join(__dirname, '../static/helper-dynamic-constants.txt'), 'utf8') + '\n';
        }
        // update value
        if (config[mode]) {
            config[mode].value = true;
        }
        else {
            console.warn(`Unknown mode: ${mode}`);
        }
        if (config[platform]) {
            config[platform].value = true;
        }
        else {
            console.warn(`Unknown platform: ${platform}`);
        }
        for (const key in flags) {
            const value = flags[key];
            if (config[key]) {
                config[key].value = value;
            }
            else {
                console.warn(`Unknown flag: ${key}`);
            }
        }
        // eval value
        for (const key in config) {
            const info = config[key];
            if (typeof info.value === 'string') {
                info.value = this._evalExpression(info.value, config);
            }
        }
        // generate export content
        for (const key in config) {
            const info = config[key];
            const value = info.value;
            if (info.dynamic || info.internal) {
                continue;
            }
            result += `export const ${key} = ${value};\n`;
            if (info.ccGlobal) {
                result += `tryDefineGlobal('CC_${key}', ${value});\n`;
            }
            result += '\n';
        }
        return result;
    }
    genBuildTimeConstants(options) {
        const config = this._getConfig();
        this._applyOptionsToConfig(config, options);
        // generate json object
        const jsonObj = {};
        for (const key in config) {
            const info = config[key];
            jsonObj[key] = info.value;
        }
        if (typeof options.forceJitValue !== 'undefined') {
            jsonObj['SUPPORT_JIT'] = options.forceJitValue;
        }
        return jsonObj;
    }
    genCCEnvConstants(options) {
        const config = this._getConfig();
        this._applyOptionsToConfig(config, options);
        // generate json object
        const jsonObj = {};
        for (const key in config) {
            const info = config[key];
            if (!info.internal) {
                jsonObj[key] = info.value;
            }
        }
        return jsonObj;
    }
    exportStaticConstants({ mode, platform, flags, forceJitValue, }) {
        const config = this._getConfig();
        // init helper
        let result = '';
        if (this._hasCCGlobal(config)) {
            result += fs_extra_1.default.readFileSync(path_1.default.join(__dirname, '../static/helper-global-exporter.txt'), 'utf8') + '\n';
        }
        // update value
        if (config[mode]) {
            config[mode].value = true;
        }
        else {
            console.warn(`Unknown mode: ${mode}`);
        }
        if (config[platform]) {
            config[platform].value = true;
        }
        else {
            console.warn(`Unknown platform: ${platform}`);
        }
        for (const key in flags) {
            const value = flags[key];
            if (config[key]) {
                config[key].value = value;
            }
            else {
                console.warn(`Unknown flag: ${key}`);
            }
        }
        // eval value
        for (const key in config) {
            const info = config[key];
            if (typeof info.value === 'string') {
                info.value = this._evalExpression(info.value, config);
            }
        }
        if (typeof forceJitValue !== 'undefined') {
            const info = config['SUPPORT_JIT'];
            info.value = forceJitValue;
        }
        // generate export content
        for (const key in config) {
            const info = config[key];
            const value = info.value;
            result += `export const ${key} = ${value};\n`;
            if (info.ccGlobal) {
                result += `tryDefineGlobal('CC_${key}', ${value});\n`;
            }
            result += '\n';
        }
        return result;
    }
    //#endregion export string
    //#region declaration
    genInternalConstants() {
        const config = this._getConfig();
        let result = `declare module 'internal:constants'{\n`;
        for (const name in config) {
            const info = config[name];
            result += this._genConstantDeclaration(name, info);
        }
        result += '}\n';
        return result;
    }
    genCCEnv() {
        const config = this._getConfig();
        let result = `declare module 'cc/env'{\n`;
        for (const name in config) {
            const info = config[name];
            if (info.internal) {
                continue;
            }
            result += this._genConstantDeclaration(name, info);
        }
        result += '}\n';
        return result;
    }
    _genConstantDeclaration(name, info) {
        let result = '\t/**\n';
        let comments = info.comment.split('\n');
        for (const comment of comments) {
            result += `\t * ${comment}\n`;
        }
        result += '\t */\n';
        result += `\texport const ${name}: ${info.type};\n\n`;
        return result;
    }
    //#endregion declaration
    //#region utils
    _getConfig() {
        const engineConfig = fs_extra_1.default.readJsonSync(path_1.default.join(this._engineRoot, './cc.config.json').replace(/\\/g, '/'));
        const config = engineConfig.constants;
        // init default value
        for (const key in config) {
            const info = config[key];
            if (typeof info.ccGlobal === 'undefined') {
                info.ccGlobal = false;
            }
            if (typeof info.dynamic === 'undefined') {
                info.dynamic = false;
            }
        }
        return config;
    }
    _hasCCGlobal(config) {
        for (let key in config) {
            const info = config[key];
            if (info.ccGlobal) {
                return true;
            }
        }
        return false;
    }
    _hasDynamic(config) {
        for (let key in config) {
            const info = config[key];
            if (info.dynamic) {
                return true;
            }
        }
        return false;
    }
    _evalExpression(expression, config) {
        // eval sub expression
        const matchResult = expression.match(/(?<=\$)\w+/g);
        if (matchResult) {
            for (let name of matchResult) {
                const value = config[name].value;
                if (typeof value === 'string') {
                    config[name].value = this._evalExpression(value, config);
                }
            }
        }
        // $EDITOR to $EDITOR.value
        expression = expression.replace(/(?<=\$)(\w+)/g, '$1.value');
        // $EDITOR to $.EDITOR.value
        expression = expression.replace(/\$/g, '$.');
        // do eval
        const evalFn = new Function('$', `return ${expression}`);
        return evalFn(config);
    }
    _applyOptionsToConfig(config, options) {
        const { mode, platform, flags } = options;
        // update value
        if (config[mode]) {
            config[mode].value = true;
        }
        else {
            console.warn(`Unknown mode: ${mode}`);
        }
        if (config[platform]) {
            config[platform].value = true;
        }
        else {
            console.warn(`Unknown platform: ${platform}`);
        }
        for (const key in flags) {
            const value = flags[key];
            if (config[key]) {
                config[key].value = value;
            }
            else {
                console.warn(`Unknown flag: ${key}`);
            }
        }
        // eval value
        for (const key in config) {
            const info = config[key];
            if (typeof info.value === 'string') {
                info.value = this._evalExpression(info.value, config);
            }
        }
    }
}
exports.ConstantManager = ConstantManager;
//# sourceMappingURL=constant-manager.js.map