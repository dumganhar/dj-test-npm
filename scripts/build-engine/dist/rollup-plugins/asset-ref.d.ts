import type * as rollup from 'rollup';
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
export declare function assetRef(options: assetRef.Options): rollup.Plugin;
export declare namespace assetRef {
    interface Options {
        format?: Format;
    }
    /**
     * How to generate the reference to external assets:
     * - `'relative-from-out'`
     * Generate the path relative from `out` directory, does not contain the leading './'.
     *
     * - `'relative-from-chunk'`
     * Generate the path relative from the referencing output chunk.
     *
     * - `'dynamic'`(default)
     * Use runtime `URL` API to resolve the absolute URL.
     * This requires `URL` and `import.meta.url` to be valid.
     */
    type Format = 'relative-from-out' | 'relative-from-chunk' | 'runtime-resolved';
}
/**
 * Convert the file path to asset ref URL.
 * @param file File path in absolute.
 */
export declare function pathToAssetRefURL(file: string): string;
