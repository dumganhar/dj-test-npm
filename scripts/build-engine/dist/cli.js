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
const fs = __importStar(require("fs-extra"));
const ps = __importStar(require("path"));
const yargs_1 = __importDefault(require("yargs"));
const build_time_constants_1 = require("./build-time-constants");
const index_1 = require("./index");
const stats_query_1 = require("./stats-query");
async function main() {
    var _a;
    yargs_1.default.parserConfiguration({
        'boolean-negation': false,
    });
    yargs_1.default.help();
    yargs_1.default.options('engine', {
        type: 'string',
        demandOption: true,
        description: 'Path to the engine repo.',
    });
    yargs_1.default.option('build-mode', {
        type: 'string',
        alias: 'b',
        description: `Target build-mode. Predefined values: [${(0, build_time_constants_1.getBuildModeConstantNames)().join(',')}]`,
    });
    yargs_1.default.option('platform', {
        type: 'string',
        alias: 'p',
        description: `Target platform. Predefined values: [${(0, build_time_constants_1.getPlatformConstantNames)().join(',')}]`,
        demandOption: true,
    });
    yargs_1.default.option('flags', {
        type: 'array',
        alias: 'f',
        description: 'Engine flags.',
    });
    yargs_1.default.option('module', {
        choices: (0, index_1.enumerateModuleOptionReps)(),
        description: 'Output module format. If not specified, IIFE will be used.',
    });
    yargs_1.default.option('ammojs-wasm', {
        choices: [true, 'fallback'],
    });
    yargs_1.default.option('no-deprecated-features', {
        description: `Whether to remove deprecated features. You can specify boolean or a version string(in semver)`,
        type: 'string',
        coerce: (arg) => (typeof arg !== 'string'
            ? arg
            : ((arg === 'true' || arg.length === 0) ? true : (arg === 'false' ? false : arg))),
    });
    yargs_1.default.option('destination', {
        type: 'string',
        alias: 'd',
        description: '(Removal) Output path. Note, this argument has been removal since V3.0.',
    });
    yargs_1.default.option('out', {
        type: 'string',
        alias: 'o',
        demandOption: true,
        description: 'Output directory.',
    });
    yargs_1.default.option('excludes', {
        type: 'array',
        alias: 'e',
        description: '(Expired!)',
    });
    yargs_1.default.options('sourcemap', {
        choices: [
            'inline',
            true,
        ],
        description: 'Source map generation options',
    });
    yargs_1.default.option('compress', {
        type: 'boolean',
        description: 'Whether to compress compiled engine.',
    });
    yargs_1.default.option('split', {
        type: 'boolean',
        default: false,
        description: 'Whether to generate modular engine.',
    });
    yargs_1.default.option('progress', {
        type: 'boolean',
        default: false,
        description: 'Whether to show build progress.',
    });
    yargs_1.default.option('watch-files', {
        type: 'string',
        description: '(INTERNAL/EXPERIMENTAL) Write built file list as a record with file path as key and mtime as value, into specified file, in JSON format.',
    });
    yargs_1.default.option('visualize', {
        type: 'boolean',
        default: false,
        description: 'Visualize build result. Dev-mode is needed.',
    });
    yargs_1.default.option('visualize-file', {
        type: 'string',
        description: 'Visualizing file. This options implies --visualize.',
    });
    yargs_1.default.option('meta-file', {
        type: 'string',
        description: 'Meta out file.',
    });
    const flags = {};
    const argvFlags = yargs_1.default.argv.flags;
    if (argvFlags) {
        argvFlags.forEach((argvFlag) => flags[argvFlag] = true);
    }
    const sourceMap = yargs_1.default.argv.sourcemap === 'inline' ? 'inline' : !!yargs_1.default.argv.sourcemap;
    const engineRoot = yargs_1.default.argv.engine;
    const statsQuery = await stats_query_1.StatsQuery.create(engineRoot);
    const buildTimeConstants = statsQuery.constantManager.genBuildTimeConstants({
        mode: yargs_1.default.argv.buildMode,
        platform: yargs_1.default.argv.platform,
        flags,
    });
    const noDeprecatedFeatures = yargs_1.default.argv.noDeprecatedFeatures;
    const options = {
        engine: engineRoot,
        split: yargs_1.default.argv.split,
        features: (_a = yargs_1.default.argv._) !== null && _a !== void 0 ? _a : [],
        compress: yargs_1.default.argv.compress,
        out: yargs_1.default.argv.out,
        sourceMap,
        progress: yargs_1.default.argv.progress,
        incremental: yargs_1.default.argv['watch-files'],
        ammoJsWasm: yargs_1.default.argv['ammojs-wasm'],
        noDeprecatedFeatures,
        buildTimeConstants,
    };
    if (yargs_1.default.argv.module) {
        options.moduleFormat = (0, index_1.parseModuleOption)(yargs_1.default.argv.module);
    }
    if (yargs_1.default.argv.visualize) {
        options.visualize = true;
    }
    if (yargs_1.default.argv['visualize-file']) {
        if (typeof options.visualize !== 'object') {
            options.visualize = {};
        }
        options.visualize.file = yargs_1.default.argv['visualize-file'];
    }
    await fs.ensureDir(options.out);
    const result = await (0, index_1.build)(options);
    const metaFile = yargs_1.default.argv['meta-file'];
    if (metaFile) {
        await fs.ensureDir(ps.dirname(metaFile));
        await fs.writeJson(metaFile, result, { spaces: 2 });
    }
    return result.hasCriticalWarns ? 1 : 0;
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
    const retVal = await main();
    process.exit(retVal);
})();
//# sourceMappingURL=cli.js.map