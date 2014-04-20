/*globals api, cli*/
/*exported commonApi*/

var commonApi = {
    lookUpFile: function (filename, base) {
        var lookupd = base? this.getFullPath(base): this.getWorkingDirectory(),
            data,
            self = this;

        function isGoodToGoUp() {
            var /*keep  '==' because of rhino*/
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
    }
};

/*api = */
CSSLint.Util.mix(api, commonApi);

if (typeof cli === "function") {
    cli(api);
}
