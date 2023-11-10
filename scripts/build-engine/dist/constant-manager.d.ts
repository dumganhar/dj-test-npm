export type ModeType = 'EDITOR' | 'PREVIEW' | 'BUILD' | 'TEST';
export type PlatformType = 'HTML5' | 'NATIVE' | 'WECHAT' | 'BAIDU' | 'XIAOMI' | 'ALIPAY' | 'TAOBAO' | 'TAOBAO_MINIGAME' | 'BYTEDANCE' | 'OPPO' | 'VIVO' | 'HUAWEI' | 'COCOSPLAY' | 'QTT' | 'LINKSURE';
export type InternalFlagType = 'SERVER_MODE' | 'NOT_PACK_PHYSX_LIBS' | 'WEBGPU';
export type PublicFlagType = 'DEBUG' | 'NET_MODE';
export type FlagType = InternalFlagType | PublicFlagType;
export type ValueType = number | boolean;
export interface ConstantOptions {
    mode: ModeType;
    platform: PlatformType;
    flags: Partial<Record<FlagType, ValueType>>;
    /**
     * @experimental
     */
    forceJitValue?: boolean;
}
export type BuildTimeConstants = Record<PlatformType | ModeType | FlagType, ValueType>;
export type CCEnvConstants = Record<PlatformType | ModeType | PublicFlagType, ValueType>;
export declare class ConstantManager {
    private _engineRoot;
    constructor(engineRoot: string);
    exportDynamicConstants({ mode, platform, flags, }: ConstantOptions): string;
    genBuildTimeConstants(options: ConstantOptions): BuildTimeConstants;
    genCCEnvConstants(options: ConstantOptions): CCEnvConstants;
    exportStaticConstants({ mode, platform, flags, forceJitValue, }: ConstantOptions): string;
    genInternalConstants(): string;
    genCCEnv(): string;
    private _genConstantDeclaration;
    private _getConfig;
    private _hasCCGlobal;
    private _hasDynamic;
    private _evalExpression;
    private _applyOptionsToConfig;
}
