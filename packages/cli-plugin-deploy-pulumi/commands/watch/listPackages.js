const execa = require("execa");
const { WebinyConfigFile } = require("./WebinyConfigFile");

const listPackages = async ({ inputs }) => {
    let packagesList = [];
    if (inputs.package) {
        packagesList = Array.isArray(inputs.package) ? inputs.package : [inputs.package];
    } else {
        packagesList = await execa("yarn", [
            "webiny",
            "workspaces",
            "tree",
            "--json",
            "--depth",
            inputs.depth,
            "--distinct",
            "--folder",
            inputs.folder
        ]).then(({ stdout }) => JSON.parse(stdout));
    }

    const commandArgs = [
        "webiny",
        "workspaces",
        "list",
        "--json",
        "--withPath",
        ...packagesList.reduce((current, item) => {
            current.push("--scope", item);
            return current;
        }, [])
    ];

    if (inputs.env) {
        commandArgs.push("--env", inputs.env);
    }

    return execa("yarn", commandArgs).then(({ stdout }) => {
        const result = JSON.parse(stdout);
        const packages = [];
        for (const packageName in result) {
            const root = result[packageName];
            const configPath = WebinyConfigFile.forWorkspace(root).getAbsolutePath();

            if (!configPath) {
                continue;
            }

            packages.push({
                name: packageName,
                config: require(configPath).default || require(configPath),
                paths: {
                    root,
                    config: configPath
                }
            });
        }

        return packages;
    });
};

module.exports = listPackages;
