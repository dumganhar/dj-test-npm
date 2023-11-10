import { StatsQuery } from '../stats-query';
export declare function build(options: {
    engine: string;
    outDir: string;
    withIndex: boolean;
    withExports: boolean;
    withEditorExports: boolean;
}): Promise<boolean>;
export declare function buildIndexModule(featureUnits: string[], statsQuery: StatsQuery): string;
