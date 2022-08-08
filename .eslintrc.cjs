module.exports = {
    parser: "@typescript-eslint/parser",
    parserOptions: {
        project: [
            __dirname + "/tsconfig.json"
        ]
    },
    plugins: ["@typescript-eslint", "prettier", "simple-import-sort", "unused-imports"],
    extends: ["next/core-web-vitals", "plugin:@typescript-eslint/recommended", "prettier"],
    overrides: [{
        files: ["**/*.ts", "**/*.tsx"],
        rules: {
            "simple-import-sort/imports": "error",
            '@typescript-eslint/no-floating-promises': ['error'],

            // flag/fix unused imports and vars
            "@typescript-eslint/no-unused-vars": "off",
            "unused-imports/no-unused-imports": [
                "error",
                { vars: "all", varsIgnorePattern: "^jsx$", args: "after-used", argsIgnorePattern: "^jsx$" },
            ],
            "unused-imports/no-unused-vars": [
                "warn",
                { vars: "all", varsIgnorePattern: "^_", args: "after-used", argsIgnorePattern: "^_" },
            ],
        },
    }, ],
    rules: {
        "prettier/prettier": "error",
    },
};