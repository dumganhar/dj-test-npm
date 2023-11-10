"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsQuery = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const json5_1 = __importDefault(require("json5"));
const dedent_1 = __importDefault(require("dedent"));
const constant_manager_1 = require("./constant-manager");
/**
 * Query any any stats of the engine.
 */
class StatsQuery {
    /**
     * @param engine Path to the engine root.
     */
    static async create(engine) {
        const configFile = path_1.default.join(engine, 'cc.config.json');
        const config = json5_1.default.parse(await fs_extra_1.default.readFile(configFile, 'utf8'));
        // @ts-ignore
        delete config['$schema'];
        const query = new StatsQuery(engine, config);
        await query._initialize();
        return query;
    }
    /**
     * Gets the path to the engine root.
     */
    get path() {
        return this._engine;
    }
    /**
     * Gets the path to tsconfig.
     */
    get tsConfigPath() {
        return path_1.default.join(this._engine, 'tsconfig.json');
    }
    /**
     * Gets all optimzie decorators
     */
    getOptimizeDecorators() {
        return this._config.optimizeDecorators;
    }
    /**
     * Gets all features defined.
     */
    getFeatures() {
        return Object.keys(this._features);
    }
    /**
     * Returns if the specified feature is defined.
     * @param feature Feature ID.
     */
    hasFeature(feature) {
        return !!this._features[feature];
    }
    // TODO: it seems we don't need this interface for now.
    // public isNativeOnlyFeature (feature: string) {
    //     return !!this._features[feature].isNativeOnly;
    // }
    /**
     * Gets all feature units included in specified features.
     * @param featureIds Feature ID.
     */
    getUnitsOfFeatures(featureIds) {
        var _a;
        const units = new Set();
        for (const featureId of featureIds) {
            (_a = this._features[featureId]) === null || _a === void 0 ? void 0 : _a.modules.forEach((entry) => units.add(entry));
        }
        return Array.from(units);
    }
    getIntrinsicFlagsOfFeatures(featureIds) {
        var _a;
        const flags = {};
        for (const featureId of featureIds) {
            const featureFlags = (_a = this._features[featureId]) === null || _a === void 0 ? void 0 : _a.intrinsicFlags;
            if (featureFlags) {
                Object.assign(flags, featureFlags);
            }
        }
        return flags;
    }
    /**
     * Gets all feature units in their names.
     */
    getFeatureUnits() {
        return Object.keys(this._featureUnits);
    }
    /**
     * Gets the path to source file of the feature unit.
     * @param moduleId Name of the feature unit.
     */
    getFeatureUnitFile(featureUnit) {
        return this._featureUnits[featureUnit];
    }
    /**
     * Gets all editor public modules in their names.
     */
    getEditorPublicModules() {
        return Object.keys(this._editorPublicModules);
    }
    /**
     * Gets the path to source file of the editor-public module.
     * @param moduleName Name of the public module.
     */
    getEditorPublicModuleFile(moduleName) {
        return this._editorPublicModules[moduleName];
    }
    /**
     * Gets the source of `'cc'`.
     * @param featureUnits Involved feature units.
     * @param mapper If exists, map the feature unit name into another module request.
     */
    evaluateIndexModuleSource(featureUnits, mapper) {
        return featureUnits.map((featureUnit) => {
            var _a, _b;
            const indexInfo = this._index.modules[featureUnit];
            const ns = indexInfo === null || indexInfo === void 0 ? void 0 : indexInfo.ns;
            if (ns) {
                return (0, dedent_1.default) `
                    import * as ${ns} from '${(_a = mapper === null || mapper === void 0 ? void 0 : mapper(featureUnit)) !== null && _a !== void 0 ? _a : featureUnit}';
                    export { ${ns} };
                `;
            }
            return `export * from '${(_b = mapper === null || mapper === void 0 ? void 0 : mapper(featureUnit)) !== null && _b !== void 0 ? _b : featureUnit}';`;
        }).join('\n');
    }
    /**
     * Evaluates the source of `'internal-constants'`(`'cc/env'`),
     * @param context
     */
    evaluateEnvModuleSourceFromRecord(record) {
        return Object.entries(record).map(([k, v]) => `export const ${k} = ${v};`).join('\n');
    }
    /**
     * Evaluates module overrides under specified context.
     * @param context
     */
    evaluateModuleOverrides(context) {
        var _a;
        const overrides = {};
        const addModuleOverrides = (moduleOverrides, isVirtualModule) => {
            for (let [source, override] of Object.entries(moduleOverrides)) {
                const normalizedSource = isVirtualModule ? source : path_1.default.resolve(this._engine, source);
                override = this._evalPathTemplate(override, context);
                const normalizedOverride = path_1.default.resolve(this._engine, override);
                overrides[normalizedSource] = normalizedOverride;
            }
        };
        (_a = this._config.moduleOverrides) === null || _a === void 0 ? void 0 : _a.forEach(({ test, overrides, isVirtualModule }) => {
            if (this._evalTest(test, context)) {
                addModuleOverrides(overrides, isVirtualModule);
            }
        });
        return overrides;
    }
    static async _readModulesInDir(exportsDir, mapper) {
        const result = {};
        for (const entryFileName of await fs_extra_1.default.readdir(exportsDir)) {
            const entryExtName = path_1.default.extname(entryFileName);
            if (!entryExtName.toLowerCase().endsWith('.ts')) {
                continue;
            }
            const baseName = path_1.default.basename(entryFileName, entryExtName);
            const moduleName = mapper(baseName);
            const entryFile = path_1.default.join(exportsDir, entryFileName);
            result[moduleName] = entryFile;
        }
        return result;
    }
    static _baseNameToFeatureUnitName(baseName) {
        return `${baseName}`;
    }
    static _editorBaseNameToModuleName(baseName) {
        return `cc/editor/${baseName}`;
    }
    constructor(engine, config) {
        this._index = { modules: {} };
        this._features = {};
        this._featureUnits = {};
        this._editorPublicModules = {};
        this._config = config;
        this._engine = engine;
        this.constantManager = new constant_manager_1.ConstantManager(engine);
    }
    _evalTest(test, context) {
        // eslint-disable-next-line @typescript-eslint/no-implied-eval,no-new-func
        const result = new Function('context', `return ${test}`)(context);
        // console.debug(`Eval "${test}" to ${result}`);
        return result;
    }
    _evalPathTemplate(pathTemplate, context) {
        let resultPath = pathTemplate;
        const regExp = /\{\{(.*?)\}\}/g;
        let exeResult;
        while (exeResult = regExp.exec(pathTemplate)) {
            const templateItem = exeResult[0];
            const exp = exeResult[1];
            const evalResult = (new Function('context', `return ${exp}`)(context));
            resultPath = pathTemplate.replace(templateItem, evalResult);
        }
        return resultPath;
    }
    async _initialize() {
        const { _config: config, _engine: engine } = this;
        const featureUnits = this._featureUnits = await StatsQuery._readModulesInDir(path_1.default.join(engine, 'exports'), StatsQuery._baseNameToFeatureUnitName);
        for (const [featureName, feature] of Object.entries(config.features)) {
            const parsedFeature = this._features[featureName] = { modules: [] };
            for (const moduleFileBaseName of feature.modules) {
                const featureUnitName = StatsQuery._baseNameToFeatureUnitName(moduleFileBaseName);
                if (!featureUnits[featureUnitName]) {
                    throw new Error(`Invalid config file: '${moduleFileBaseName}' is not a valid module.`);
                }
                parsedFeature.modules.push(featureUnitName);
            }
            parsedFeature.intrinsicFlags = feature.intrinsicFlags;
        }
        if (config.index) {
            if (config.index.modules) {
                for (const [k, v] of Object.entries(config.index.modules)) {
                    this._index.modules[StatsQuery._baseNameToFeatureUnitName(k)] = v;
                }
            }
            this._index = Object.assign(Object.assign({}, config.index), { modules: this._index.modules });
        }
        this._editorPublicModules = await StatsQuery._readModulesInDir(path_1.default.join(engine, 'editor', 'exports'), StatsQuery._editorBaseNameToModuleName);
    }
}
exports.StatsQuery = StatsQuery;
//# sourceMappingURL=stats-query.js.map