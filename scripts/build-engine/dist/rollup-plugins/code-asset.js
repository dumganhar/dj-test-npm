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
exports.codeAsset = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const pluginUtils = __importStar(require("@rollup/pluginutils"));
/**
 * Excludes specified modules clearly from rollup bundling.
 * Requests to these modules are remapped as another place holder module specifiers
 * and this plugin will produce a map which records the mapping info.
 *
 * For instance, give that we want to handle `'@cocos/physx'`. Some modules may have:
 * ```ts
 * import X from '@cocos/physx';
 * ```
 * As a result, first, the real `@cocos/physx` module would be wrapped as SystemJS module
 * and emitted to build output as a single code file, without bother to rollup(so that pretty fast).
 * Then, the bundle generates a module ID, let's say: `placeholder:/@cocos/physx`.
 * To use that bundle,
 * you need to properly map the `placeholder:/@cocos/physx` for example, through import map,
 * to the emitted file.
 * The `resultMapping` records which real module the `placeholder:/@cocos/physx` is mapped.
 *
 * The following requirements should be fulfilled:
 * - These modules are all CommonJS modules that only use `exports` and `module.exports`.
 * - The module format of rollup bundling should be SystemJS.
 */
function codeAsset({ include, exclude, resultMapping, }) {
    const filter = pluginUtils.createFilter(include, exclude);
    const emitMap = {};
    return {
        name: '@cocos/build-engine|code-asset',
        resolveId(source, _importer) {
            if (!(source in emitMap)) {
                return null;
            }
            return {
                id: source,
                external: true,
            };
        },
        async load(id) {
            if (!filter(id)) {
                return null;
            }
            const placeholderId = generatePlaceholderId(id);
            if (!placeholderId) {
                this.error(`Can not generate placeholder ID for module ${id}.`);
            }
            const referenceId = this.emitFile({
                type: 'asset',
                name: path_1.default.basename(id),
                // fileName: path,
                source: wrapAsmJs(await fs_extra_1.default.readFile(id, 'utf8')),
            });
            const placeholderModuleSpecifier = `split:/${placeholderId}`;
            emitMap[placeholderModuleSpecifier] = referenceId;
            const code = `
            export * from '${placeholderModuleSpecifier}';
            import { default as D } from '${placeholderModuleSpecifier}';
            export { D as default };
            `;
            return code;
        },
        generateBundle(_options, _bundle, _isWrite) {
            for (const [moduleId, rollupFileReferenceId] of Object.entries(emitMap)) {
                resultMapping[moduleId] = this.getFileName(rollupFileReferenceId);
            }
        },
    };
}
exports.codeAsset = codeAsset;
function wrapAsmJs(code) {
    return `
    System.register([], function (_export) {
        return {
            execute() {
                const _cjsModule = { exports: {} };
                const _cjsExports = _cjsModule.exports;
                (function(module, exports){
                    ${code}
                })(_cjsModule, _cjsExports);
                _export("default", _cjsModule.exports);
            },
        };
    });
    `;
}
function generatePlaceholderId(id) {
    const parts = id.split(/[\\\/]/g);
    if (parts.length !== 0) {
        const baseName = parts[parts.length - 1];
        if (baseName) {
            return baseName;
        }
    }
    return '';
}
//# sourceMappingURL=code-asset.js.map