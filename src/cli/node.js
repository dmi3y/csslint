/*
 * CSSLint Node.js Command Line Interface
 */

/* jshint node:true */
/* global cli */
/* exported CSSLint */

var fs = require("fs"),
    path = require("path"),
    CSSLint = require("./lib/csslint-node").CSSLint,
    api;

api = {
    args: process.argv.slice(2),

    print: function(message) {
        fs.writeSync(1, message + "\n");
    },

    quit: function(code) {
        process.exit(code || 0);
    },

    userhome: path.resolve(process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE),


    isDirectory: function(name) {
        try {
            return fs.statSync(name).isDirectory();
        } catch (ex) {
            return false;
        }
    },

    lookUpFile: function (filename, base) {
        var lookupd = base? this.getFullPath(base): this.getWorkingDirectory(),
            data,
            self = this;

        function isGoodToGoUp() {
            var
                isUserhome = (lookupd == self.userhome),
                _lookupd = self.getFullPath(lookupd + "/../"),
                isTop = (lookupd == _lookupd),
                gtg;

            gtg = (!data && !isUserhome && !isTop);
            lookupd = _lookupd;
            return gtg;
        }

        (function traverseUp() {
            var
                fullpath = self.getFullPath(lookupd + "/" + filename);

            data = self.readFile(fullpath);

            if ( isGoodToGoUp() ) {
                traverseUp();
            }
        }());

        return data;
    },

    getFiles: function(dir) {
        var files = [];

        try {
            fs.statSync(dir);
        } catch (ex) {
            return [];
        }

        function traverse(dir, stack) {
            stack.push(dir);
            fs.readdirSync(stack.join("/")).forEach(function(file) {
                var path = stack.concat([file]).join("/"),
                    stat = fs.statSync(path);

                if (file[0] == ".") {
                    return;
                } else if (stat.isFile() && /\.css$/.test(file)) {
                    files.push(path);
                } else if (stat.isDirectory()) {
                    traverse(file, stack);
                }
            });
            stack.pop();
        }

        traverse(dir, []);

        return files;
    },

    getWorkingDirectory: function() {
        return process.cwd();
    },

    getFullPath: function(filename) {
        return path.resolve(process.cwd(), filename);
    },

    readFile: function(filename) {
        try {
            return fs.readFileSync(filename, "utf-8");
        } catch (ex) {
            return "";
        }
    }
};

cli(api);
