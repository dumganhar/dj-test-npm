export type IBuildTimeConstantValue = string | number | boolean;
/**
 * @deprecated since 4.3.5, use `BuildTimeConstants` instead.
 */
export type IBuildTimeConstants = Record<string, IBuildTimeConstantValue>;
/**
 * @deprecated since v4.3.0, use `StatsQuery.prototype.constantManager` instead.
 */
export declare function setupBuildTimeConstants({ mode, platform, flags, }: {
    mode?: string;
    platform: string;
    flags: Record<string, IBuildTimeConstantValue>;
}): Record<string, string | number | boolean>;
export declare function getPlatformConstantNames(): string[];
export declare function getBuildModeConstantNames(): string[];
