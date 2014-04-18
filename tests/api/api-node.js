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
            cli: function() {
                //dummy cli to run from node.js api
            },
            require: function(req) {
                if (req === "./lib/csslint-node") {
                    return {CSSLint: null};
                }
                return require(req);
            },
            process: process
        },
        path = require("path"),
        cwdBackup = path.resolve(process.cwd());

    include(__dirname + "/src/cli/node.js", sandbox); /* expose sandbox.api */


    YUITest.TestRunner.add(new YUITest.TestCase({
        name: "Node api helper",

        setUp: function() {
            process.chdir("./tests/api/dir/cwd/");
        },
        tearDown: function() {
            process.chdir(cwdBackup);
        },

        "look up file at the same directory": function() {
            var result = sandbox.api.lookUpFile(".rc0");
            Assert.areEqual(path.resolve(".rc0"), result);
        },

        "look up file from the upper directory": function() {
            var result = sandbox.api.lookUpFile(".rc1");
            Assert.areEqual(path.resolve("/../.rc1"), result);
        }

    }));

})();
