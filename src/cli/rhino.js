/*
 * CSSLint Rhino Command Line Interface
 */

/* jshint rhino:true */
/* global cli, File */

importPackage(java.io);

var api = {
    args: Array.prototype.concat.call(arguments),
    print: print,
    quit: quit,
    userhome: java.lang.System.getProperty("user.home"),

    isDirectory: function(name){
        var dir = new File(name);
        return dir.isDirectory();
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

    getFiles: function(dir){
        var files = [];

        function traverse(dir) {
            var dirList = dir.listFiles();
            dirList.forEach(function (file) {
                if (/\.css$/.test(file)) {
                    files.push(file.toString());
                } else if (file.isDirectory()) {
                    traverse(file);
                }
            });
        }

        traverse(new File(dir));

        return files;
    },

    getWorkingDirectory: function() {
        return (new File(".")).getCanonicalPath();
    },

    getFullPath: function(filename){
        return (new File(filename)).getCanonicalPath();
    },

    readFile: function(filename) {
        try {
            return readFile(filename);
        } catch (ex) {
            return "";
        }
    }
};

cli(api);
