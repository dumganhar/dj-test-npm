import type * as rollup from 'rollup';
import * as pluginUtils from '@rollup/pluginutils';
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
export declare function codeAsset({ include, exclude, resultMapping, }: {
    include?: pluginUtils.FilterPattern;
    exclude?: pluginUtils.FilterPattern;
    resultMapping: Record<string, string>;
}): rollup.Plugin;
