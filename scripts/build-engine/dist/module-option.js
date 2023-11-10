"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseModuleOption = exports.enumerateModuleOptionReps = exports.ModuleOption = void 0;
var ModuleOption;
(function (ModuleOption) {
    ModuleOption[ModuleOption["esm"] = 0] = "esm";
    ModuleOption[ModuleOption["cjs"] = 1] = "cjs";
    ModuleOption[ModuleOption["system"] = 2] = "system";
    ModuleOption[ModuleOption["iife"] = 3] = "iife";
})(ModuleOption = exports.ModuleOption || (exports.ModuleOption = {}));
function enumerateModuleOptionReps() {
    return Object.values(ModuleOption).filter((value) => typeof value === 'string');
}
exports.enumerateModuleOptionReps = enumerateModuleOptionReps;
function parseModuleOption(rep) {
    return Reflect.get(ModuleOption, rep);
}
exports.parseModuleOption = parseModuleOption;
//# sourceMappingURL=module-option.js.map