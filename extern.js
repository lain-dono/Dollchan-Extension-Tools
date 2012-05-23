/**
 * @externs
 */

/** @return {String} */ Document.prototype.getSelection = function() {};
/** @type {Object} */ Window.opera;
/** @type {Object} */ Window.opera.scriptStorage; 

/**
 * @param {String} html
 * @return {Node}
 */
Document.prototype.implementation.createHTMLDocument = function(html) {};
/**
 * @constructor
 * @return {Object}
 * @nosideeffects
 */
function MozBlobBuilder() {};
/**
 * @param {Object} obj
 * @return {String}
 */
function uneval(obj) {};

Window.JSON = {};
/**
 * @param {string} text
 * @param {(function(string, *) : *)=} opt_reviver
 * @return {*}
 */
Window.JSON.parse = function(text, opt_reviver) {};

/** @type {String} */ XMLHttpRequest.prototype.finalUrl;
var localStorage = {}, sessionStorage = {};

/**
 * @param {String} text
 * @return {undefined}
 */
function GM_log(text) {};
/**
 * @param {String} text
 * @return {undefined}
 */
Window.GM_log = function(text) {};
/**
 * @param {Object} obj
 * @return {undefined}
 */
function GM_xmlhttpRequest(obj) {};
/**
 * @param {Object} obj
 * @return {undefined}
 */
Window.GM_xmlhttpRequest = function(obj) {};
/**
 * @param {String} name
 * @param {String} value
 * @return {undefined}
 */
function GM_setValue(name, value) {};
/**
 * @param {String} name
 * @return {String}
 */
function GM_getValue(name) {};
/**
 * @param {String} url
 * @param {Boolean} loadInBackground
 * @param {Boolean} reuseTab
 * @return {undefined}
 */
function GM_openInTab(url, loadInBackground, reuseTab) {};