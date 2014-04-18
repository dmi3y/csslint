/*jshint node:true*/
"use strict";

function include(path, sandbox) {
    var
        vm = require("vm"),
        fs = require("fs"),
        file;

    file = fs.readFileSync(path);
    vm.runInNewContext(file, sandbox);
}

(function(){
    var Assert = YUITest.Assert,
        sandbox = {
            cli: function() {/*dummy cli to run from node.js api*/},
            require: function(req) {
                // monkey patched require
                if (req === "./lib/csslint-node") {
                    return {CSSLint: null};
                }
                return require(req);
            },
            process: process//share process
        },
        path = require("path"),
        cwdBackup = path.resolve(process.cwd()),
        ncwd,
        userhomeBackup;

    include(__dirname + "/src/cli/node.js", sandbox); /* expose sandbox.api */

    userhomeBackup = sandbox.api.userhome; // have no good idea hot to test if it was resolved or not

    YUITest.TestRunner.add(new YUITest.TestCase({
        name: "Node api helper",

        _should: {
            ignore: {
                "top root file lookup": true
            }
        },

        setUp: function() {
            sandbox.api.userhome = path.resolve("./tests/api/userhome");
            process.chdir("./tests/api/userhome/dir/cwd/");/*userhome{.rc2}/dir{.rc1}/cwd{.rc0}*/
            ncwd = process.cwd();
        },
        tearDown: function() {
            sandbox.api.userhome = userhomeBackup;
            process.chdir(cwdBackup);
        },

        "look up file at the same directory": function() {
            var result = sandbox.api.lookUpFile(".rc0");
            Assert.areEqual(path.resolve(ncwd + "/.rc0"), result);
        },
        "look up file from the parent directory": function() {
            var result = sandbox.api.lookUpFile(".rc1");
            Assert.areEqual(path.resolve(ncwd + "/../.rc1"), result);
        },
        "nonexisting file lookup should return null": function() {
            var result = sandbox.api.lookUpFile("_nonexisting_filename_just_for_dummy_testings_.dnx");
            Assert.areEqual(null, result);
        },
        "userhome file lookup": function() {
            var result = sandbox.api.lookUpFile(".rc2");
            Assert.areEqual(path.join(sandbox.api.userhome, ".rc2"), result);
        },
        "top root file lookup": function() {
            var result = sandbox.api.lookUpFile("");
            Assert.areEqual(null, result);
        }

    }));

})();
