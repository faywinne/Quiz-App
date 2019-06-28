/**
 * @param {string} title -  Framework for Quiz (DMJS)
 * @param {string} author - Claude Gauthier
 * @param {string} email -	claude_r_gauthier@hotmail.com
 * @param {string} date -	2013-12-10
 * 
 */
(function(window) {
	var	document = window.document;
	var	core_version = "0.2";
	var isReady = false;
	var	launchFn;
	var DMJS = {
			// info
			getVersion: function() {
				return core_version;
			},
			// ready
			ready: function(fn) {
				launchFn = fn;
			},
			getReadyState: function() {
				return isReady;				
			},
			// get will be set using NormalizeAPI()
			get: null,
			getBody: function() {
				return document.getElementsByTagName('body')[0];
			},
			// addEvent and removeEvent will be set using normalizeAPI()
			addEvent: null,
			removeEvent: null,
			// various object inspection functions
			getConstructorName: function(obj) {
				if(obj == undefined || obj == null) {
					return null;
				}
				if(obj.constructor) {
					if(obj.constructor.name) {
						return obj.constructor.name.toLowerCase();
					} else {
						var temp = obj.constructor.toString().toLowerCase(),
							st = temp.indexOf('function ') + 9,
							en = temp.indexOf('(');
						return temp.substr(st, en - st);
					}
				}
			},
			isEmptyObject: function(obj) {
				for(var key in obj) {
					return false;
				}
				return true;
			},			
			isObjectType: function(obj, type) {
				var val = false;
				if(obj == undefined || obj == null) {
					return val;
				}				
				if($.getConstructorName(obj) == type) {
					val = true;
				}
				return val;				
			},	
			// object type inspection		
			isArray: function(obj) {
				return $.isObjectType(obj, "array");
			},
			isString: function(obj) {
				return $.isObjectType(obj, "string");
			},	
			isObject: function(obj) {
				return $.isObjectType(obj, "object");
			},			
			// clone Object
			cloneObject: function(obj) {
				if(obj == null || $.isObject(obj) == false) {
					return obj;
				}
				var returnObj = obj.constructor();
				for(key in obj) {
					returnObj[key] = this.cloneObject(obj[key]);
				}
				return returnObj;
			},
			string: {
				format: function() {
					var l = arguments.length,
						str;
					if(l < 2) {
						return null;
					}
					str = arguments[0];
					for(x = l-1; x >= 1; x--) {
						str = str.replace(new RegExp('\\{' + (x - 1) + '\\}', 'gm'), arguments[x]);
					}
					return str;
				}
			}
		}
	var initDMJS = function() {
		$.isReady = true;
		launchFn.call(DMJS);
	}
		/** in order to deal with cross browser issues
			i'm using feature detection in order to 
			assign proper functionality to the methods */
	var normalizeAPI = function() {
		// set GET method
		// todo - normalize the element obj
		var getFn,
			addEventFn,
			removeEventFn;
			
		// giving precedence to document.all for Windows CE IE browsers
		if(document.getElementById) {
			getFn = function(id) {
				return document.getElementById(id);
			}
		
		} else {
			if(document.all) {
				getFn = function(id) {
					return document.all[id];
				}
			}				
		}
		DMJS.get = getFn;
		if(document.addEventListener) {
			addEventFn = function (el, type, fn) {
				el.addEventListener(type, fn, false);
				return fn;
			}
			
			removeEventFn = function(el, type, fn) {
				el.removeEventListener(type, fn, false);
			}
			
		} else {
			if(document.attachEvent) {
				addEventFn = function (el, type, fn) {
					var temp = function() {
						return fn.apply(el, arguments);
					}
					el.attachEvent("on" + type, temp);
					return temp;
				}
				
				removeEventFn = function(el, type, fn) {
					el.detachEvent("on" + type, fn);
				}
			}
		}
		DMJS.addEvent = addEventFn;
		DMJS.removeEvent = removeEventFn;
	};
	normalizeAPI();
	
	if(typeof window === "object" && typeof window.document === "object" ) {
		window.DMJS = window.$ = DMJS;
	}
	window.onload = initDMJS;
	
})(window);