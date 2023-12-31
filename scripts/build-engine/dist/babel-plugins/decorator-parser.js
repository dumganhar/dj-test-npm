"use strict";
/* eslint-disable space-before-function-paren */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable max-len */
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
const generator_1 = __importDefault(require("@babel/generator"));
const traverse_1 = __importDefault(require("@babel/traverse"));
const parser = __importStar(require("@babel/parser"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const enginePath = process.env.ENGINE_PATH;
const applyFnName = `apply`;
function getParentNodes(path) {
    const parents = [];
    let target = path;
    while (target) {
        parents.push(target.node);
        target = target.parentPath;
    }
    parents.reverse();
    return parents;
}
function isInFunctionDeclaration(path) {
    return getParentNodes(path.parentPath).some((parent) => parent.type === 'FunctionDeclaration');
}
/**
 * collectt all variables which is defined outside current function and save into `ctx`
 */
function collectGlobalVars(code, oldPath, ctx) {
    try {
        const ast = parser.parse(code);
        (0, traverse_1.default)(ast, {
            ReferencedIdentifier(path) {
                const name = path.node.name;
                if (path.scope.hasBinding(name, true)) {
                    return;
                }
                if (name === 'arguments') {
                    if (isInFunctionDeclaration(path))
                        return;
                }
                if (name in globalThis) {
                    return;
                }
                if (ctx.identifiers.indexOf(path.node.name) === -1) {
                    ctx.identifiers.push(path.node.name);
                }
            },
        });
    }
    catch (e) {
        try {
            const result = visitAst(oldPath);
            mergeArray(ctx.declTypes, result.types);
            mergeArray(ctx.identifiers, result.identifiers);
        }
        catch (ee) {
            console.error(ee);
        }
    }
}
/**
 * convert decorators to `DecoratorParsedResult[]`
 */
function parseNodeDecorators(targetNode, decorators, classCtx) {
    var _a, _b;
    const result = [];
    const attrName = (_b = (_a = targetNode === null || targetNode === void 0 ? void 0 : targetNode.key) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : '';
    const attrValue = targetNode.value ? (0, generator_1.default)(targetNode.value).code : 'undefined';
    const isGetterOrSetter = targetNode.kind === 'get' || targetNode.kind === 'set';
    if (targetNode.value) {
        collectGlobalVars(attrValue, targetNode.value, classCtx);
    }
    for (const decor of decorators) {
        if (decor.expression.type === 'CallExpression') {
            const content = { decoratorName: decor.expression.callee.name };
            content.attrName = attrName;
            content.attrValue = attrValue;
            content.isGetterOrSetter = isGetterOrSetter;
            try {
                const argNodesCode = decor.expression.arguments.map((a) => {
                    const argCode = (0, generator_1.default)(a).code;
                    collectGlobalVars(argCode, a, classCtx);
                    return argCode;
                });
                content.decoratorArgs = argNodesCode;
            }
            catch (e) {
                console.error(`  @[failed]${decor.expression.callee.name} / ${targetNode.key.name}`);
                continue;
            }
            result.push(content);
        }
        else if (decor.expression.type === 'Identifier') {
            result.push({ decoratorName: decor.expression.name, attrName, attrValue, isGetterOrSetter });
        }
        else {
            console.error(`unknown decorator type ${decor.expression.type}`);
        }
    }
    return result;
}
// head content for the generated file
const outputLines = [];
outputLines.push(`/* This file is generated by script, do not modify it manually. */`);
outputLines.push('');
outputLines.push(`/* eslint-disable @typescript-eslint/no-unsafe-return */`);
outputLines.push(`/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */`);
outputLines.push(`/* eslint-disable brace-style */`);
outputLines.push(`/* eslint-disable @typescript-eslint/indent */`);
outputLines.push(`/* eslint-disable max-len */`);
outputLines.push(`/* eslint-disable arrow-body-style */`);
outputLines.push(`/* eslint-disable comma-dangle */`);
outputLines.push(`/* eslint-disable func-names */`);
outputLines.push(`/* eslint-disable space-before-function-paren */`);
outputLines.push('');
outputLines.push(`import * as $$ from 'cc.decorator';`);
outputLines.push(`import { _decorator as $ } from '../core';`);
outputLines.push('');
outputLines.push(`const defaultExec = (cb: () => void, decorator?: string, attr?: string | null) => { cb(); };`);
// write lines to file through IPC messages
function writeLines(lines, className) {
    process.emit('message', { event: 'write-decorator', lines, className }, null);
}
writeLines(outputLines, '');
function mergeArray(dst, src) {
    for (const e of src) {
        if (dst.indexOf(e) === -1) {
            dst.push(e);
        }
    }
}
/**
 * generate variable names for property descriptors
 */
function allocPropVariable(className, property) {
    return `${property}Descriptor`;
}
function nameDecorators(name) {
    if (name.startsWith('rangeM') || name === 'readOnly' || name === 'editorOnly') {
        // these decorators are exported by `import { _decorator as $ } from '../core';`
        // should be referenced from `cc.decorator`
        return `$$.${name}`;
    }
    return `$.${name}`;
}
/**
 * convert class decorator to text
 */
function cvtClassDecorators(className) {
    return (d) => `  ${nameDecorators(d.decoratorName)}${d.decoratorArgs ? `(${d.decoratorArgs.join(',')})` : ''}(${className})`;
}
/**
 *  convert property decorator to text
 */
function cvtPropDecorators(className, ctx) {
    return (d) => {
        let gs;
        if (d.isGetterOrSetter) {
            gs = allocPropVariable(className, d.attrName);
            const found = ctx.descriptors.reduce((p, c) => p || c.name === gs, false);
            if (!found) {
                ctx.descriptors.push({ name: gs, decl: `const ${gs} = Object.getOwnPropertyDescriptor(${className}.prototype, '${d.attrName}');` });
            }
        }
        return `    ${nameDecorators(d.decoratorName)}${d.decoratorArgs ? `(${d.decoratorArgs.join(',')})` : ''}(${className}.prototype, '${d.attrName}',  ${gs || `() => { return ${d.attrValue}; }`})`;
    };
}
function recordDecorators() {
    return {
        name: 'decorator-collector',
        visitor: {
            ClassDeclaration(nodePath, state) {
                var _a, _b;
                const superClass = nodePath.node.superClass;
                let superClassName = null;
                if (superClass) {
                    if (superClass.type === 'Identifier') {
                        superClassName = superClass.name;
                    }
                    else {
                        superClassName = 'others';
                    }
                }
                if (superClassName === 'Component') {
                    // filter #1, all sub classes of `Component`
                    return;
                }
                else if (superClassName === 'others') {
                    const fileName = (_b = (_a = state === null || state === void 0 ? void 0 : state.file) === null || _a === void 0 ? void 0 : _a.opts) === null || _b === void 0 ? void 0 : _b.filename;
                    if (fileName && fileName.indexOf('component') >= 0) {
                        // filter #2, skip files which path contains `component` && may be sub class of Compnonet
                        return;
                    }
                }
                const currentClassName = nodePath.node.id.name;
                const classDecoratorNodes = nodePath.node.decorators;
                let classDecoratorResults = [];
                if (!classDecoratorNodes) { // filter #3, no decorators for current class
                    return;
                }
                const cppClasses = getExportedClassesFromCppSourceCode();
                if (!cppClasses.has(currentClassName)) { // filter #4, no C++ binding type found with the same name
                    return;
                }
                const detail = cppClasses.get(currentClassName);
                if (detail.length > 1) {
                    console.warn(`class ${currentClassName} has ${detail.length} JSB class: ${detail.map((d) => `${d.tip}.${d.name}`).join(', ')}`);
                }
                let classContent = []; // file content to write for current class
                const decoratorCtx = {
                    commands: [],
                    descriptors: [],
                    identifiers: [currentClassName],
                    className: currentClassName,
                    declTypes: [],
                };
                classDecoratorResults = parseNodeDecorators(nodePath.node, classDecoratorNodes, decoratorCtx);
                const classNameByDecorator = classDecoratorResults.filter((x) => x.decoratorName === 'ccclass').map((x) => x.decoratorArgs[0].replace(/['"]/g, '').replace(/\./g, '_'));
                // filter #5, return if no ccclass found or classes from `sp.` (spine) modules
                // Add more conditions if classes need to be skipped.
                if (classNameByDecorator.length === 0 || classNameByDecorator[0].startsWith('sp_')) {
                    return;
                }
                let classDecorator_Lines = classDecoratorResults.map(cvtClassDecorators(currentClassName));
                classDecorator_Lines = classDecorator_Lines.map((x, idx) => `  ${applyFnName}(() => { ${x.trim()}; }, '${classDecoratorResults[idx].decoratorName}', null);`);
                const ccclassName = classNameByDecorator.length > 0 ? classNameByDecorator[0] : currentClassName;
                const contextArgType = `${ccclassName}_Context_Args`;
                let propDecorator_Lines = [];
                const children = nodePath.node.body.body;
                for (const decro of children) {
                    if (decro.decorators) {
                        const memberDecorators = parseNodeDecorators(decro, decro.decorators, decoratorCtx);
                        let memberLines = memberDecorators.map(cvtPropDecorators(currentClassName, decoratorCtx));
                        memberLines = memberLines.map((x, idx) => `  ${applyFnName}(() => { ${x.trim()}; }, '${memberDecorators[idx].decoratorName}', '${memberDecorators[idx].attrName}');`);
                        propDecorator_Lines = propDecorator_Lines.concat(memberLines.reverse().join('\n'));
                    }
                }
                // assemble file content
                classContent.push(`\n//---- class ${ccclassName}`);
                classContent.push(`interface ${contextArgType} {`); // argument type interface defination
                if (decoratorCtx.identifiers.length > 0) {
                    for (const id of decoratorCtx.identifiers) {
                        classContent.push(`   ${id}: any;`); // field for argument type
                    }
                }
                classContent.push(`}`);
                classContent.push(`export function patch_${ccclassName}(ctx: ${contextArgType}, ${applyFnName} = defaultExec) {`);
                for (const tp of decoratorCtx.declTypes) {
                    classContent.push(`  type ${tp} = any;`); // type alias using in current funtion, set to any type.
                }
                if (decoratorCtx.identifiers.length > 0) {
                    const contextArgs = decoratorCtx.identifiers;
                    classContent.push(`  const { ${contextArgs.join(', ')} } = { ...ctx };`); // unpack all variables from argument
                }
                if (decoratorCtx.descriptors.length > 0) {
                    // local variables for propert descriptors
                    classContent = classContent.concat(decoratorCtx.descriptors.map((d) => `  ${d.decl}`).join('\n'));
                }
                classContent = classContent.concat(propDecorator_Lines); // property decorators
                classContent = classContent.concat(classDecorator_Lines.reverse().join('\n')); // class decorators
                classContent.push(`} // end of patch_${ccclassName}`);
                writeLines(classContent, ccclassName);
            },
        },
    };
}
exports.default = recordDecorators;
const cppClassMap = new Map();
function getExportedClassesFromCppSourceCode() {
    if (cppClassMap.size > 0) {
        return cppClassMap;
    }
    const cppSourceFiles = [];
    const toFullPath = (prefix) => (filename) => path_1.default.join(prefix, filename);
    const findInDir = (filterCb) => (dir) => fs_1.default.readdirSync(dir).filter(filterCb).map(toFullPath(dir)).forEach((fp) => cppSourceFiles.push(fp));
    ['native/cocos/bindings/manual', 'native/build/generated/cocos/bindings/auto'].map(toFullPath(enginePath)).forEach(findInDir((x) => x.startsWith('jsb_') && x.endsWith('.cpp')));
    const se_Class_create = /se::Class::create\((\{("\w+",\s*"\w+")+\}|("\w+"))/;
    const skipChars = /["{}]/;
    console.log('searching for exported classes');
    function trimClassName(x) {
        let start = 0;
        let end = x.length - 1;
        const len = x.length;
        while (start < len && skipChars.test(x[start]))
            start++;
        while (end > 0 && skipChars.test(x[end]))
            end--;
        return start < end ? x.substring(start, end + 1) : '';
    }
    function tideClassName(str) {
        return str.split(',').map((x) => trimClassName(x.trim()));
    }
    for (const file of cppSourceFiles) {
        fs_1.default.readFileSync(file, 'utf8').split('\n').map((x) => x.trim()).filter((x) => {
            const createClassR = se_Class_create.exec(x);
            if (createClassR) {
                const pathComps = path_1.default.basename(file).split('_')[1];
                if (pathComps.includes('dragonbone') || pathComps.includes('spine')) {
                    // filter #6, skip spine/dragonbones binding source files
                    return null;
                }
                const classNameComps = tideClassName(createClassR[1] ? createClassR[1] : createClassR[2]);
                const className = classNameComps[classNameComps.length - 1];
                let classItems = cppClassMap.get(className);
                if (!classItems) {
                    classItems = [];
                    cppClassMap.set(classNameComps[0], classItems);
                }
                classItems.push({ file, name: classNameComps.join('.'), tip: pathComps });
                if (classItems.length > 1) {
                    console.error(`Multiple classes found: ${className} / ${classItems.map((x) => `${path_1.default.basename(x.file)}:${x.name}`).join(', ')} . ${file}`);
                }
            }
            return createClassR;
        });
    }
    return cppClassMap;
}
function debugLog(...args) {
    // console.log.apply(console, args);
}
class VisitContext {
    constructor() {
        this.identifiers = [];
        this.types = [];
    }
    addIdentifier(identifier) {
        if (this.identifiers.indexOf(identifier) === -1) {
            this.identifiers.push(identifier);
        }
    }
    addType(type) {
        if (this.types.indexOf(type) === -1) {
            this.types.push(type);
        }
    }
    reset() {
        this.identifiers.length = 0;
        this.types.length = 0;
    }
    dump() {
        if (this.types.length > 0 || this.identifiers.length > 0) {
            console.log(`types: ${this.types.join(',')}`);
            console.log(`identifiers: ${this.identifiers.join(',')}`);
        }
    }
}
const context = new VisitContext();
var p;
(function (p_1) {
    function Identifier(np) {
        if (np.typeAnnotation) {
            // context.addType(np.typeAnnotation);
            visitAstRecursive(np.typeAnnotation);
        }
        debugLog(`[${np.type}] ${np.name}`);
    }
    p_1.Identifier = Identifier;
    function Import(np) {
        debugLog(`[import]`);
    }
    p_1.Import = Import;
    function StringLiteral(np) {
        debugLog(`[${np.type}] "${np.value}"`);
    }
    p_1.StringLiteral = StringLiteral;
    function SequenceExpression(np) {
        debugLog(`[sequence expression]`);
        for (const d of np.expressions) {
            visitAstRecursive(d);
        }
    }
    p_1.SequenceExpression = SequenceExpression;
    function ClassDeclaration(np) {
        debugLog(`[class def] skipped`);
    }
    p_1.ClassDeclaration = ClassDeclaration;
    function ObjectExpression(np) {
        for (const p of np.properties) {
            visitAstRecursive(p);
        }
    }
    p_1.ObjectExpression = ObjectExpression;
    function ObjectMethod(np) {
        debugLog(`[obj method] ${np.kind}`);
        visitAstRecursive(np.key);
        for (const p of np.params) {
            visitAstRecursive(p);
        }
        visitAstRecursive(np.body);
        if (np.returnType)
            visitAstRecursive(np.returnType);
        if (np.typeParameters)
            visitAstRecursive(np.typeParameters);
    }
    p_1.ObjectMethod = ObjectMethod;
    function ObjectProperty(np) {
        debugLog(`[obj property]`);
        visitAstRecursive(np.key);
        visitAstRecursive(np.value);
    }
    p_1.ObjectProperty = ObjectProperty;
    function ExportNamedDeclaration(np) {
        console.error(`[export named] skipped`);
    }
    p_1.ExportNamedDeclaration = ExportNamedDeclaration;
    function ExportDefaultDeclaration(np) {
        console.error(`[export default] skipped`);
    }
    p_1.ExportDefaultDeclaration = ExportDefaultDeclaration;
    function ExportAllDeclaration(np) {
        console.error(`[export all] skipped`);
    }
    p_1.ExportAllDeclaration = ExportAllDeclaration;
    function ExportSpecifier(np) {
        console.error(`[export specifier] skipped`);
    }
    p_1.ExportSpecifier = ExportSpecifier;
    function ImportDeclaration(np) {
        console.error(`[import declaration] skipped`);
    }
    p_1.ImportDeclaration = ImportDeclaration;
    function UpdateExpression(np) {
        debugLog(`[update] ${np.operator}, prefix: ${np.prefix}`);
        visitAstRecursive(np.argument);
    }
    p_1.UpdateExpression = UpdateExpression;
    function ObjectPattern(np) {
        debugLog(`[objectpattern]`);
        for (const p of np.properties) {
            visitAstRecursive(p);
        }
        if (np.typeAnnotation) {
            visitAstRecursive(np.typeAnnotation);
        }
    }
    p_1.ObjectPattern = ObjectPattern;
    function ArrayPattern(np) {
        debugLog(`[arraypattern]`);
        for (const p of np.elements) {
            if (p) { // TODO: handle null elements
                visitAstRecursive(p);
            }
        }
        if (np.typeAnnotation) {
            visitAstRecursive(np.typeAnnotation);
        }
    }
    p_1.ArrayPattern = ArrayPattern;
    function ArrayExpression(np) {
        for (const ele of np.elements) {
            if (ele)
                visitAstRecursive(ele); // skip null elements?
        }
    }
    p_1.ArrayExpression = ArrayExpression;
    function ThisExpression(np) {
        debugLog(`[this]`);
    }
    p_1.ThisExpression = ThisExpression;
    function Super(np) {
        debugLog(`[super]`);
    }
    p_1.Super = Super;
    function TSTypeAssertion(np) {
        debugLog(`[type assertion]`);
        visitAstRecursive(np.typeAnnotation);
        visitAstRecursive(np.expression);
    }
    p_1.TSTypeAssertion = TSTypeAssertion;
    function TSPropertySignature(np) {
        debugLog(`[ts prop]`);
        visitAstRecursive(np.key);
        if (np.initializer)
            visitAstRecursive(np.initializer);
        if (np.typeAnnotation)
            visitAstRecursive(np.typeAnnotation);
    }
    p_1.TSPropertySignature = TSPropertySignature;
    function TSMethodSignature(np) {
        debugLog(`[ts method]`);
        visitAstRecursive(np.key);
        for (const p of np.parameters) {
            visitAstRecursive(p);
        }
        if (np.typeParameters)
            visitAstRecursive(np.typeParameters);
        if (np.typeAnnotation)
            visitAstRecursive(np.typeAnnotation);
    }
    p_1.TSMethodSignature = TSMethodSignature;
    function TSIndexSignature(np) {
        debugLog(`[ts index]`);
        for (const p of np.parameters) {
            visitAstRecursive(p);
        }
        if (np.typeAnnotation)
            visitAstRecursive(np.typeAnnotation);
    }
    p_1.TSIndexSignature = TSIndexSignature;
    function MemberExpression(np) {
        debugLog(`[member]: optional ${np.optional}`);
        visitAstRecursive(np.object);
        visitAstRecursive(np.property);
        if (np.object.type === 'Identifier') {
            context.addIdentifier(np.object.name);
        }
    }
    p_1.MemberExpression = MemberExpression;
    function OptionalMemberExpression(np) {
        debugLog(`[optional-member]: optional ${np.optional}`);
        visitAstRecursive(np.object);
        visitAstRecursive(np.property);
    }
    p_1.OptionalMemberExpression = OptionalMemberExpression;
    function VariableDeclaration(np) {
        debugLog(`[var] ${np.kind}`);
        for (const v of np.declarations) {
            visitAstRecursive(v);
        }
    }
    p_1.VariableDeclaration = VariableDeclaration;
    function TSQualifiedName(np) {
        debugLog(`[qualified]`);
        visitAstRecursive(np.left);
        visitAstRecursive(np.right);
    }
    p_1.TSQualifiedName = TSQualifiedName;
    function VariableDeclarator(np) {
        debugLog(`[var instant] definite ${np.definite}`);
        visitAstRecursive(np.id);
        if (np.init)
            visitAstRecursive(np.init);
    }
    p_1.VariableDeclarator = VariableDeclarator;
    function FunctionExpression(np) {
        debugLog(`[function]`);
        if (np.id) {
            visitAstRecursive(np.id);
        }
        // param
        if (np.params) {
            for (const p of np.params) {
                visitAstRecursive(p);
            }
        }
        // body
        if (np.body) {
            visitAstRecursive(np.body);
        }
        if (np.returnType) {
            visitAstRecursive(np.returnType);
        }
        if (np.typeParameters) {
            visitAstRecursive(np.typeParameters);
        }
    }
    p_1.FunctionExpression = FunctionExpression;
    function ArrowFunctionExpression(np) {
        debugLog(`[arrow-function]`);
        // param
        for (const p of np.params) {
            if (p)
                visitAstRecursive(p); // null should be acceptable
        }
        // body
        visitAstRecursive(np.body);
        if (np.returnType) {
            visitAstRecursive(np.returnType);
        }
        if (np.typeParameters) {
            visitAstRecursive(np.typeParameters);
        }
        if (np.predicate) {
            visitAstRecursive(np.predicate);
        }
    }
    p_1.ArrowFunctionExpression = ArrowFunctionExpression;
    function NewExpression(np) {
        debugLog(`[new]`);
        visitAstRecursive(np.callee);
        for (const p of np.arguments) {
            visitAstRecursive(p);
        }
        if (np.typeArguments) {
            visitAstRecursive(np.typeArguments);
        }
        if (np.typeParameters) {
            visitAstRecursive(np.typeParameters);
        }
    }
    p_1.NewExpression = NewExpression;
    function TryStatement(np) {
        debugLog(`[TryStatement]`);
        visitAstRecursive(np.block);
        if (np.handler)
            visitAstRecursive(np.handler);
        if (np.finalizer)
            visitAstRecursive(np.finalizer);
    }
    p_1.TryStatement = TryStatement;
    function CatchClause(np) {
        debugLog(`[CatchClause]`);
        if (np.param)
            visitAstRecursive(np.param);
        visitAstRecursive(np.body);
    }
    p_1.CatchClause = CatchClause;
    function BlockStatement(np) {
        debugLog(`[block]`);
        for (const d of np.directives) {
            visitAstRecursive(d);
        }
        for (const p of np.body) {
            visitAstRecursive(p);
        }
    }
    p_1.BlockStatement = BlockStatement;
    function ExpressionStatement(np) {
        debugLog(`[expression]`);
        visitAstRecursive(np.expression);
    }
    p_1.ExpressionStatement = ExpressionStatement;
    function CallExpression(np) {
        debugLog(`[call]`);
        visitAstRecursive(np.callee);
        for (const a of np.arguments) {
            visitAstRecursive(a);
        }
        if (np.typeArguments) {
            visitAstRecursive(np.typeArguments);
        }
        if (np.typeParameters) {
            visitAstRecursive(np.typeParameters);
        }
    }
    p_1.CallExpression = CallExpression;
    function OptionalCallExpression(np) {
        debugLog(`[optional call?]`);
        visitAstRecursive(np.callee);
        for (const a of np.arguments) {
            visitAstRecursive(a);
        }
        if (np.typeArguments) {
            visitAstRecursive(np.typeArguments);
        }
        if (np.typeParameters) {
            visitAstRecursive(np.typeParameters);
        }
    }
    p_1.OptionalCallExpression = OptionalCallExpression;
    function AssignmentPattern(np) {
        debugLog(`[assignment pattern] optional: ${np.optional}`);
        visitAstRecursive(np.left);
        visitAstRecursive(np.right);
        if (np.typeAnnotation) {
            visitAstRecursive(np.typeAnnotation);
        }
    }
    p_1.AssignmentPattern = AssignmentPattern;
    function AssignmentExpression(np) {
        debugLog(`[assignment] ${np.operator}`);
        visitAstRecursive(np.left);
        visitAstRecursive(np.right);
    }
    p_1.AssignmentExpression = AssignmentExpression;
    function RestElement(np) {
        debugLog(`[rest element] optional: ${np.optional}`);
        visitAstRecursive(np.argument);
        if (np.typeAnnotation) {
            visitAstRecursive(np.typeAnnotation);
        }
    }
    p_1.RestElement = RestElement;
    function SpreadElement(np) {
        debugLog(`[spread]`);
        visitAstRecursive(np.argument);
    }
    p_1.SpreadElement = SpreadElement;
    function LogicalExpression(np) {
        debugLog(`[logical] ${np.operator}`);
        visitAstRecursive(np.left);
        visitAstRecursive(np.right);
    }
    p_1.LogicalExpression = LogicalExpression;
    function ConditionalExpression(np) {
        debugLog(`[conditional] ${np.test}`);
        visitAstRecursive(np.test);
        visitAstRecursive(np.consequent);
        visitAstRecursive(np.alternate);
    }
    p_1.ConditionalExpression = ConditionalExpression;
    function BinaryExpression(np) {
        debugLog(`[binary] ${np.operator}`);
        visitAstRecursive(np.left);
        visitAstRecursive(np.right);
    }
    p_1.BinaryExpression = BinaryExpression;
    function SwitchStatement(np) {
        debugLog(`[switch]`);
        visitAstRecursive(np.discriminant);
        for (const c of np.cases) {
            visitAstRecursive(c);
        }
    }
    p_1.SwitchStatement = SwitchStatement;
    function SwitchCase(np) {
        debugLog(`[switch cast]`);
        if (np.test)
            visitAstRecursive(np.test);
        for (const c of np.consequent) {
            visitAstRecursive(c);
        }
    }
    p_1.SwitchCase = SwitchCase;
    function ThrowStatement(np) {
        debugLog(`[throw]`);
        visitAstRecursive(np.argument);
    }
    p_1.ThrowStatement = ThrowStatement;
    function BreakStatement(np) {
        debugLog(`[break]`);
        if (np.label)
            visitAstRecursive(np.label);
    }
    p_1.BreakStatement = BreakStatement;
    function ContinueStatement(np) {
        debugLog(`[continue]`);
        if (np.label)
            visitAstRecursive(np.label);
    }
    p_1.ContinueStatement = ContinueStatement;
    function LabeledStatement(np) {
        debugLog(`[label]`);
        visitAstRecursive(np.label);
        visitAstRecursive(np.body);
    }
    p_1.LabeledStatement = LabeledStatement;
    function YieldExpression(np) {
        debugLog(`[yield] delegate ${np.delegate}`);
        if (np.argument)
            visitAstRecursive(np.argument);
    }
    p_1.YieldExpression = YieldExpression;
    function AwaitExpression(np) {
        debugLog(`[await]`);
        visitAstRecursive(np.argument);
    }
    p_1.AwaitExpression = AwaitExpression;
    function IfStatement(np) {
        debugLog(`[if]`);
        visitAstRecursive(np.test);
        visitAstRecursive(np.consequent);
        if (np.alternate) {
            visitAstRecursive(np.alternate);
        }
    }
    p_1.IfStatement = IfStatement;
    function DoWhileStatement(np) {
        debugLog(`[do while]`);
        visitAstRecursive(np.body);
        visitAstRecursive(np.test);
    }
    p_1.DoWhileStatement = DoWhileStatement;
    function WhileStatement(np) {
        debugLog(`[while]`);
        visitAstRecursive(np.test);
        visitAstRecursive(np.body);
    }
    p_1.WhileStatement = WhileStatement;
    function ForInStatement(np) {
        debugLog(`[for in]`);
        visitAstRecursive(np.left);
        visitAstRecursive(np.right);
        visitAstRecursive(np.body);
    }
    p_1.ForInStatement = ForInStatement;
    function ForOfStatement(np) {
        debugLog(`[for of]`);
        visitAstRecursive(np.left);
        visitAstRecursive(np.right);
        visitAstRecursive(np.body);
    }
    p_1.ForOfStatement = ForOfStatement;
    function ForStatement(np) {
        debugLog(`[for]`);
        if (np.init)
            visitAstRecursive(np.init);
        if (np.test)
            visitAstRecursive(np.test);
        if (np.update)
            visitAstRecursive(np.update);
        visitAstRecursive(np.body);
    }
    p_1.ForStatement = ForStatement;
    function ReturnStatement(np) {
        debugLog(`[return]`);
        if (np.argument) {
            visitAstRecursive(np.argument);
        }
    }
    p_1.ReturnStatement = ReturnStatement;
    function TSTypeParameterDeclaration(np) {
        debugLog(`[parameter decl]`);
        for (const p of np.params) {
            visitAstRecursive(p);
        }
    }
    p_1.TSTypeParameterDeclaration = TSTypeParameterDeclaration;
    function TSTypeParameter(np) {
        debugLog(`[type parameter] ${np.name}, const ${np.const}, in: ${np.in}, out: ${np.out}`);
        if (np.constraint)
            visitAstRecursive(np.constraint);
        if (np.default)
            visitAstRecursive(np.default);
    }
    p_1.TSTypeParameter = TSTypeParameter;
    function TSNonNullExpression(np) {
        debugLog(`[non-null]`);
        visitAstRecursive(np.expression);
    }
    p_1.TSNonNullExpression = TSNonNullExpression;
    function FunctionDeclaration(np) {
        debugLog(`[function-decl]`);
        if (np.id)
            visitAstRecursive(np.id);
        for (const p of np.params) {
            visitAstRecursive(p);
        }
        visitAstRecursive(np.body);
        if (np.returnType) {
            visitAstRecursive(np.returnType);
        }
        if (np.typeParameters) {
            visitAstRecursive(np.typeParameters);
        }
    }
    p_1.FunctionDeclaration = FunctionDeclaration;
    function TSAsExpression(np) {
        debugLog(`[as]`);
        visitAstRecursive(np.expression);
        visitAstRecursive(np.typeAnnotation);
    }
    p_1.TSAsExpression = TSAsExpression;
    function TSTypeAnnotation(np) {
        debugLog(`[typeAnnotation]`);
        visitAstRecursive(np.typeAnnotation);
    }
    p_1.TSTypeAnnotation = TSTypeAnnotation;
    function TSTypeParameterInstantiation(np) {
        debugLog(`[type-instantiation]`);
        for (const t of np.params) {
            visitAstRecursive(t);
        }
    }
    p_1.TSTypeParameterInstantiation = TSTypeParameterInstantiation;
    function TSType(np) {
    }
    p_1.TSType = TSType;
    function TSAnyKeyword(np) {
        debugLog(`[TSType] any`);
    }
    p_1.TSAnyKeyword = TSAnyKeyword;
    function TSBooleanKeyword(np) {
        debugLog(`[TSType] boolean`);
    }
    p_1.TSBooleanKeyword = TSBooleanKeyword;
    function TSBigIntKeyword(np) {
        debugLog(`[TSType] BigInt`);
    }
    p_1.TSBigIntKeyword = TSBigIntKeyword;
    function TSIntrinsicKeyword(np) {
        debugLog(`[TSType] instrinsic`);
    }
    p_1.TSIntrinsicKeyword = TSIntrinsicKeyword;
    function TSNeverKeyword(np) {
        debugLog(`[TSType] never`);
    }
    p_1.TSNeverKeyword = TSNeverKeyword;
    function TSNullKeyword(np) {
        debugLog(`[TSType] null`);
    }
    p_1.TSNullKeyword = TSNullKeyword;
    function TSNumberKeyword(np) {
        debugLog(`[TSType] number`);
    }
    p_1.TSNumberKeyword = TSNumberKeyword;
    function TSObjectKeyword(np) {
        debugLog(`[TSType] object`);
    }
    p_1.TSObjectKeyword = TSObjectKeyword;
    function TSStringKeyword(np) {
        debugLog(`[TSType] string`);
    }
    p_1.TSStringKeyword = TSStringKeyword;
    function TSSymbolKeyword(np) {
        debugLog(`[TSType] symbol`);
    }
    p_1.TSSymbolKeyword = TSSymbolKeyword;
    function TSUndefinedKeyword(np) {
        debugLog(`[TSType] undefined`);
    }
    p_1.TSUndefinedKeyword = TSUndefinedKeyword;
    function TSUnknownKeyword(np) {
        debugLog(`[TSType] unknown`);
    }
    p_1.TSUnknownKeyword = TSUnknownKeyword;
    function TSVoidKeyword(np) {
        debugLog(`[TSType] void`);
    }
    p_1.TSVoidKeyword = TSVoidKeyword;
    function TSThisType(np) {
        debugLog(`[TSType] this`);
    }
    p_1.TSThisType = TSThisType;
    function TSFunctionType(np) {
        if (np.typeParameters) {
            visitAstRecursive(np.typeParameters);
        }
        for (const p of np.parameters) {
            visitAstRecursive(p);
        }
        if (np.typeAnnotation) {
            visitAstRecursive(np.typeAnnotation);
        }
    }
    p_1.TSFunctionType = TSFunctionType;
    function TSConstructorType(np) {
        console.error(`[TSType] constructor not allowed`);
    }
    p_1.TSConstructorType = TSConstructorType;
    function TSTypeReference(np) {
        visitAstRecursive(np.typeName);
        if (np.typeName.type === 'Identifier') {
            context.addType(np.typeName.name);
        }
    }
    p_1.TSTypeReference = TSTypeReference;
    function TSTypePredicate(np) {
        visitAstRecursive(np.parameterName);
        if (np.typeAnnotation)
            visitAstRecursive(np.typeAnnotation);
    }
    p_1.TSTypePredicate = TSTypePredicate;
    function TSTypeQuery(np) {
        visitAstRecursive(np.exprName);
        if (np.typeParameters) {
            visitAstRecursive(np.typeParameters);
        }
    }
    p_1.TSTypeQuery = TSTypeQuery;
    function TemplateLiteral(np) {
        debugLog(`[Template literal]`);
        for (const e of np.quasis) {
            visitAstRecursive(e);
        }
        for (const e of np.expressions) {
            visitAstRecursive(e);
        }
    }
    p_1.TemplateLiteral = TemplateLiteral;
    function TemplateElement(np) {
        debugLog(`[templ element] raw: ${np.value.raw}, cooked: ${np.value.cooked}, tail: ${np.tail}`);
    }
    p_1.TemplateElement = TemplateElement;
    function TSTypeLiteral(np) {
        debugLog(`[TSType] type literal`);
        for (const p of np.members) {
            visitAstRecursive(p);
        }
    }
    p_1.TSTypeLiteral = TSTypeLiteral;
    function TSArrayType(np) {
        debugLog(`[TSType] array`);
        visitAstRecursive(np.elementType);
    }
    p_1.TSArrayType = TSArrayType;
    function TSTupleType(np) {
        debugLog(`[TSType] tuple`);
        for (const p of np.elementTypes) {
            visitAstRecursive(p);
        }
    }
    p_1.TSTupleType = TSTupleType;
    function TSOptionalType(np) {
        debugLog(`[TSType] optional`);
        visitAstRecursive(np.typeAnnotation);
    }
    p_1.TSOptionalType = TSOptionalType;
    function TSRestType(np) {
        debugLog(`[TSType] rest`);
        visitAstRecursive(np.typeAnnotation);
    }
    p_1.TSRestType = TSRestType;
    function TSUnionType(np) {
        debugLog(`[TSType] union`);
        for (const p of np.types) {
            visitAstRecursive(p);
        }
    }
    p_1.TSUnionType = TSUnionType;
    function TSIntersectionType(np) {
        debugLog(`[TSType] intersection`);
        for (const p of np.types) {
            visitAstRecursive(p);
        }
    }
    p_1.TSIntersectionType = TSIntersectionType;
    function TSConditionalType(np) {
        debugLog(`[TSType] conditonal`);
        visitAstRecursive(np.checkType);
        visitAstRecursive(np.extendsType);
        visitAstRecursive(np.trueType);
        visitAstRecursive(np.falseType);
    }
    p_1.TSConditionalType = TSConditionalType;
    function TSInferType(np) {
        debugLog(`[TSType] infer`);
        visitAstRecursive(np.typeParameter);
    }
    p_1.TSInferType = TSInferType;
    function TSParenthesizedType(np) {
        debugLog(`[TSType] parenthesized`);
        visitAstRecursive(np.typeAnnotation);
    }
    p_1.TSParenthesizedType = TSParenthesizedType;
    function TSTypeOperator(np) {
        debugLog(`[TSType] operator ${np.operator}`);
        visitAstRecursive(np.typeAnnotation);
    }
    p_1.TSTypeOperator = TSTypeOperator;
    function TSIndexedAccessType(np) {
        debugLog(`[TSType] index access`);
        visitAstRecursive(np.objectType);
        visitAstRecursive(np.indexType);
    }
    p_1.TSIndexedAccessType = TSIndexedAccessType;
    function TSMappedType(np) {
        debugLog(`[TSType] mapped`);
        visitAstRecursive(np.typeParameter);
        if (np.typeAnnotation) {
            visitAstRecursive(np.typeAnnotation);
        }
        if (np.nameType) {
            visitAstRecursive(np.nameType);
        }
    }
    p_1.TSMappedType = TSMappedType;
    function TSLiteralType(np) {
        debugLog(`[TSType] literal`);
        visitAstRecursive(np.literal);
    }
    p_1.TSLiteralType = TSLiteralType;
    function TSExpressionWithTypeArguments(np) {
        debugLog(`[TSType] expression with type arguments`);
        visitAstRecursive(np.expression);
        if (np.typeParameters) {
            visitAstRecursive(np.typeParameters);
        }
    }
    p_1.TSExpressionWithTypeArguments = TSExpressionWithTypeArguments;
    function TSImportType(np) {
        console.error(`[TSType ] should skip import`);
    }
    p_1.TSImportType = TSImportType;
    function BooleanLiteral(np) {
        debugLog(`[bool] ${np.value}`);
    }
    p_1.BooleanLiteral = BooleanLiteral;
    function NumericLiteral(np) {
        debugLog(`[numberic] ${np.value}`);
    }
    p_1.NumericLiteral = NumericLiteral;
    function NullLiteral(np) {
        debugLog(`[null]`);
    }
    p_1.NullLiteral = NullLiteral;
    function RegExpLiteral(np) {
        debugLog(`[regexp] ${np.pattern} / ${np.flags}`);
    }
    p_1.RegExpLiteral = RegExpLiteral;
    function UnaryExpression(np) {
        debugLog(`[unary] ${np.operator}, prefix: ${np.prefix}`);
        visitAstRecursive(np.argument);
    }
    p_1.UnaryExpression = UnaryExpression;
    function Directive(np) {
        debugLog(`[directive] ${np.value}`);
    }
    p_1.Directive = Directive;
    function DirectiveLiteral(np) {
        debugLog(`[directive literal] ${np.value}`);
    }
    p_1.DirectiveLiteral = DirectiveLiteral;
    function EmptyStatement(np) {
        debugLog(`[empty]`);
    }
    p_1.EmptyStatement = EmptyStatement;
    function TSTypeAliasDeclaration(np) {
        debugLog(`[type alias] declare ${np.declare}`);
        visitAstRecursive(np.id);
        if (np.typeParameters)
            visitAstRecursive(np.typeParameters);
        visitAstRecursive(np.typeAnnotation);
    }
    p_1.TSTypeAliasDeclaration = TSTypeAliasDeclaration;
    function TSInterfaceDeclaration(np) {
        debugLog(`[ts interface declaration]`);
        visitAstRecursive(np.id);
        if (np.typeParameters) {
            visitAstRecursive(np.typeParameters);
        }
        visitAstRecursive(np.body);
        if (np.extends) {
            for (const p of np.extends) {
                visitAstRecursive(p);
            }
        }
    }
    p_1.TSInterfaceDeclaration = TSInterfaceDeclaration;
})(p || (p = {}));
function visitAstRecursive(ast) {
    const node = ast.node ? ast.node : ast;
    const nodeVisitor = p[node.type];
    if (nodeVisitor) {
        try {
            nodeVisitor(node);
        }
        catch (e) {
            console.error(e);
        }
    }
    else {
        console.error(`Unsupported node type: ${node.type}`);
    }
}
function visitAst(ast) {
    context.reset();
    visitAstRecursive(ast);
    return context;
}
//# sourceMappingURL=decorator-parser.js.map