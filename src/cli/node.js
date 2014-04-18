/*
 * CSSLint Node.js Command Line Interface
 */

/* jshint node:true */
/* global cli */
/* exported CSSLint */

var fs      = require("fs"),
    path    = require("path"),
    CSSLint = require("./lib/csslint-node").CSSLint,
    userhome = path.resolve(process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE),
    api;

api = {
    args: process.argv.slice(2),

    print: function(message){
        fs.writeSync(1, message + "\n");
    },

    quit: function(code){
        process.exit(code || 0);
    },

    isDirectory: function(name){
        try {
            return fs.statSync(name).isDirectory();
        } catch (ex) {
            return false;
        }
    },

    lookUpFile: function(filename) {
        var lookupd = process.cwd(),
            isFile;

        function isGoodToGoUp() {
            var
                isUserhome = (lookupd === userhome),
                _lookupd = path.resolve(lookupd + "/../"),
                isTop = (lookupd === _lookupd),
                gtg;

            isFile = fs.statSync(filename).isFile;
            gtg = (!isFile && !isUserhome && !isTop);
            lookupd = _lookupd;
            return gtg;
        }

        (function traverseUp() {

            filename = path.resolve(lookupd, filename);

            if ( isGoodToGoUp() ) {
                traverseUp();
            }
        }());

        return isFile? filename: null;
    },

    getFiles: function(dir){
        var files = [];

        try {
            fs.statSync(dir);
        } catch (ex){
            return [];
        }

        function traverse(dir, stack){
            stack.push(dir);
            fs.readdirSync(stack.join("/")).forEach(function(file){
                var path = stack.concat([file]).join("/"),
                    stat = fs.statSync(path);

                if (file[0] == ".") {
                    return;
                } else if (stat.isFile() && /\.css$/.test(file)){
                    files.push(path);
                } else if (stat.isDirectory()){
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

    getFullPath: function(filename){
        return path.resolve(process.cwd(), filename);
    },

    readFile: function(filename){
        try {
            return fs.readFileSync(filename, "utf-8");
        } catch (ex) {
            return "";
        }
    }
};

cli(api);
