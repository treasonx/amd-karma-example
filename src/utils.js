/* global console: false */
define(function(require) {
	'use strict';
	var g = window;
	var lodash = require('lodash');
	var $ = require('jquery');
	var dereference = require('./dereference');

	var CLEANPTRN = /(\s|\u00a0){1,}/g, ASCIIRANGEPTRN = /[^\x20-\x7e]/, NEWLINEPTRN = /(\r\n|\n|\r)/gm;
	var GUIDPTRN = /^(\{{0,1}([0-9a-fA-F]){8}-([0-9a-fA-F]){4}-([0-9a-fA-F]){4}-([0-9a-fA-F]){4}-([0-9a-fA-F]){12}\}{0,1})$/;
	var $win = $(g);

	function urlParamSep(url) {
		return url.indexOf('?') < 0 ? '?' : '&';
	}

	var utils = {
		isGUID: function(obj) {
			return utils.isString(obj) && GUIDPTRN.test(obj);
		},
		hashCode: function(text) {
			var hash = 0;
			var i = null;
			var charCode = null;
			if (utils.isString(text)) {
				for (i = 0; i < text.length; i++) {
					charCode = text.charCodeAt(i);
					charCode = charCode > 126 ? 33 : charCode;
					hash = ((hash<<5)-hash)+charCode;
					hash = hash & hash;
				}
			}
			return Math.abs(hash).toString(16);
		},
		noop: function(){},
		getOffsiteHandler: function(g, analytics, dataStore) {
			return function(url, context, conversionId) {
				g.open(url);
				if(conversionId != null) {
					analytics.stageConversion(dataStore, conversionId, {
						ctx: context.ctx,
						d: context.d
					}).done(function() {
						analytics.startConversion(conversionId, context.ctx, context.d);
					});
				}
			};
		},
		walkObject: function(obj, fn, $) {
			var path = '';
			if(utils.isEmpty(obj) ||!utils.isFunction(fn)) {
				return;
			}
			function walk(path, obj) {
				var prop = null, val = null;
				for(prop in obj) {
					if(utils.hasOwnProperty.call(obj, prop)) {
						val = obj[prop];
						fn(path, prop, val, obj);
						if(val !== null && (utils.isArray(val) || typeof val === 'object')) {
							if($ && val instanceof $) {
								continue;
							}
							walk(path === '' ? prop : path+'.'+prop, val);
						}
					}
				}
			}
			walk(path, obj);
		},
		objToUrlParams: function(obj) {
			var out = [];
			utils.each(obj, function(val, key) {
				if(val !== null &&
					val !== undefined &&
					typeof val !== 'object') {
					out.push(g.encodeURIComponent(key)+'='+g.encodeURIComponent(val));
				} else if (utils.isArray(val)) {
					utils.each(val, function(aVal) {
						if(aVal) {
							out.push(g.encodeURIComponent(key)+'='+g.encodeURIComponent(aVal));
						}
					});
				}
			});
			return out.join('&');
		},
		asyncEach: function(obj, fn, cb, context, wait) {

			var idx = -1;

			if(wait == null) {
				wait = 1;
			}

			function iterate() {
				if(context) {
					fn.call(context, obj[idx], idx, obj, next);
				} else {
					fn(obj[idx], idx, obj, next);
				}
			}

			function schedule() {
				if(wait === -1) {
					iterate();
				} else {
					setTimeout(iterate, wait);
				}
			}

			function next() {
				idx++;
				if(idx > obj.length-1) {
					cb();
				} else {
					schedule();
				}
			}

			if(obj == null) {
				setTimeout(cb, 1);
			} else {
				next();
			}

		},
		cleanWhiteSpace: function(text) {
			if(text == null) {
				return '';
			}
			//IE8 does not support trim :(
			return $.trim(text.replace(CLEANPTRN, ' ').replace(NEWLINEPTRN,''));
		},
		cleanUnknownChars: function(text, substitute) {
			var sub = substitute || ' ';
			//replaces any chacter not within the printable ascii range.
			if(text == null) {
				return '';
			}
			return text.replace(ASCIIRANGEPTRN, sub);
		},
		/*
		* Given an array of objects with a weight attribute returns a random
		* object from the set/
		*/
		getWeightedRandom: function(objects) {
			var totalWeight = 0,
					i = objects.length,
					tryThis = null,
					currentIndex = 0,
					totalSoFar = 0;
			while (i--) {
				totalWeight += objects[i].weight;
			}
			tryThis = Math.random() * totalWeight;
			currentIndex = 0;
			totalSoFar = 0;
			while (tryThis > totalSoFar) {
				totalSoFar += objects[currentIndex].weight;
				if (tryThis > totalSoFar) {
					currentIndex++;
				}
			}
			return objects[currentIndex];
		},
		/*
		* Takes a url with params or just params and and returns an object
		* of those params
		*/
		urlToObject: function(params) {
			var keyVals,
					tempParams,
					out = {};

			if(params.indexOf('?') !== -1) {
				tempParams = params.split('?');
				if(tempParams.length === 2) {
					keyVals = tempParams[1].split('&');
				}
			} else {
				keyVals = params.split('&');
			}

			utils.each(keyVals, function(parts) {
				var pieces = parts.split('='), key, val;
				if(pieces.length === 2) {
					key = g.unescape(pieces[0]);
					val = g.unescape(pieces[1]);
					if(key !== '' && val !== '') {
						if(utils.isArray(out[key])) {
							out[key].push(val);
						} else if(out[key] != null) {
							out[key] = [out[key], val];
						} else {
							out[key] = val;
						}
					}
				}
			});
			return out;

		},
		//RFC4122 compliant. Best we can do in client side javascript
		//TODO test
		getGUID: function() {
			return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
				var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
				return v.toString(16);
			});
		},
		// # resolveUrl(base, uri)
		// base: the base url for the given uri
		// uri: the uri of the url to return nullable
		//
		// Description: Given a base and a uri this function will return a properly
		// formed url. It check to see if the URI is an absolute uri and if so does
		// not modify the uri. If it is not absolute the function will build a
		// properly formd url from the given base and uri.
		resolveUrl: function(base, uri) {

			if(base.charAt(base.length-1) !== '/') {
				base = base + '/';
			}
			if(!uri) {
				return base;
			}

			if(uri.match(/^(http|https):\/\//)) {
				return uri;
			} else {
				if(uri.charAt(0) === '/') {
					uri = uri.substr(1);
				}
				return base + uri;
			}
		},
		//detect if environment is touchable
		//see http://modernizr.github.com/Modernizr/touch.html
		//TODO Test
		isTouchable: function(window) {
			var isTouchable = ('ontouchstart' in window) && ('ontouchend' in window.document);

			if(isTouchable) {
				//Is it REALLY touchable? Or pretend!
				try {
					window.document.createEvent('TouchEvent');
				} catch(e) {
					isTouchable = false;
				}
			}

			return isTouchable;
		},
		parseMetaContent: function(content) {
			var out = {};
			content = content.split(/,|;|\s/);
			if(content.length) {
				utils.each(content, function(val) {
					var parts = val.split('=');
					if(parts.length === 2) {
						out[parts[0]] = parts[1];
					}
				});
			}
			return out;
		},
		getViewPortInfo: function($head) {
			var out = {};
			var $meta = null;
			var name = null;
			var content = null;

			if($head) {
				$meta = $head.find('meta[name=viewport]:eq(0)');
				name = $meta.attr('name');
				content = $meta.attr('content');

				if(name === 'viewport' && content != null) {
					out = utils.parseMetaContent(content);
				}
			}

			return out;
		},
		getViewportSize: function($thisWin) {
			var $myWin = $thisWin || $win;

			var docTop = $myWin.scrollTop();
			var docBottom = $myWin.outerHeight(true)+docTop;

			return {
				top: docTop,
				bottom: docBottom
			};

		},
		getIEVersion: function(ua) {
			var version = -1,
					re= new RegExp("MSIE ([0-9]{1,}[\\.0-9]{0,})", "i");
			if (re.exec(ua) ) {
				version = g.parseFloat( RegExp.$1 );
			}

			return version;
		},

		getTargetHandler: function(evtBus) {
			var IS_HREF = /^(https)|(http).+$/;

			var getSlinkQuery =  function(slink, data) {
				data =  utils.objToUrlParams(data);
				return slink.indexOf('?') === -1 ? slink + '?' + data : slink + '&' + data;
			};

			return function (topic, obj) {
				if(IS_HREF.test(obj.target)) {
					g.open(obj.target);
				} else {
					evtBus.publish('slink', {
						path: getSlinkQuery(obj.target, obj.args)
					});
				}
			};
		},
		decorators: {
			pubsub: function( target ) {

				var rootTopic = {
						callbacks: [],
						subTopics: {}
					},
					getCallbacks = function( topic ) {

						var callbacks = topic.callbacks || [];

						utils.each( topic.subTopics, function( subTopic ) {
							callbacks = callbacks.concat( getCallbacks( subTopic ) );
						});

						return callbacks;
					},
					getTopic = function( topicName ) {

						var realPath, callbacks = [];

						// This condition makes it possible to publish to all
						// topics by not specifying a topic name
						if ( topicName ) {
							realPath = topicName.split(".").join(".subTopics.").split(".");
							realPath.splice( 0, 0, "subTopics" );
						} else {
							realPath = [];
						}

						return utils.dereference( rootTopic, realPath, {} );
					};

				target.publish = function( topicName, args ) {

					var callbacks, realPath;

					callbacks = getCallbacks( getTopic( topicName ) );

					utils.each( callbacks, function( callback ) {
						callback.call( target, topicName, args );
					});
				};

				target.subscribe = function( topicName, callback ) {

					var topic;

					// Shortcut for subscribing to all topics. Makes
					// obj.subscribe( function() {} );
					// equivalent to
					// obj.subscribe( undefined, function() {} );
					if ( typeof topicName === "function" ) {
						callback = topicName;
						topicName = undefined;
					}

					topic = getTopic( topicName );

					if ( !topic.callbacks ) {
						topic.callbacks = [];
					}

					topic.callbacks.push( callback );
					return [ topicName, callback ];
				};

				target.unsubscribe = function( topicName, callback ) {

					var topic;

					// Shortcut for unsubscribing from all topics. Makes
					// obj.unsubscribe( function() {} );
					// equivalent to
					// obj.unsubscribe( undefined, function {} );
					if ( typeof topicName === "function" ) {
						callback = topicName;
						topicName = undefined;
					}

					topic = getTopic( topicName );

					if ( !topic.callbacks ) {
						return;
					}

					utils.each( topic.callbacks, function( attached, idx ) {
						if ( attached === callback ) {
							topic.callbacks.splice( idx, 1 );
						}
					});
				};
			}
		},
		dereference: dereference,
		/*
		 * returns a function that will give you the current ts based on server
		 * time
		 */
		getServerTimeFn: function(serverTime) {
			var offset = new Date().getTime() - serverTime;
			return function() {
				return new Date().getTime() - offset;
			};
		},
		dom: {
			//
			//IE8 Bug fix. In IE8 the browser likes to apply weight and width to
			//img elements if someone is using max-width/height min-width/height,
			//To work around this issue we remove the height and width of the img
			//tags. In non-ie browsers this isnt a problem because the attributes
			//do not exist.
			//
			applyIEImageFix: function($ele) {
				$ele.find('img').removeAttr('height').removeAttr('width');
			},
			getText: function( node ) {
				var counter = "";
				if ( node.nodeType === 3 ) {
					counter = node.nodeValue;
				} else if ( node.nodeType !== 8 ) {
					for ( var i = 0, l = node.childNodes.length; i < l; ++i ) {
						counter += utils.dom.getText(node.childNodes[i]);
					}
				}
				return counter;
			},
			getVisibleText: function(elem) {
				var node,
					i = 0,
					ret = '',
					nodeType = elem.nodeType;

				if (nodeType) {
					if (nodeType === 1 || nodeType === 9 || nodeType === 11) {
						// Traverse the children
						for (elem = elem.firstChild; elem; elem = elem.nextSibling) {
							ret += $.expr.filters.hidden(elem) ?
								'' :
								utils.dom.getVisibleText(elem);
						}
					} else if (nodeType === 3 || nodeType === 4) {
						return elem.nodeValue;
					}
				} else {

					// If no nodeType, this is expected to be an array (or jQuery object)
					for (; (node = elem[i]); i++) {
						ret += utils.dom.getVisibleText(node);
					}
				}
				return ret;
			},
			/*
			* Gets all of the dom node attributes as object
			*
			*/
			getAttributes: function(element) {
				var out = {}, attrs = element.attributes, idx = 0, length = attrs.length, attr = null;


				for(; idx < length; idx++) {
					attr = attrs[idx];
					out[attr.nodeName] = attr.nodeValue;
				}

				return out;

			}
		},
		appendQueryParams: function(url, params) {
			return url + urlParamSep(url) + utils.objToUrlParams(params);
		},
		appendResParams: function(url, dataStore) {
			return utils.appendQueryParams(url, dataStore.get(['resParams']));
		},
		loading: {
			loadScriptSource: function (source, attributes, element) {
				var script = document.createElement('script'),
						$script = null,
						head = element || document.getElementsByTagName('head')[0];

				script.type = "text/javascript";
				script.text = source;

				if(attributes) {

					utils.each(attributes, function(val, key) {
						script.setAttribute(key, val);
					});

				}

				head.appendChild(script);
				return script;
			},

			// Load a script that calls SPX.handle with a list of instructions.
			loadDynamicScript: function( url, reporter, callback ) {

				//If we are in test mode we want to enable mocking ajax calls
				if(typeof g.SPXTESTMOCK === 'function') {
					g.SPXTESTMOCK(utils, url, reporter, callback);
				} else {
					utils.loading.loadScript(url + urlParamSep(url) + "callback=SPX.handle", callback);
				}
			},

			loadScript: function( url, callback ) {
				var script = document.createElement("script"),
						entry = document.getElementsByTagName("script")[0];

				script.type = "text/javascript";
				script.async = true;

				if ( typeof callback === "function" ) {

					if ( script.addEventListener ) {
						script.addEventListener("load", callback, true);
					} else if( script.readyState ) {
						script.attachEvent( "onreadystatechange", function() {
							if ( /complete|loaded/.test( script.readyState ) ) {
								callback();
							}
						});
					}
				}

				// Set source and attach script AFTER adding load event listener
				// to ensure it is registered before the script loads
				script.src = url;
				entry.parentNode.insertBefore(script, entry);
			},
			loadCss: function( cssString, $head, attrs ) {
				var $css = $('<style type="text/css">'+cssString+'</style>');
				$css.attr(attrs || {});
				$head = $head || $('head');
				$head.append($css);
				return $css;
			}
		}
	};

	lodash.extend(utils, lodash);
	return utils;

});
