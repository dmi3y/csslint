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
        optionsMap = {
            "ignore": 0,
            "warnings": 1,
            "errors": 2
        },
        valueMap = {
            "false": optionsMap.ignore, // false is ignore
            "": optionsMap.warnings,    // blank is warning
            "true": optionsMap.errors,  // true is error

            "0": optionsMap.ignore,    // explicit ignore
            "1": optionsMap.warnings,  // explicit warning
            "2": optionsMap.errors     // explicit error
        };

    api.version = "@VERSION@";
    api.defaultThreshold = optionsMap.warnings;

    //-------------------------------------------------------------------------
    // Options helpers
    //-------------------------------------------------------------------------

    /**
     * Normalizing provided options object to explicit rulesets object
     * @param {object}         [obj]       object to be normilized
     * @param {boolean|string} [filter]    only get options from map hash
     * @return {object}                    normilized object
     */
    api.optionsAsExplicitRulesets = function(obj, filter) {
        var
            out = {},
            objix,
            objits,
            objitsLen,
            option,
            val,
            i,
            loop = filter? optionsMap: obj;

        for (objix in loop) {
            if ( obj.hasOwnProperty(objix) ) {
                objits = obj[objix];

                if ( Array.isArray(objits) ) {
                    objitsLen = objits.length;

                    for(i=0; i<objitsLen; i+=1) {
                        option = objits[i];
                        val = optionsMap[objix];
                        out[option] = val;
                    }

                } else {
                    option = objix;
                    val = valueMap[objits.toString()];
                    out[option] = val;
                    // additional validation?
                }
            }

        }

        return out;
    };

    /**
     * parse CLI options to json
     * @param rc {string} cli formatted options, original .csslintrc or joined cli arguments
     * @return out {object} json representation for cli options
     */
    api.optionsCliParse = function(rc) {
        var
            splitrcs = rc.split(/[\s\r\n]/),
            splitrcsLen = splitrcs.length,
            splitrc,
            optionName,
            optionValues,
            i,
            out = {};

        for (i=0; i<splitrcsLen; i+=1) {
            splitrc = splitrcs[i].split("=");

            if ( splitrc[0].indexOf("--") === 0 ) {
                optionName = splitrc[0].substring(2);
                optionValues = (splitrc.length === 2)? splitrc[1].split(","): true;
            } else {
                optionName = "files";
                optionValues = splitrc[0];
            }

            out[optionName] = optionValues;
        }

        return out;
    };

    /**
     * Parse provided sting of options down to the explicit embedded rulesset format it is same for verify method.
     * @param str {string}        string of options.
     * @param partial {boolean}   flag to stop final object transaction to explicit rulesets
     *    Could be:
     *      1. Original string CLI inspired format: --errors=id,imports --warnings=important --ignore=box-model
     *      2. Json string representation of that format: {"errors": ["id","imports"], "warnings"  :["important"], "ignore":["box-model"]}
     *      3. Implicit json sting of embedded rulesets: {"id": true, "imports": true, "important": "", "box-model": false}
     *      4. Explicit json sting of embedded rulesets: {"id": 2, "imports": 2, "important": 1, "box-model": 0}
     *
     * @method parseOptions
     * @return {object} 4. json representation, if partial flag on than any of 2. - 4. depending on input, 1. parsed to 2.
     */
    api.optionsParse = function(str, partial){

        var
            jsonout;

        try {
            jsonout = JSON.parse(str);
        } catch (e) {
            jsonout = api.optionsCliParse(str);
        }

        return partial? jsonout: api.optionsAsExplicitRulesets(jsonout);

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
            ruleset[rules[i++].id] = api.defaultThreshold; //by default, everything is a warning
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

                ruleset[property.trim()] = valueMap[value.trim()];
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
