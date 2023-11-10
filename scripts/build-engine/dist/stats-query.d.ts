import { Context } from './config-interface';
import { ConstantManager } from './constant-manager';
/**
 * Query any any stats of the engine.
 */
export declare class StatsQuery {
    /**
     * @param engine Path to the engine root.
     */
    static create(engine: string): Promise<StatsQuery>;
    /**
     * Constant manager for engine and user.
     */
    constantManager: ConstantManager;
    /**
     * Gets the path to the engine root.
     */
    get path(): string;
    /**
     * Gets the path to tsconfig.
     */
    get tsConfigPath(): string;
    /**
     * Gets all optimzie decorators
     */
    getOptimizeDecorators(): import("./config-interface").IOptimizeDecorators;
    /**
     * Gets all features defined.
     */
    getFeatures(): string[];
    /**
     * Returns if the specified feature is defined.
     * @param feature Feature ID.
     */
    hasFeature(feature: string): boolean;
    /**
     * Gets all feature units included in specified features.
     * @param featureIds Feature ID.
     */
    getUnitsOfFeatures(featureIds: string[]): string[];
    getIntrinsicFlagsOfFeatures(featureIds: string[]): Record<string, string | number | boolean>;
    /**
     * Gets all feature units in their names.
     */
    getFeatureUnits(): string[];
    /**
     * Gets the path to source file of the feature unit.
     * @param moduleId Name of the feature unit.
     */
    getFeatureUnitFile(featureUnit: string): string;
    /**
     * Gets all editor public modules in their names.
     */
    getEditorPublicModules(): string[];
    /**
     * Gets the path to source file of the editor-public module.
     * @param moduleName Name of the public module.
     */
    getEditorPublicModuleFile(moduleName: string): string;
    /**
     * Gets the source of `'cc'`.
     * @param featureUnits Involved feature units.
     * @param mapper If exists, map the feature unit name into another module request.
     */
    evaluateIndexModuleSource(featureUnits: string[], mapper?: (featureUnit: string) => string): string;
    /**
     * Evaluates the source of `'internal-constants'`(`'cc/env'`),
     * @param context
     */
    evaluateEnvModuleSourceFromRecord(record: Record<string, unknown>): string;
    /**
     * Evaluates module overrides under specified context.
     * @param context
     */
    evaluateModuleOverrides(context: Context): Record<string, string>;
    private static _readModulesInDir;
    private static _baseNameToFeatureUnitName;
    private static _editorBaseNameToModuleName;
    private constructor();
    private _evalTest;
    private _evalPathTemplate;
    private _initialize;
    private _engine;
    private _index;
    private _features;
    private _config;
    private _featureUnits;
    private _editorPublicModules;
}
