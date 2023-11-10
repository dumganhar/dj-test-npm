"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pathToAssetRefURL = exports.assetRef = void 0;
const url_1 = require("url");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
/**
 * This plugin enable to locate non-code assets in their path or URLs:
 * ```ts
 * import wasm from `asset-ref-url-to-C:/foo.wasm`;
 * ```
 * is equivalent to, for example:
 * ```ts
 * const wasm = 'path-to-<C:/foo.wasm>-relative-to-<outDir>-after-bundle';
 * ```
 * You can call `pathToAssetRefURL()` to convert file path to asset ref URL.
 */
function assetRef(options) {
    return {
        name: '@cocos/build-engine|load-asset',
        // eslint-disable-next-line @typescript-eslint/require-await
        async resolveId(source, importer) {
            if (source.startsWith(assetPrefix)) {
                return source;
            }
            return null;
        },
        async load(id) {
            if (id.startsWith(assetPrefix)) {
                const pathname = id.substr(assetPrefix.length);
                const path = (0, url_1.fileURLToPath)(`file://${pathname}`);
                const referenceId = this.emitFile({
                    type: 'asset',
                    name: path_1.default.basename(path),
                    // fileName: path,
                    source: await fs_extra_1.default.readFile(path),
                });
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
        relativePath, }) {
            switch (options.format) {
                case 'relative-from-chunk':
                    return `'${relativePath}'`;
                case 'relative-from-out':
                    return `'${fileName}'`;
                case 'runtime-resolved':
                default:
                    return undefined; // return `new URL('${fileName}', import.meta.url).href`;
            }
        },
    };
}
exports.assetRef = assetRef;
/**
 * Convert the file path to asset ref URL.
 * @param file File path in absolute.
 */
function pathToAssetRefURL(file) {
    return `${assetPrefix}${(0, url_1.pathToFileURL)(file).pathname}`;
}
exports.pathToAssetRefURL = pathToAssetRefURL;
const assetPrefix = 'asset:';
//# sourceMappingURL=asset-ref.js.map