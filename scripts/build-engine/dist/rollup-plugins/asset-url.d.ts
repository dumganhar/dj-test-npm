import type * as rollup from 'rollup';
interface IOptions {
    engineRoot: string;
    useWebGPU?: boolean;
}
export declare function assetUrl({ engineRoot, useWebGPU, }: IOptions): rollup.Plugin;
export {};
