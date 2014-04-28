/*jshint node:true*/
module.exports = {
    "suites": {
        "straight linting": {
            "args": [
                "--ignore=box-model",
                "dir"
            ],
            "expecting": [
                "csslint: There is 1 problem in dir/a.css.",
                "csslint: There is 1 problem in dir/b.css.",
                0
            ]
        },
        "straight linting with csslintrc ignores": {
            "args": [
                "dir"
            ],
            "expecting": [
                "csslint: No errors in dir/a.css.",
                "csslint: No errors in dir/b.css.",
                0
            ]
        },
        "mix of cli options": {
            "args": [
                "--ignore=important",
                "dir/b.css"
            ],
            "expecting": [
                "csslint: There is 1 problem in dir/b.css.",
                0
            ]
        },
        "more mixes of cli options": {
            "args": [
                "--errors=important",
                "dir/a.css"
            ],
            "expecting": [
                "csslint: There is 1 problem in dir/a.css.",
                1
            ]
        },
        "version": {
            "args": [
                "--version"
            ],
            "expecting": [
                "v@VERSION@",
                0
            ]
        },
        "help": {
            "args": [
                "--help"
            ],
            "expecting": [
                "Usage: csslint-rhino.js [options]* [file|dir]*",
                "--help                                   Displays this information.",
                0
            ]
        },
        "list-rules": {
            "args": [
                "--list-rules"
            ],
            "expecting": [
                "",
                "known-properties",
                "adjoining-classes",
                "order-alphabetical",
                "box-sizing",
                "box-model",
                "overqualified-elements",
                "display-property-grouping",
                "bulletproof-font-face",
                "compatible-vendor-prefixes",
                "regex-selectors",
                "errors",
                "duplicate-background-images",
                "duplicate-properties",
                "empty-rules",
                "selector-max-approaching",
                "gradients",
                "fallback-colors",
                "floats",
                "font-sizes",
                "font-faces",
                "shorthand",
                "outline-none",
                "important",
                "import",
                "ids",
                "underscore-property-hack",
                "rules-count",
                "qualified-headings",
                "selector-max",
                "selector-newline",
                "star-property-hack",
                "text-indent",
                "unique-headings",
                "universal-selector",
                "unqualified-attributes",
                "vendor-prefix",
                "zero-units",
                0
            ]
        }
    },

    "fakedFs": {
        ".csslintrc": "--ignore=important,ids",
        "dir": {
            "a.css": ".a {color: red!important;}",
            "b.css": "#a {color: red;}"
        },
    }
};
