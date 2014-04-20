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
            CSSLint: CSSLint,
            require: function(req) {
                // monkey patched require
                if (req === "./lib/csslint-node") {
                    return {CSSLint: sandbox.CSSLint};
                }
                return require(req);
            },
            process: process//share process
        },
        path = require("path"),
        cwdBackup = path.resolve(process.cwd()),
        ncwd,
        userhomeBackup;

    include(__dirname + "/src/cli/api-node.js", sandbox); /* expose sandbox.api */
    include(__dirname + "/src/cli/api-common.js", sandbox); /* expose sandbox.commonApi */

    userhomeBackup = sandbox.api.userhome; // have no good idea how to test if it was resolved or not

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
            var result = sandbox.api.lookUpFile(".rc0").trim();
            Assert.areEqual(".rc0 context", result);
        },
        "look up file from the parent directory": function() {
            var result = sandbox.api.lookUpFile(".rc1").trim();
            Assert.areEqual(".rc1 context", result);
        },
        "userhome file lookup": function() {
            var result = sandbox.api.lookUpFile(".rc2").trim();
            Assert.areEqual(".rc2 context", result);
        },
        "look up file from outside cwd scope (base argument)": function() {
            var result = sandbox.api.lookUpFile(".in0", "dir0").trim();
            Assert.areEqual(".in0 context", result);
        },
        "look up file from outside cwd scope base deeper level": function() {
            var result = sandbox.api.lookUpFile(".in0", "dir0/dir1").trim();
            Assert.areEqual(".in0 context", result);
        },
        "look up file from outside cwd scope base deeper level, same dir": function() {
            var result = sandbox.api.lookUpFile(".in1", "dir0/dir1").trim();
            Assert.areEqual(".in1 context", result);
        },
        "nonexisting file lookup should return empty string": function() {
            var result = sandbox.api.lookUpFile("._nonexisting_filename_.");
            Assert.areEqual("", result);
        },
        "top root file lookup": function() {
            var result = sandbox.api.lookUpFile("").trim();
            Assert.areEqual(null, result);
        }

    }));

})();
