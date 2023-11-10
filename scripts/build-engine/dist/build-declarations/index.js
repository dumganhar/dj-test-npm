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
exports.buildIndexModule = exports.build = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const typescript_1 = __importDefault(require("typescript"));
const gift = __importStar(require("tfig"));
const stats_query_1 = require("../stats-query");
const DEBUG = false;
const REMOVE_OLD = !DEBUG;
const RECOMPILE = !DEBUG;
const REMOVE_UNBUNDLED_CACHE = !DEBUG;
async function build(options) {
    var _a;
    console.log(`Typescript version: ${typescript_1.default.version}`);
    const { engine, outDir, withIndex = true, withExports = false, withEditorExports = false, } = options;
    await fs_extra_1.default.ensureDir(outDir);
    console.debug(`With index: ${withIndex}`);
    console.debug(`With exports: ${withExports}`);
    console.debug(`With editor exports: ${withEditorExports}`);
    const statsQuery = await stats_query_1.StatsQuery.create(engine);
    const tsConfigPath = statsQuery.tsConfigPath;
    const unbundledOutDir = path_1.default.join(outDir, '__before_bundle');
    const parsedCommandLine = typescript_1.default.getParsedCommandLineOfConfigFile(tsConfigPath, {
        declaration: true,
        noEmit: false,
        emitDeclarationOnly: true,
        outFile: undefined,
        outDir: unbundledOutDir,
    }, {
        onUnRecoverableConfigFileDiagnostic: () => { },
        useCaseSensitiveFileNames: typescript_1.default.sys.useCaseSensitiveFileNames,
        readDirectory: typescript_1.default.sys.readDirectory,
        getCurrentDirectory: typescript_1.default.sys.getCurrentDirectory,
        fileExists: typescript_1.default.sys.fileExists,
        readFile: typescript_1.default.sys.readFile,
    });
    if (!parsedCommandLine) {
        throw new Error(`Can not get 'parsedCommandLine'.`);
    }
    const unbundledOutDirNormalized = path_1.default.resolve(engine, parsedCommandLine.options.outDir);
    console.debug(`Unbundled will write to: ${unbundledOutDirNormalized}`);
    await fs_extra_1.default.ensureDir(unbundledOutDirNormalized);
    if (REMOVE_OLD) {
        await fs_extra_1.default.emptyDir(unbundledOutDirNormalized);
    }
    console.log(`Generating...`);
    const featureUnits = statsQuery.getFeatureUnits().filter((m) => m !== 'wait-for-ammo-instantiation');
    const editorExportModules = statsQuery.getEditorPublicModules();
    if (RECOMPILE) {
        let fileNames = parsedCommandLine.fileNames;
        if (withEditorExports) {
            fileNames = fileNames.concat(editorExportModules.map((e) => statsQuery.getEditorPublicModuleFile(e)));
        }
        const program = typescript_1.default.createProgram(fileNames, parsedCommandLine.options);
        const emitResult = program.emit(undefined, // targetSourceFile
        undefined, // writeFile
        undefined, // cancellationToken,
        true, // emitOnlyDtsFiles
        undefined);
        const allDiagnostics = typescript_1.default.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);
        for (const diagnostic of allDiagnostics) {
            let printer;
            switch (diagnostic.category) {
                case typescript_1.default.DiagnosticCategory.Error:
                    printer = console.error;
                    break;
                case typescript_1.default.DiagnosticCategory.Warning:
                    printer = console.warn;
                    break;
                case typescript_1.default.DiagnosticCategory.Message:
                case typescript_1.default.DiagnosticCategory.Suggestion:
                default:
                    printer = console.log;
                    break;
            }
            if (!printer) {
                continue;
            }
            if (diagnostic.file && diagnostic.start !== undefined) {
                const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
                const message = typescript_1.default.flattenDiagnosticMessageText(diagnostic.messageText, typescript_1.default.sys.newLine);
                printer(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
            }
            else {
                printer(`${typescript_1.default.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`);
            }
        }
    }
    // HACK: fix comments generated on top level namespace
    // // TODO:
    // let code = fs.readFileSync(tscOutputDtsFile, 'utf8');
    // const regExpRef = /(\/\/\/ <reference types.*)/g;
    // const matches = code.match(regExpRef);
    // code = code.replace(regExpRef, '');
    // if (matches) {
    //     let outputUnbundledCode = matches.join('\n');
    //     outputUnbundledCode += '\ndeclare const __skip_reference__: never;\n';
    //     outputUnbundledCode += code;
    //     fs.outputFileSync(tscOutputDtsFile, outputUnbundledCode, 'utf8');
    // }
    const patchSpineCoreDtsSource = path_1.default.join(engine, 'cocos', 'spine', 'lib', 'spine-core.d.ts');
    const patchSpineCoreDtsTarget = path_1.default.join(unbundledOutDirNormalized, 'cocos', 'spine', 'lib', 'spine-core.d.ts');
    if (!await fs_extra_1.default.pathExists(patchSpineCoreDtsSource)) {
        console.debug(`Does 'cocos/spine/lib/spine-core.d.ts' no longer existed? I have a patch for it.`);
    }
    else {
        console.debug(`It's ${new Date().toLocaleString()}, we're still doing the hack for spine-core.d.ts`);
        await fs_extra_1.default.ensureDir(path_1.default.dirname(patchSpineCoreDtsTarget));
        await fs_extra_1.default.copyFile(patchSpineCoreDtsSource, patchSpineCoreDtsTarget);
    }
    const types = (_a = parsedCommandLine.options.types) === null || _a === void 0 ? void 0 : _a.map((typeFile) => `${typeFile}.d.ts`);
    if (types) {
        for (const file of types) {
            const destPath = path_1.default.join(unbundledOutDirNormalized, path_1.default.isAbsolute(file) ? path_1.default.basename(file) : file);
            await fs_extra_1.default.ensureDir(path_1.default.dirname(destPath));
            await fs_extra_1.default.copyFile(file, destPath);
        }
    }
    const giftInputs = [];
    const listGiftInputs = async (dir) => {
        for (const file of await fs_extra_1.default.readdir(dir)) {
            const path = path_1.default.join(dir, file);
            // eslint-disable-next-line no-await-in-loop
            const stats = await fs_extra_1.default.stat(path);
            if (stats.isFile()) {
                giftInputs.push(path);
            }
            else if (stats.isDirectory()) {
                // eslint-disable-next-line no-await-in-loop
                await listGiftInputs(path);
            }
        }
    };
    await listGiftInputs(unbundledOutDirNormalized);
    const giftEntries = {};
    const getModuleNameInTsOutFile = (moduleFile) => {
        const path = path_1.default.relative(statsQuery.path, moduleFile);
        const pathDts = path.replace(/\.ts$/, '.d.ts');
        return path_1.default.join(unbundledOutDirNormalized, pathDts);
    };
    if (withExports) {
        for (const exportEntry of featureUnits) {
            giftEntries[exportEntry] = getModuleNameInTsOutFile(statsQuery.getFeatureUnitFile(exportEntry));
        }
    }
    if (withEditorExports) {
        for (const editorExportModule of editorExportModules) {
            giftEntries[editorExportModule] = getModuleNameInTsOutFile(statsQuery.getEditorPublicModuleFile(editorExportModule));
        }
    }
    let ccDtsFile;
    if (withIndex && !withExports) {
        ccDtsFile = path_1.default.join(unbundledOutDirNormalized, 'virtual-cc.d.ts');
        giftEntries.cc = ccDtsFile;
        giftInputs.push(ccDtsFile);
        const code = `// Auto-generated\n${statsQuery.evaluateIndexModuleSource(featureUnits, (featureUnit) => getModuleNameInTsOutFile(statsQuery.getFeatureUnitFile(featureUnit)).replace(/\\/g, '/').replace(/\.d.ts$/, ''))}\n`;
        await fs_extra_1.default.writeFile(ccDtsFile, code, { encoding: 'utf8' });
    }
    console.log(`Bundling...`);
    try {
        const indexOutputPath = path_1.default.join(outDir, 'cc.d.ts');
        const giftResult = gift.bundle({
            input: giftInputs,
            rootDir: unbundledOutDirNormalized,
            name: 'cc',
            rootModule: 'index',
            entries: giftEntries,
            priority: [
                ...(ccDtsFile ? [ccDtsFile] : []), // Things should be exported to 'cc' as far as possible.
            ],
            privateJsDocTag: 'engineInternal',
            groups: [
                { test: /^cc\/editor.*$/, path: path_1.default.join(outDir, 'cc.editor.d.ts') },
                { test: /^cc\/.*$/, path: path_1.default.join(outDir, 'index.d.ts') },
                { test: /^cc.*$/, path: indexOutputPath },
            ],
            nonExportedSymbolDistribution: [{
                    sourceModule: /cocos\/animation\/marionette/,
                    targetModule: 'cc/editor/new-gen-anim',
                }, {
                    sourceModule: /.*/,
                    targetModule: 'cc',
                }],
        });
        await Promise.all(giftResult.groups.map(async (group) => {
            await fs_extra_1.default.outputFile(group.path, group.code, { encoding: 'utf8' });
        }));
        if (withIndex && withExports) {
            await fs_extra_1.default.outputFile(indexOutputPath, buildIndexModule(featureUnits, statsQuery), { encoding: 'utf8' });
        }
    }
    catch (error) {
        console.error(error);
        return false;
    }
    finally {
        if (REMOVE_UNBUNDLED_CACHE) {
            await fs_extra_1.default.remove(unbundledOutDirNormalized);
        }
    }
    return true;
}
exports.build = build;
function buildIndexModule(featureUnits, statsQuery) {
    return `declare module "cc" {\n${statsQuery.evaluateIndexModuleSource(featureUnits)
        .split('\n')
        .map((line) => `    ${line}`)
        .join('\n')}\n}`;
}
exports.buildIndexModule = buildIndexModule;
//# sourceMappingURL=index.js.map