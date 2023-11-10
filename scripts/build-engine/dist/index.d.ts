import { ModuleOption, enumerateModuleOptionReps, parseModuleOption } from './module-option';
import { IBuildTimeConstants } from './build-time-constants';
import { StatsQuery } from './stats-query';
import { assetRef as rpAssetRef } from './rollup-plugins/asset-ref';
export { IOptimizeDecorators } from './config-interface';
export { ModeType, PlatformType, FlagType, ConstantOptions, BuildTimeConstants, CCEnvConstants } from './constant-manager';
export { StatsQuery };
export { ModuleOption, enumerateModuleOptionReps, parseModuleOption };
declare function build(options: build.Options): Promise<build.Result>;
declare namespace build {
    interface Options {
        /**
         * 引擎仓库目录。
         */
        engine: string;
        /**
         * 包含的功能。
         */
        features?: string[];
        /**
         * 输出目录。
         */
        out: string;
        /**
         * 输出模块格式。
         * @default ModuleOption.system
         */
        moduleFormat?: ModuleOption;
        /**
         * 是否对生成结果进行压缩。
         * @default false
         */
        compress?: boolean;
        /**
         * 是否生成 source map。
         * 若为 `inline` 则生成内联的 source map。
         * @default false
         */
        sourceMap?: boolean | 'inline';
        /**
         * 若 `sourceMap` 为 `true`，此选项指定了 source map 的路径。
         * @default `${outputPath.map}`
         */
        sourceMapFile?: string;
        /**
         * 若为 `true`，分割出 **所有** 引擎子模块。
         * 否则，`.moduleEntries` 指定的所有子模块将被合并成一个单独的 `"cc"` 模块。
         * @default false
         */
        split?: boolean;
        mode?: string;
        platform?: string;
        /**
         * 使用的 ammo.js 版本，也即 `@cocos/ammo` 映射到的版本。
         * - 为 `true` 时使用 WebAssembly 版本的 ammo.js；
         * - 为 `false` 时使用 asm.js 版本的 ammo.js；
         * - 为 `'fallback` 时同时在结果中包含两个版本的 ammo.js，并自动根据环境 fallback 选择。
         *
         * 注意，`'fallback'` 只有在 SystemJS 和 Async functions 同时支持时才有效。
         * @default false
         */
        ammoJsWasm?: boolean | 'fallback';
        /**
         * If true, all deprecated features/API are excluded.
         * You can also specify a version range(in semver range) to exclude deprecations in specified version(s).
         * @default false
         */
        noDeprecatedFeatures?: string | boolean;
        /**
         * Experimental.
         */
        incremental?: string;
        progress?: boolean;
        /**
         * BrowsersList targets.
         */
        targets?: string | string[] | Record<string, string>;
        /**
         * Enable loose compilation.
         */
        loose?: boolean;
        /**
         * How to generate the URL of external assets.
         */
        assetURLFormat?: rpAssetRef.Format;
        visualize?: boolean | {
            file?: string;
        };
        buildTimeConstants: IBuildTimeConstants;
        /**
         * Generate cocos/native-binding/decorators.ts for native platforms
         */
        generateDecoratorsForJSB?: boolean;
        /**
         * Whether force SUPPORT_JIT to the specified value.
         */
        forceJitValue?: boolean;
    }
    interface Result {
        /**
         * Mappings between feature unit name and their actual chunk file, for example:
         * ```js
         * {
         *   "core": "./core.js",
         *   "gfx-webgl": "./gfx-webgl.js",
         * }
         * ```
         */
        exports: Record<string, string>;
        /**
         * The compulsory import mappings that should be applied.
         */
        chunkAliases: Record<string, string>;
        dependencyGraph?: Record<string, string[]>;
        hasCriticalWarns: boolean;
    }
    function transform(code: string, moduleOption: ModuleOption, loose?: boolean): Promise<{
        code: string;
    }>;
}
export { build };
export declare function isSourceChanged(incrementalFile: string): Promise<boolean>;
