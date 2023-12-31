"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const semver_1 = __importDefault(require("semver"));
const path_1 = __importDefault(require("path"));
function removeDeprecatedFeatures(range) {
    const versionRange = range ? new semver_1.default.Range(range) : undefined;
    return {
        name: '@cocos/build-engine | remove-deprecated-features',
        load(id) {
            if (!path_1.default.isAbsolute(id)) {
                return null;
            }
            const stem = path_1.default.basename(id, path_1.default.extname(id));
            const match = /^deprecated(-)?(.*)/.exec(stem);
            if (!match) {
                return null;
            }
            const versionString = match[2];
            if (versionString.length !== 0) {
                const parsedVersion = semver_1.default.parse(versionString);
                if (!parsedVersion) {
                    console.debug(`${id} looks like a deprecated module, but it contains an invalid version.`);
                    return null;
                }
                if (versionRange && !semver_1.default.satisfies(parsedVersion, versionRange)) {
                    return null;
                }
            }
            console.debug(`Exclude deprecated module ${id}`);
            return `export {}`;
        },
    };
}
exports.default = removeDeprecatedFeatures;
//# sourceMappingURL=remove-deprecated-features.js.map