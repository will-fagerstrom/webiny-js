/**
 * Note: do not use any 3rd party libraries because we need this script
 * to be executed in our CI/CD, as fast as possible.
 */

const fs = require("fs");
const path = require("path");

const CUSTOM_HANDLERS = {
    // Skip "i18n" package.
    i18n: () => [],

    // Split "api-page-builder" tests into batches of
    "api-page-builder": () => {
        return [
            "packages/api-page-builder/* --keyword=pb:ddb --keyword=pb:base",
            "packages/api-page-builder/* --keyword=pb:ddb-es --keyword=pb:base"
        ];
    },
    // Split "api-headless-cms" tests into batches of
    "api-headless-cms": () => {
        return [
            "packages/api-page-builder/* --keyword=cms:ddb --keyword=cms:base",
            "packages/api-page-builder/* --keyword=cms:ddb-es --keyword=cms:base"
        ];
    }
};

/**

 * @param folder
 * @returns boolean
 */
function hasTestFiles(folder) {
    if (!fs.existsSync(folder)) {
        return false;
    }

    const files = fs.readdirSync(folder);
    for (let filename of files) {
        const filepath = path.join(folder, filename);
        if (fs.statSync(filepath).isDirectory()) {
            const hasTFiles = hasTestFiles(filepath);
            if (hasTFiles) {
                return true;
            }
        } else if (filepath.endsWith("test.js") || filepath.endsWith("test.ts")) {
            return true;
        }
    }
    return false;
}

const allPackages = fs.readdirSync("packages");
const packagesWithTests = [];
for (let i = 0; i < allPackages.length; i++) {
    const packageName = allPackages[i];

    if (typeof CUSTOM_HANDLERS[packageName] === "function") {
        packagesWithTests.push(...CUSTOM_HANDLERS[packageName]());
    } else {
        const testsFolder = path.join("packages", packageName, "__tests__");
        if (hasTestFiles(testsFolder)) {
            packagesWithTests.push(`packages/${packageName}`);
        }
    }
}

console.log(JSON.stringify(packagesWithTests));
