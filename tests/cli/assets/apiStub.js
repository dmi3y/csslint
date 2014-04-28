/*jshint node:true*/
"use strict";
var
    stub = {
        logbook: function (log) {
            this.logs.push(log);
        },
        readLogs: function () {
            return this.logs.slice();
        },

        getFullPath: function (path) {
            return path;
        },
        getFiles: function (dir) {
            var
                filesobj = this.fakedFs[dir],
                fileix,
                out = [];
            if (this.done) {return out;}
            for (fileix in filesobj) {
                if ( filesobj.hasOwnProperty(fileix) && /\.css$/.test(fileix) ) {
                    out.push(dir + "/" + fileix);
                }
            }
            return out;
        },
        readFile: function (path) {
            if (this.done) {return "";}
            var
                spath = path.split("/"),
                spathLen = spath.length,
                i,
                out = this.fakedFs;

            for (i = 0; i < spathLen; i += 1) {
                out = out[spath[i]];
            }

            return out || "";
        },
        isDirectory: function (checkit) {
            if (this.done) {return false;}
            var
                result = this.fakedFs[checkit];
            return typeof result === "object";
        },
        print: function (msg) {
            if (this.done) {return;}
            this.logbook(msg);
        },
        quit: function (signal) {
            if (this.done) {return;}
            this.logbook(signal);
            this.done = true;
        }
    };

module.exports = function (setup) {
    var
        api,
        setix;

    api = Object.create(stub);

    for (setix in setup) {
        if (setup.hasOwnProperty(setix)) {
            api[setix] = setup[setix];
        }
    }

    api.logs = [];
    api.done = false;
    return api;
};
