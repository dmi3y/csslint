/**
 * Main CSSLint object.
 * @class CSSLint
 * @static
 * @extends parserlib.util.EventTarget
 */

/* global parserlib, Reporter */
/* exported CSSLint */

var CSSLint = (function(){

    var rules           = [],
        formatters      = [],
        embeddedRuleset = /\/\*csslint([^\*]*)\*\//,
        api             = new parserlib.util.EventTarget(),
        optionsValueMap = {
            "ignore": 0,
            "warnings": 1,
            "errors": 2,

            "true": optionsValueMap.errors,  // true is error
            "": optionsValueMap.warnings,    // blank is warning
            "false": optionsValueMap.ignore, // false is ignore

            "2": optionsValueMap.errors,     // explicit error
            "1": optionsValueMap.warnings,   // explicit warning
            "0": optionsValueMap.ignore      // explicit ignore
        };

    api.version = "@VERSION@";

    //-------------------------------------------------------------------------
    // Options helpers
    //-------------------------------------------------------------------------

    /**
     * Normalizing provided options object to explicit rulesets object
     * @param obj {object} - object to be normilized
     * @return {object} - normilized object
     */
    function normalizeAsExplicitRulesets(obj) {
        var
            out = {},
            objix,
            objits,
            objitsLen,
            option,
            val,
            i;

        for (objix in obj) {
            if ( obj.hasOwnProperty(objix) ) {
                objits = obj[objix];

                if ( Array.isArray(objits) ) {
                    objitsLen = objits.length;

                    for(i=0; i<objitsLen; i+=1) {
                        option = objits[i];
                        val = optionsValueMap[objix];
                        out[option] = val;
                    }

                } else {
                    option = objix;
                    val = optionsValueMap[objits.toString()];
                    out[option] = val;
                }
            }

        }

        return out;
    }

    /**
     * Parse provided sting of options down to the explicit embedded rulesset format it is same for verify method.
     * @param {string} string of options.
     *    Could be:
     *      1. Original string CLI inspired format: --errors=id,imports --warnings=important --ignore=box-model
     *      2. Json string representation of that format: {"errors": ["id","imports"], "warnings"  :["important"], "ignore":["box-model"]}
     *      3. Implicit json sting of embedded rulesets: {"id": true, "imports": true, "important": "", "box-model": false}
     *      4. Explicit json sting of embedded rulesets: {"id": 2, "imports": 2, "important": 1, "box-model": 0}
     *
     * @method parseOptions
     * @return {object} explicit json of embedded rulesets
     */
    api.parseOptions = function(str){

        var
            rc,
            jsonout = {};

        function guessType(str) {
            var type;

            try {
                rc = JSON.parse(str);
                type = "json";
            } catch (e) {
                rc = str;
                type = "text";
            }

            return type;

        }

        function readOptionsAsText() {
            var
                splitrcs = rc.split(/[\s\r\n]/),
                splitrcsLen = splitrcs.length,
                splitrc,
                optionName,
                optionValues,
                optionValuesLen,
                optionsOut,
                i,
                j,
                out = {};

            for (i=0; i<splitrcsLen; i+=1) {
                splitrc = splitrcs[i]/*.trim()*/.split("=");
                if (splitrc.length < 2) {
                    continue;
                }
                optionName = splitrc[0].substring(2);
                optionValues = splitrc[1].split(",");
                optionValuesLen = optionValues.length;
                optionsOut = [];

                for(j=0; j<optionValuesLen; j += 1) {
                    optionsOut.push(optionValues[j]);
                }

                out[optionName] = optionsOut;

            }

            return out;
        }

        function readOptionsAsJson() {
            return rc;
        }



        switch( guessType(str) ){
        case "text":
            jsonout = readOptionsAsText();
            break;
        case "json":
            jsonout = readOptionsAsJson();
            break;
        }

        return normalizeAsExplicitRulesets(jsonout);

    };

    //-------------------------------------------------------------------------
    // Rule Management
    //-------------------------------------------------------------------------

    /**
     * Adds a new rule to the engine.
     * @param {Object} rule The rule to add.
     * @method addRule
     */
    api.addRule = function(rule){
        rules.push(rule);
        rules[rule.id] = rule;
    };

    /**
     * Clears all rule from the engine.
     * @method clearRules
     */
    api.clearRules = function(){
        rules = [];
    };

    /**
     * Returns the rule objects.
     * @return An array of rule objects.
     * @method getRules
     */
    api.getRules = function(){
        return [].concat(rules).sort(function(a,b){
            return a.id > b.id ? 1 : 0;
        });
    };

    /**
     * Returns a ruleset configuration object with all current rules.
     * @return A ruleset object.
     * @method getRuleset
     */
    api.getRuleset = function() {
        var ruleset = {},
            i = 0,
            len = rules.length;

        while (i < len){
            ruleset[rules[i++].id] = 1;    //by default, everything is a warning
        }

        return ruleset;
    };

    /**
     * Returns a ruleset object based on embedded rules.
     * @param {String} text A string of css containing embedded rules.
     * @param {Object} ruleset A ruleset object to modify.
     * @return {Object} A ruleset object.
     * @method getEmbeddedRuleset
     */
    function applyEmbeddedRuleset(text, ruleset){
        var embedded = text && text.match(embeddedRuleset),
            rules = embedded && embedded[1];

        if (rules) {


            rules.toLowerCase().split(",").forEach(function(rule){
                var pair = rule.split(":"),
                    property = pair[0] || "",
                    value = pair[1] || "";

                ruleset[property.trim()] = optionsValueMap[value.trim()];
            });
        }

        return ruleset;
    }

    //-------------------------------------------------------------------------
    // Formatters
    //-------------------------------------------------------------------------

    /**
     * Adds a new formatter to the engine.
     * @param {Object} formatter The formatter to add.
     * @method addFormatter
     */
    api.addFormatter = function(formatter) {
        // formatters.push(formatter);
        formatters[formatter.id] = formatter;
    };

    /**
     * Retrieves a formatter for use.
     * @param {String} formatId The name of the format to retrieve.
     * @return {Object} The formatter or undefined.
     * @method getFormatter
     */
    api.getFormatter = function(formatId){
        return formatters[formatId];
    };

    /**
     * Formats the results in a particular format for a single file.
     * @param {Object} result The results returned from CSSLint.verify().
     * @param {String} filename The filename for which the results apply.
     * @param {String} formatId The name of the formatter to use.
     * @param {Object} options (Optional) for special output handling.
     * @return {String} A formatted string for the results.
     * @method format
     */
    api.format = function(results, filename, formatId, options) {
        var formatter = this.getFormatter(formatId),
            result = null;

        if (formatter){
            result = formatter.startFormat();
            result += formatter.formatResults(results, filename, options || {});
            result += formatter.endFormat();
        }

        return result;
    };

    /**
     * Indicates if the given format is supported.
     * @param {String} formatId The ID of the format to check.
     * @return {Boolean} True if the format exists, false if not.
     * @method hasFormat
     */
    api.hasFormat = function(formatId){
        return formatters.hasOwnProperty(formatId);
    };

    //-------------------------------------------------------------------------
    // Verification
    //-------------------------------------------------------------------------

    /**
     * Starts the verification process for the given CSS text.
     * @param {String} text The CSS text to verify.
     * @param {Object} ruleset (Optional) List of rules to apply. If null, then
     *      all rules are used. If a rule has a value of 1 then it's a warning,
     *      a value of 2 means it's an error.
     * @return {Object} Results of the verification.
     * @method verify
     */
    api.verify = function(text, ruleset){

        var i = 0,
            reporter,
            lines,
            report,
            parser = new parserlib.css.Parser({ starHack: true, ieFilters: true,
                                                underscoreHack: true, strict: false });

        // normalize line endings
        lines = text.replace(/\n\r?/g, "$split$").split("$split$");

        if (!ruleset){
            ruleset = this.getRuleset();
        }

        if (embeddedRuleset.test(text)){
            ruleset = applyEmbeddedRuleset(text, ruleset);
        }

        reporter = new Reporter(lines, ruleset);

        ruleset.errors = 2;       //always report parsing errors as errors
        for (i in ruleset){
            if(ruleset.hasOwnProperty(i) && ruleset[i]){
                if (rules[i]){
                    rules[i].init(parser, reporter);
                }
            }
        }


        //capture most horrible error type
        try {
            parser.parse(text);
        } catch (ex) {
            reporter.error("Fatal error, cannot continue: " + ex.message, ex.line, ex.col, {});
        }

        report = {
            messages    : reporter.messages,
            stats       : reporter.stats,
            ruleset     : reporter.ruleset
        };

        //sort by line numbers, rollups at the bottom
        report.messages.sort(function (a, b){
            if (a.rollup && !b.rollup){
                return 1;
            } else if (!a.rollup && b.rollup){
                return -1;
            } else {
                return a.line - b.line;
            }
        });

        return report;
    };

    //-------------------------------------------------------------------------
    // Publish the API
    //-------------------------------------------------------------------------

    return api;

})();
