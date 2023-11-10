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
exports.isSourceChanged = exports.build = exports.parseModuleOption = exports.enumerateModuleOptionReps = exports.ModuleOption = exports.StatsQuery = void 0;
/* eslint-disable no-console */
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const babel = __importStar(require("@babel/core"));
const plugin_babel_1 = __importDefault(require("@rollup/plugin-babel"));
const plugin_json_1 = __importDefault(require("@rollup/plugin-json"));
const plugin_node_resolve_1 = __importDefault(require("@rollup/plugin-node-resolve"));
const plugin_commonjs_1 = __importDefault(require("@rollup/plugin-commonjs"));
const rollup_plugin_terser_1 = require("rollup-plugin-terser");
const preset_env_1 = __importDefault(require("@babel/preset-env"));
const creator_programming_babel_preset_cc_1 = require("@cocos/creator-programming-babel-preset-cc");
// @ts-expect-error: No typing
const plugin_transform_for_of_1 = __importDefault(require("@babel/plugin-transform-for-of"));
const rollup = __importStar(require("rollup"));
// @ts-expect-error: No typing
const rollup_plugin_progress_1 = __importDefault(require("rollup-plugin-progress"));
const plugin_virtual_1 = __importDefault(require("@rollup/plugin-virtual"));
const resolve_1 = __importDefault(require("resolve"));
const babel_plugin_dynamic_import_vars_1 = __importDefault(require("@cocos/babel-plugin-dynamic-import-vars"));
const fs_1 = __importDefault(require("fs"));
const module_option_1 = require("./module-option");
Object.defineProperty(exports, "ModuleOption", { enumerable: true, get: function () { return module_option_1.ModuleOption; } });
Object.defineProperty(exports, "enumerateModuleOptionReps", { enumerable: true, get: function () { return module_option_1.enumerateModuleOptionReps; } });
Object.defineProperty(exports, "parseModuleOption", { enumerable: true, get: function () { return module_option_1.parseModuleOption; } });
const ts_paths_1 = __importDefault(require("./ts-paths"));
const remove_deprecated_features_1 = __importDefault(require("./remove-deprecated-features"));
const stats_query_1 = require("./stats-query");
Object.defineProperty(exports, "StatsQuery", { enumerable: true, get: function () { return stats_query_1.StatsQuery; } });
const utils_1 = require("./utils");
const asset_ref_1 = require("./rollup-plugins/asset-ref");
const code_asset_1 = require("./rollup-plugins/code-asset");
const asset_url_1 = require("./rollup-plugins/asset-url");
const decoratorRecorder = __importStar(require("./babel-plugins/decorator-parser"));
function equalPathIgnoreDriverLetterCase(lhs, rhs) {
    if (lhs.length !== rhs.length) {
        return false;
    }
    if (lhs.length < 2 || lhs[1] !== '.' || rhs[1] !== '.') {
        return lhs === rhs;
    }
    if (lhs[0].toLowerCase() !== rhs[0].toLowerCase()) {
        return false;
    }
    return lhs.indexOf(rhs.substr(2), 2) === 2;
}
const equalPath = process.platform === 'win32'
    ? equalPathIgnoreDriverLetterCase
    : (lhs, rhs) => lhs === rhs;
function makePathEqualityKey(path) {
    return process.platform === 'win32' ? path.toLocaleLowerCase() : path;
}
async function build(options) {
    console.debug(`Build-engine options: ${JSON.stringify(options, undefined, 2)}`);
    return doBuild({
        options,
    });
}
exports.build = build;
// eslint-disable-next-line @typescript-eslint/no-namespace
(function (build) {
    async function transform(code, moduleOption, loose) {
        const babelFormat = moduleOptionsToBabelEnvModules(moduleOption);
        const babelFileResult = await babel.transformAsync(code, {
            presets: [[preset_env_1.default, { modules: babelFormat, loose: loose !== null && loose !== void 0 ? loose : true }]],
        });
        if (!babelFileResult || !babelFileResult.code) {
            throw new Error(`Failed to transform!`);
        }
        return {
            code: babelFileResult.code,
        };
    }
    build.transform = transform;
})(build || (build = {}));
exports.build = build;
async function doBuild({ options, }) {
    var _a, _b, _c, _d, _e, _f;
    const realpath = typeof fs_1.default.realpath.native === 'function' ? fs_1.default.realpath.native : fs_1.default.realpath;
    const realPath = (file) => new Promise((resolve, reject) => {
        realpath(file, (err, path) => {
            if (err && err.code !== 'ENOENT') {
                reject(err);
            }
            else {
                resolve(err ? file : path);
            }
        });
    });
    const doUglify = !!options.compress;
    const engineRoot = path_1.default.resolve(options.engine);
    const moduleOption = (_a = options.moduleFormat) !== null && _a !== void 0 ? _a : module_option_1.ModuleOption.iife;
    const rollupFormat = moduleOptionsToRollupFormat(moduleOption);
    let { ammoJsWasm } = options;
    if (ammoJsWasm === 'fallback'
        && moduleOption !== module_option_1.ModuleOption.system) {
        console.warn('--ammojs-wasm=fallback is only available under SystemJS target.');
        ammoJsWasm = false;
    }
    const statsQuery = await stats_query_1.StatsQuery.create(engineRoot);
    if (options.features) {
        for (const feature of options.features) {
            if (!statsQuery.hasFeature(feature)) {
                console.warn(`'${feature}' is not a valid feature.`);
            }
        }
    }
    let features;
    let split = (_b = options.split) !== null && _b !== void 0 ? _b : false;
    if (options.features && options.features.length !== 0) {
        features = options.features;
    }
    else {
        features = statsQuery.getFeatures();
        if (split !== true) {
            split = true;
            console.warn(`You did not specify features which implies 'split: true'. `
                + `Explicitly set 'split: true' to suppress this warning.`);
        }
    }
    const intrinsicFlags = statsQuery.getIntrinsicFlagsOfFeatures(features);
    const buildTimeConstants = Object.assign(Object.assign({}, intrinsicFlags), options.buildTimeConstants);
    if (typeof options.forceJitValue !== undefined) {
        buildTimeConstants['SUPPORT_JIT'] = options.forceJitValue;
    }
    const moduleOverrides = Object.entries(statsQuery.evaluateModuleOverrides({
        mode: options.mode,
        platform: options.platform,
        buildTimeConstants,
    })).reduce((result, [k, v]) => {
        result[makePathEqualityKey(k)] = v;
        return result;
    }, {});
    const featureUnits = statsQuery.getUnitsOfFeatures(features);
    // HACK: get platform, mode, flags from build time constants
    const flags = {};
    ['SERVER_MODE', 'NOT_PACK_PHYSX_LIBS', 'DEBUG', 'NET_MODE', 'WEBGPU', 'SUPPORT_JIT'].forEach((key) => {
        if (key !== 'SUPPORT_JIT' || typeof buildTimeConstants['SUPPORT_JIT'] !== 'undefined') {
            flags[key] = buildTimeConstants[key];
        }
    });
    // Wether use webgpu
    const useWebGPU = flags['WEBGPU'];
    let platform = options.platform;
    if (!platform) {
        ["HTML5", "NATIVE", "WECHAT", "BAIDU", "XIAOMI", "ALIPAY", "BYTEDANCE", "OPPO", "VIVO", "HUAWEI", "COCOSPLAY", "QTT", "LINKSURE"].some(key => {
            if (buildTimeConstants[key]) {
                platform = key;
                return true;
            }
            return false;
        });
    }
    let mode = options.mode;
    if (!mode) {
        ["EDITOR", "PREVIEW", "BUILD", "TEST"].some((key) => {
            if (buildTimeConstants[key]) {
                mode = key;
                return true;
            }
            return false;
        });
    }
    const rpVirtualOptions = {};
    const vmInternalConstants = statsQuery.constantManager.exportStaticConstants({
        platform,
        mode,
        flags,
        forceJitValue: options.forceJitValue,
    });
    console.debug(`Module source "internal-constants":\n${vmInternalConstants}`);
    rpVirtualOptions['internal:constants'] = vmInternalConstants;
    rpVirtualOptions[creator_programming_babel_preset_cc_1.helpers.CC_HELPER_MODULE] = creator_programming_babel_preset_cc_1.helpers.generateHelperModuleSource();
    const forceStandaloneModules = ['wait-for-ammo-instantiation', 'decorator'];
    let rollupEntries;
    if (split) {
        rollupEntries = featureUnits.reduce((result, featureUnit) => {
            result[featureUnit] = statsQuery.getFeatureUnitFile(featureUnit);
            return result;
        }, {});
    }
    else {
        rollupEntries = {
            cc: 'cc',
        };
        const selectedFeatureUnits = [];
        for (const featureUnit of featureUnits) {
            if (forceStandaloneModules.includes(featureUnit)) {
                rollupEntries[featureUnit] = statsQuery.getFeatureUnitFile(featureUnit);
            }
            else {
                selectedFeatureUnits.push(featureUnit);
            }
        }
        rpVirtualOptions.cc = statsQuery.evaluateIndexModuleSource(selectedFeatureUnits, (featureUnit) => (0, utils_1.filePathToModuleRequest)(statsQuery.getFeatureUnitFile(featureUnit)));
        rollupEntries.cc = 'cc';
        console.debug(`Module source "cc":\n${rpVirtualOptions.cc}`);
    }
    const presetEnvOptions = {
        loose: (_c = options.loose) !== null && _c !== void 0 ? _c : true,
        // We need explicitly specified targets.
        // Ignore it to avoid the engine's parent dirs contain unexpected config.
        ignoreBrowserslistConfig: true,
    };
    if (options.targets !== undefined) {
        presetEnvOptions.targets = options.targets;
    }
    const babelPlugins = [];
    if (options.targets === undefined) {
        babelPlugins.push([plugin_transform_for_of_1.default, {
                loose: true,
            }]);
    }
    babelPlugins.push([babel_plugin_dynamic_import_vars_1.default, {
            resolve: {
                forwardExt: 'resolved',
            },
        }]);
    const { fieldDecorators, editorDecorators } = statsQuery.getOptimizeDecorators();
    const babelOptions = {
        babelHelpers: 'bundled',
        extensions: ['.js', '.ts'],
        exclude: [
            /node_modules[/\\]@cocos[/\\]ammo/,
            /node_modules[/\\]@cocos[/\\]cannon/,
            /node_modules[/\\]@cocos[/\\]physx/,
        ],
        comments: false,
        overrides: [{
                // Eliminates the babel compact warning:
                // 'The code generator has deoptimised the styling of ...'
                // that came from node_modules/@cocos
                test: /node_modules[/\\]@cocos[/\\]/,
                compact: true,
            }],
        plugins: babelPlugins,
        presets: [
            [preset_env_1.default, presetEnvOptions],
            [creator_programming_babel_preset_cc_1.babelPresetCC, {
                    allowDeclareFields: true,
                    ccDecoratorHelpers: 'external',
                    fieldDecorators,
                    editorDecorators,
                }],
        ],
    };
    if (options.generateDecoratorsForJSB) {
        if (!process.env.ENGINE_PATH) {
            throw new Error('ENGINE_PATH environment variable not set');
        }
        (_d = babelOptions.presets) === null || _d === void 0 ? void 0 : _d.push([() => ({ plugins: [[decoratorRecorder]] })]);
    }
    const rollupPlugins = [];
    const codeAssetMapping = {};
    if (rollupFormat === 'system' || rollupFormat === 'systemjs') {
        // `@cocos/physx` is too big(~6Mb) and cause memory crash.
        // Our temporary solution: exclude @cocos/physx from bundling and connect it with source map.
        rollupPlugins.push((0, code_asset_1.codeAsset)({
            resultMapping: codeAssetMapping,
            include: [
                /node_modules[/\\]@cocos[/\\]physx/,
            ],
        }));
    }
    if (options.noDeprecatedFeatures) {
        rollupPlugins.push((0, remove_deprecated_features_1.default)(typeof options.noDeprecatedFeatures === 'string' ? options.noDeprecatedFeatures : undefined));
    }
    rollupPlugins.push((0, asset_ref_1.assetRef)({
        format: options.assetURLFormat,
    }), {
        name: '@cocos/build-engine|module-overrides',
        resolveId(source, importer) {
            if (moduleOverrides[source]) {
                return source;
            }
            else {
                return null;
            }
        },
        load(id) {
            const key = makePathEqualityKey(id);
            if (!(key in moduleOverrides)) {
                return null;
            }
            const replacement = moduleOverrides[key];
            console.debug(`Redirect module ${id} to ${replacement}`);
            return `export * from '${(0, utils_1.filePathToModuleRequest)(replacement)}';`;
        },
    }, (0, plugin_virtual_1.default)(rpVirtualOptions), (0, ts_paths_1.default)({
        configFileName: path_1.default.resolve(options.engine, 'tsconfig.json'),
    }), (0, plugin_node_resolve_1.default)({
        extensions: ['.js', '.ts', '.json'],
        jail: await realPath(engineRoot),
        rootDir: engineRoot,
    }), (0, plugin_json_1.default)({
        preferConst: true,
    }), (0, plugin_commonjs_1.default)({
        include: [
            /node_modules[/\\]/,
        ],
        sourceMap: false,
    }), (0, plugin_babel_1.default)(Object.assign({ skipPreflightCheck: true }, babelOptions)));
    if (options.progress) {
        rollupPlugins.unshift((0, rollup_plugin_progress_1.default)());
    }
    if (doUglify) { // TODO: tree-shaking not clear!
        rollupPlugins.push((0, rollup_plugin_terser_1.terser)({
            // see https://github.com/terser/terser#compress-options
            compress: {
                reduce_funcs: false,
                keep_fargs: false,
                unsafe_Function: true,
                unsafe_math: true,
                unsafe_methods: true,
                passes: 2, // first: remove deadcodes and const objects, second: drop variables
            },
            mangle: doUglify,
            keep_fnames: !doUglify,
            output: {
                beautify: !doUglify,
            },
            // https://github.com/rollup/rollup/issues/3315
            // We only do this for CommonJS.
            // Especially, we cannot do this for IIFE.
            toplevel: rollupFormat === 'cjs',
        }));
    }
    const visualizeOptions = typeof options.visualize === 'object'
        ? options.visualize
        : (options.visualize ? {} : undefined);
    if (visualizeOptions) {
        let rpVisualizer;
        try {
            rpVisualizer = await Promise.resolve().then(() => __importStar(require('rollup-plugin-visualizer')));
        }
        catch (_g) {
            console.warn('Visualizing needs \'rollup-plugin-visualizer\' to be installed. It\'s installed as dev-dependency.');
        }
        if (rpVisualizer) {
            const visualizeFile = (_e = visualizeOptions.file) !== null && _e !== void 0 ? _e : path_1.default.join(options.out, 'visualize.html');
            rollupPlugins.push(rpVisualizer.default({
                filename: visualizeFile,
                title: 'Cocos Creator build visualizer',
                template: 'treemap',
            }));
        }
    }
    let hasCriticalWarns = false;
    const rollupWarningHandler = (warning, defaultHandler) => {
        var _a;
        if (typeof warning !== 'string') {
            if (warning.code === 'CIRCULAR_DEPENDENCY') {
                hasCriticalWarns = true;
            }
            else if (warning.code === 'THIS_IS_UNDEFINED') {
                // TODO: It's really inappropriate to do this...
                // Let's fix these files instead of suppressing rollup.
                if ((_a = warning.id) === null || _a === void 0 ? void 0 : _a.match(/(?:spine-core\.js$)|(?:dragonBones\.js$)/)) {
                    console.debug(`Rollup warning 'THIS_IS_UNDEFINED' is omitted for ${warning.id}`);
                    return;
                }
            }
        }
        defaultHandler(warning);
    };
    rollupPlugins.unshift((0, asset_url_1.assetUrl)({
        engineRoot,
        useWebGPU,
    }));
    const rollupOptions = {
        input: rollupEntries,
        plugins: rollupPlugins,
        cache: false,
        onwarn: rollupWarningHandler,
    };
    const perf = true;
    if (perf) {
        rollupOptions.perf = true;
    }
    const rollupBuild = await rollup.rollup(rollupOptions);
    const timing = (_f = rollupBuild.getTimings) === null || _f === void 0 ? void 0 : _f.call(rollupBuild);
    if (timing) {
        console.debug(`==== Performance ====`);
        console.debug(JSON.stringify(timing));
        console.debug(`====             ====`);
    }
    const { incremental: incrementalFile } = options;
    if (incrementalFile) {
        const watchFiles = {};
        const files = rollupBuild.watchFiles;
        await Promise.all(files.map(async (watchFile) => {
            try {
                const stat = await fs_extra_1.default.stat(watchFile);
                watchFiles[watchFile] = stat.mtimeMs;
            }
            catch (_a) {
                // the `watchFiles` may contain non-fs modules.
            }
        }));
        await fs_extra_1.default.ensureDir(path_1.default.dirname(incrementalFile));
        await fs_extra_1.default.writeFile(incrementalFile, JSON.stringify(watchFiles, undefined, 2));
    }
    const result = {
        chunkAliases: {},
        exports: {},
        hasCriticalWarns: false,
    };
    const rollupOutputOptions = {
        format: rollupFormat,
        sourcemap: options.sourceMap,
        sourcemapFile: options.sourceMapFile,
        name: (rollupFormat === 'iife' ? 'ccm' : undefined),
        dir: options.out,
        // minifyInternalExports: false,
        // preserveEntrySignatures: "allow-extension",
    };
    const rollupOutput = await rollupBuild.write(rollupOutputOptions);
    const validEntryChunks = {};
    for (const output of rollupOutput.output) {
        if (output.type === 'chunk') {
            if (output.isEntry) {
                const chunkName = output.name;
                if (chunkName in rollupEntries || chunkName === 'cc') {
                    validEntryChunks[chunkName] = output.fileName;
                }
            }
        }
    }
    Object.assign(result.exports, validEntryChunks);
    Object.assign(result.chunkAliases, codeAssetMapping);
    result.dependencyGraph = {};
    for (const output of rollupOutput.output) {
        if (output.type === 'chunk') {
            result.dependencyGraph[output.fileName] = output.imports.concat(output.dynamicImports);
        }
    }
    result.hasCriticalWarns = hasCriticalWarns;
    return result;
    async function nodeResolveAsync(specifier) {
        return new Promise((r, reject) => {
            (0, resolve_1.default)(specifier, {
                basedir: engineRoot,
            }, (err, resolved, pkg) => {
                if (err) {
                    reject(err);
                }
                else {
                    r(resolved);
                }
            });
        });
    }
}
function moduleOptionsToRollupFormat(moduleOptions) {
    switch (moduleOptions) {
        case module_option_1.ModuleOption.cjs: return 'cjs';
        case module_option_1.ModuleOption.esm: return 'esm';
        case module_option_1.ModuleOption.system: return 'system';
        case module_option_1.ModuleOption.iife: return 'iife';
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        default: throw new Error(`Unknown module format ${moduleOptions}`);
    }
}
function moduleOptionsToBabelEnvModules(moduleOptions) {
    switch (moduleOptions) {
        case module_option_1.ModuleOption.cjs: return 'commonjs';
        case module_option_1.ModuleOption.system: return 'systemjs';
        case module_option_1.ModuleOption.iife:
        case module_option_1.ModuleOption.esm: return false;
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        default: throw new Error(`Unknown module format ${moduleOptions}`);
    }
}
async function isSourceChanged(incrementalFile) {
    let record;
    try {
        record = await fs_extra_1.default.readJSON(incrementalFile);
    }
    catch (_a) {
        console.debug(`Failed to read incremental file: ${incrementalFile} - rebuild is needed.`);
        return true;
    }
    for (const file of Object.keys(record)) {
        const mtime = record[file];
        try {
            /* eslint-disable-next-line no-await-in-loop */
            const mtimeNow = (await fs_extra_1.default.stat(file)).mtimeMs;
            if (mtimeNow !== mtime) {
                console.debug(`Source ${file} in watch files record ${incrementalFile} has a different time stamp - rebuild is needed.`);
                return true;
            }
        }
        catch (_b) {
            console.debug(`Failed to read source ${file} in watch files record ${incrementalFile} - rebuild is needed.`);
            return true;
        }
    }
    return false;
}
exports.isSourceChanged = isSourceChanged;
async function getDefaultModuleEntries(engine) {
    const isGroupItem = (item) => 'options' in item;
    const divisionConfig = await fs_extra_1.default.readJSON(path_1.default.join(engine, 'scripts', 'module-division', 'division-config.json'));
    const result = [];
    const addEntry = (entry) => {
        if (Array.isArray(entry)) {
            result.push(...entry);
        }
        else {
            result.push(entry);
        }
    };
    for (const groupOrItem of divisionConfig.groupOrItems) {
        const items = 'items' in groupOrItem ? groupOrItem.items : [groupOrItem];
        for (const item of items) {
            if (item.required || item.default) {
                if (isGroupItem(item)) {
                    addEntry(item.options[item.defaultOption || 0].entry);
                }
                else {
                    // @ts-expect-error: By convention
                    addEntry(item.entry);
                }
            }
        }
    }
    return result;
}
//# sourceMappingURL=index.js.map