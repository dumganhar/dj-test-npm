"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assetUrl = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importStar(require("path"));
const URL_PROTOCOL = 'url:';
const PREFIX = `\0${URL_PROTOCOL}`;
function assetUrl({ engineRoot, useWebGPU = false, }) {
    const files = new Set();
    return {
        name: '@cocos/build-engine|external-asset',
        async resolveId(source, importer) {
            if (source.startsWith(URL_PROTOCOL) && importer) {
                const subPath = source.substring(URL_PROTOCOL.length);
                const externalAssetPath = (0, path_1.join)(engineRoot, subPath);
                return PREFIX + externalAssetPath;
            }
            return null;
        },
        async load(id) {
            if (id.startsWith(PREFIX)) {
                const path = id.substring(PREFIX.length);
                if (!useWebGPU) {
                    return `export default '';`;
                }
                const referenceId = this.emitFile({
                    type: 'asset',
                    name: path_1.default.basename(path),
                    source: await fs_extra_1.default.readFile(path),
                });
                files.add(referenceId);
                return `export default import.meta.ROLLUP_FILE_URL_${referenceId};`;
            }
            return null;
        },
        // Generates the `import.meta.ROLLUP_FILE_URL_referenceId`.
        resolveFileUrl({ 
        // > The path and file name of the emitted asset, relative to `output.dir` without a leading `./`.
        fileName, 
        // > The path and file name of the emitted file,
        // > relative to the chunk the file is referenced from.
        // > This will path will contain no leading `./` but may contain a leading `../`.
        relativePath, referenceId, }) {
            if (files.has(referenceId)) {
                return `'${fileName}'`;
            }
            else {
                return undefined;
            }
        },
    };
}
exports.assetUrl = assetUrl;
//# sourceMappingURL=asset-url.js.map