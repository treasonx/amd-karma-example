define(['utils', 'jquery'], function(utils, $) {

	var mockReporter = {
		log:function() {},
		error: function() {}
	};
	describe("Utils", function() {

		describe('getViewPortInfo', function() {

			var $head = null;

			beforeEach(function() {
				$head = $('<div>');
			});

			function setupViewport(content) {
				$head.append($('<meta>', {
					name: 'viewport',
					content: content
				}));
				return utils.getViewPortInfo($head);
			}

			it('should return an empty object if no element provided', function() {
				var result = utils.getViewPortInfo();
				expect(utils.isObject(result)).toBeTruthy();
				expect(utils.isEmpty(result)).toBeTruthy();
			});

			it('should return an empty object if meta tag is missing', function() {
				$head.append($('<meta>', {
					name: 'bogus'
				}));
				var result = utils.getViewPortInfo($head);
				expect(utils.isObject(result)).toBeTruthy();
				expect(utils.isEmpty(result)).toBeTruthy();
			});

			it('should return an object with viewport properties', function() {
				var result = setupViewport('width=device-width');
				expect(result.width).toEqual('device-width');
			});

			it('should return an object with viewport properties with multiple meta tags', function() {
				$head.append($('<meta>', {
					name: 'keywords',
					content: 'thing,seo,yea'
				}));
				$head.append($('<meta>', {
					name: 'viewport',
					content: 'width=device-width'
				}));
				$head.append($('<meta>', {
					name: 'keywords',
					content: 'thing,seo,yea'
				}));
				var result = utils.getViewPortInfo($head);
				expect(result.width).toEqual('device-width');
			});

			it('should return an object with comma seperated viewport properties', function() {
				var result = setupViewport('width=device-width,scale=1.0');
				expect(utils.size(result)).toEqual(2);
				expect(result.width).toEqual('device-width');
				expect(result.scale).toEqual('1.0');
			});

			it('should return an object with a single comma separated viewport properties', function() {
				var result = setupViewport('width=device-width,');
				expect(utils.size(result)).toEqual(1);
				expect(result.width).toEqual('device-width');
			});

			it('should return an object with semicolon separated', function() {
				var result = setupViewport('width=device-width;scale=1.0');
				expect(utils.size(result)).toEqual(2);
				expect(result.width).toEqual('device-width');
				expect(result.scale).toEqual('1.0');
			});

			it('should return an object with semicolon separated', function() {
				var result = setupViewport('width=device-width scale=1.0');
				expect(utils.size(result)).toEqual(2);
				expect(result.width).toEqual('device-width');
				expect(result.scale).toEqual('1.0');
			});

		});


		describe("publisher/subscriber decorator", function() {

			var pubsub = utils.decorators.pubsub,
				target;

			beforeEach( function() {
				target = {};
				pubsub( target );
			});

			describe("shape", function() {

				it("defines a 'publish' method", function() {
					expect( typeof target.publish ).toBe( "function" );
				});

				it("defines a 'subscribe' method", function() {
					expect( typeof target.subscribe ).toBe( "function" );
				});

				it("defines a 'unsibscribe' method", function() {
					expect( typeof target.unsubscribe ).toBe( "function" );
				});
			});

			describe( "publishing", function() {

				var spy1, spy2,
					errorThrower = function() {
						throw "Error!";
					},
					eventData = { testing: 123 },
					eventName1 = "testEvent1",
					eventName2 = "testEvent2";

				beforeEach( function() {
					spy1 = jasmine.createSpy();
					spy2 = jasmine.createSpy();
					spy3 = jasmine.createSpy();
					spy4 = jasmine.createSpy();
				});

				it( "invokes the subscribed method with the supplied arguments", function() {

					target.subscribe( eventName1, spy1 );

					target.publish( eventName1, eventData );

					expect( spy1 ).toHaveBeenCalledWith( eventName1, eventData );
				});

				it( "invokes only methods subscribed to the triggered event", function() {

					target.subscribe( eventName1, spy1 );
					target.subscribe( eventName2, spy2 );

					target.publish( eventName1, eventData );

					expect( spy1 ).toHaveBeenCalledWith( eventName1, eventData );
					expect( spy2 ).not.toHaveBeenCalled();
				});

				it( "invokes all methods subscribed to the triggered event", function() {

					target.subscribe( eventName1, spy1 );
					target.subscribe( eventName1, spy2 );

					target.publish( eventName1, eventData );

					expect( spy1 ).toHaveBeenCalledWith( eventName1, eventData );
					expect( spy1 ).toHaveBeenCalledWith( eventName1, eventData );
				});

				it( "does not catch errors thrown by subscribed methods", function() {

					var err = new Error( "Uh Oh" );
						thrower = function() {
						throw err;
					};

					target.subscribe( eventName1, thrower );

					expect( function() { target.publish( eventName1, eventData ); } ).toThrow( err );
				});

				it( "does not invoke methods after they have been unsubscribed", function() {

					target.subscribe( eventName1, spy1 );
					target.publish( eventName1, eventData );
					target.unsubscribe( eventName1, spy1 );

					target.publish( eventName1, eventData );

					expect( spy1.callCount ).toBe( 1 );
				});

				it( "publishes to all subscribers within a namespace", function() {

					target.subscribe( eventName1, spy1 );
					target.subscribe( eventName1 + ".pennisi", spy2 );
					target.subscribe( eventName1 + ".jordan", spy3 );
					target.subscribe( eventName2, spy4 );

					target.publish( eventName1, eventData );

					expect( spy1 ).toHaveBeenCalled();
					expect( spy2 ).toHaveBeenCalled();
					expect( spy3 ).toHaveBeenCalled();
					expect( spy4 ).not.toHaveBeenCalled();
				});
			});
		});

		describe("dereference", function() {

			var dereference = utils.dereference,
				ex = {
					attr1: {
						a: 1,
						b: 2
					},
					attr2: {
						a: 3,
						b: 4
					}
				};


			it( "returns the specified attribute", function() {

				expect( dereference( ex, [] ) ).toBe( ex );
				expect( dereference( ex, ["attr1"] ) ).toBe( ex.attr1 );
				expect( dereference( ex, ["attr2"] ) ).toBe( ex.attr2 );
				expect( dereference( ex, ["attr1", "a"] ) ).toBe( 1 );
				expect( dereference( ex, ["attr1", "b"] ) ).toBe( 2 );
				expect( dereference( ex, ["attr2", "a"] ) ).toBe( 3 );
				expect( dereference( ex, ["attr2", "b"] ) ).toBe( 4 );
			});

			it( "returns 'undefined' when no element exists", function() {

				expect( dereference( ex, ["attr3"] ) ).toBeUndefined();
				expect( dereference( ex, ["attr3", "a"] ) ).toBeUndefined();
				expect( dereference( ex, ["attr1", "c"] ) ).toBeUndefined();
				expect( dereference( ex, ["attr1", "a", "b"] ) ).toBeUndefined();
			});

			it("creates the specified objects when the 'create' parameter is true", function() {

				dereference( ex, ["attr1", "d", "e", "f"], "test" );

				expect( ex.attr1.d ).toEqual({
					e: {
						f: "test"
					}
				});
				expect( ex.attr1.d.e ).toEqual({
					f: "test"
				});
				expect( ex.attr1.d.e.f ).toBe( "test" );
			});

			it("throws an error when trying to define an attribute of an incompatable type", function() {

				expect( function() { dereference( ex, ["attr1", "a", "b", "c"], true); } ).toThrow();

			});
		});

		describe("dom", function() {

				describe('applyIEImageFix', function() {

					it('should remove height and width from all images', function() {
						var $ele = $(['<div>',
							'<img src="/images/test.jpg" height=200>',
							'<div>',
								'<img src="images.test.jpg" width=500>',
							'</div>',
						'</div>'].join(''));
						utils.dom.applyIEImageFix($ele);
						$ele.find('img').each(function() {
							var $this = $(this);
							expect($this.attr('height')).toBeFalsy();
							expect($this.attr('width')).toBeFalsy();
						});
					});
				});

				describe("getText", function() {

						var ex,
								elemText,
								tmp;

						beforeEach(function() {
								ex = document.createDocumentFragment();
						});

						it("correctly gets text from shallow elements", function() {

								tmp = document.createElement("b");
								tmp.innerHTML = "of the";
								ex.appendChild(document.createTextNode("queens "));
								ex.appendChild(tmp);
								ex.appendChild(document.createTextNode(" stone age"));

								elemText = utils.dom.getText(ex);

								expect(elemText).toBe("queens of the stone age");
						});

						it("correctly gets text from deep elements", function() {

								tmp = ex;

								for( var i = 0; i < 10; ++i ) {
										tmp = tmp.appendChild(document.createElement('p'));
										tmp.appendChild(document.createTextNode(i));
								}

								elemText = utils.dom.getText(ex);

								expect(elemText).toBe('0123456789');
						});
				});

		});

		describe("loading", function() {


				/*
				 * Language Utility Specs
				 */

				describe('object to url params', function() {

					it('should convert simple object to url parms', function() {
						var simple = {name:'james',isHuman: true, age: 99 },
								out;
						out = utils.objToUrlParams(simple);
						expect(out).toEqual('name=james&isHuman=true&age=99');

					});

					it('should escape the params', function() {
						var complex = {crazy: 'this has spaces', nuts: 'this ? & things'},
								out;
						out = utils.objToUrlParams(complex);
						expect(out).toEqual('crazy='+escape(complex.crazy)+'&nuts='+escape(complex.nuts));
					});

					it('handle arrays', function() {
						var a = ['three', 'little', 'pigs'],
								out;
						out = utils.objToUrlParams(a);
						expect(out).toEqual('0=three&1=little&2=pigs');
					});

				});

				describe('url to obj', function() {
					it('should convert complete URL to object', function() {
						var url = 'http://localhost:8080/index.html?thing=james&count=34&last=morrin',
								out;

						out = utils.urlToObject(url);
						expect(out).toEqual({thing:'james', count:'34', last: 'morrin'});
					});

					it('should convert params to object', function() {
						var params = 'thing=james&count=34&last=morrin',
								out;
						out = utils.urlToObject(params);
						expect(out).toEqual({thing:'james', count:'34', last: 'morrin'});
					});

					it('should conver params with ? to object', function() {
						var params = '?thing=james&count=34&last=morrin',
								out;
						out = utils.urlToObject(params);
						expect(out).toEqual({thing:'james', count:'34', last: 'morrin'});
					});

					it('should not include params with empty values', function() {
						var params = 'thing=&count=34&last=morrin',
								out;
						out = utils.urlToObject(params);
						expect(out).toEqual({count:'34', last: 'morrin'});
					});

					it('should decode values and keys in params', function() {
						var params = 'thing=james%20morrin&count=34&last=morrin',
								out;
						out = utils.urlToObject(params);
						expect(out).toEqual({thing: 'james morrin', count:'34', last: 'morrin'});

					});

				});

				describe('resolve url', function() {

					var resolveUrl = utils.resolveUrl;

					it('should detects sbsolute url and return the url unmodified', function() {
						var url = 'http://www.swoop.com',
								base = 'http://hobo.swoop.com/',
								result = null;

						result = resolveUrl(base, url);
						expect(result).toEqual(url);
					});

					it('should create create absolute from relative uri', function() {
						var url = 'path/to/thinger',
								base = 'http://hobo.swoop.com/',
								result = null;

						result = resolveUrl(base, url);
						expect(result).toEqual(base+url);
					});

				it('should deal with base missing trailing slash', function() {
						var url = 'path/to/thinger',
								base = 'http://hobo.swoop.com',
								result = null;

						result = resolveUrl(base, url);
						expect(result).toEqual(base+'/'+url);
				});

				it('should deal with uri containing containing slash', function() {
						var url = '/path/to/thinger',
								base = 'http://hobo.swoop.com/',
								result = null;

						result = resolveUrl(base, url);
						expect(result).toEqual(base+'path/to/thinger');

				});

				it('should deal with slashes missing base but on uri', function() {
						var url = '/path/to/thinger',
								base = 'http://hobo.swoop.com',
								result = null;

						result = resolveUrl(base, url);
						expect(result).toEqual(base+'/path/to/thinger');
				});

				it('should return a corrent base url if no uri is specified', function() {
					var base = 'http://www.swoop.com',
							result;

					result = resolveUrl(base);
					expect(result).toEqual(base+'/');

				});

				it('should return a corrent base url if no uri is specified and there is a trailing slash', function() {
					var base = 'http://www.swoop.com/',
							result;

					result = resolveUrl(base);
					expect(result).toEqual(base);

				});

				it('should return a a correct url if base is missing trailing slash', function() {
					var base = 'http://www.swoop.com',
							result;

					result = resolveUrl(base);
					expect(result).toEqual(base+'/');

				});

			});

			describe('check platform support', function() {
				it('should return ie version number for ie 6', function() {
					var v = utils.getIEVersion('Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)');
					expect(v).toEqual(6);
				});

			});

			describe('weighted choice', function() {
				var realRand = Math.random,
						randReturn = 0;

				var result = null;

				var vals = [
					{
						weight: 10,
						value: 10
					},
					{
						weight: 30,
						value: 30
					},
					{
						weight: 60,
						value: 60
					}
				];

				function notRand() {
					return randReturn;
				}

				function setRandom(val) {
					randReturn = val;
					Math.random = notRand;
				}

				afterEach(function() {
					Math.random = realRand;
				});

				it('should return value 10', function() {
					setRandom(0.1);
					result = utils.getWeightedRandom(vals);
					expect(result.value).toEqual(10);
				});

				it('should return value 30', function() {
					setRandom(0.11);
					result = utils.getWeightedRandom(vals);
					expect(result.value).toEqual(30);
				});

				it('should return value 30', function() {
					setRandom(0.4);
					result = utils.getWeightedRandom(vals);
					expect(result.value).toEqual(30);
				});

				it('should return value 60', function() {
					setRandom(0.41);
					result = utils.getWeightedRandom(vals);
					expect(result.value).toEqual(60);
				});

			});

			describe('weighted choice random test', function() {
				var vals = [
					{
						weight: 10,
						value: 10
					},
					{
						weight: 30,
						value: 30
					},
					{
						weight: 60,
						value: 60
					}
				];

				var n10Count = 0, n30Count = 0, n60Count = 0, shouldContinue = true;

				function getRandomVal() {
					var r = utils.getWeightedRandom(vals);
					if(r.value === 10) {
						n10Count++;
					} else if (r.value === 30) {
						n30Count++;
					} else if (r.value === 60) {
						n60Count++;
					} else {
						expect(false).toBeTruthy();
					}

					if(shouldContinue) {
						setTimeout(getRandomVal, 0);
					}
				}

				it('should see all values atleast once', function() {

					runs(function() {
						getRandomVal();
					});

					waitsFor(function() {
						return n10Count > 0 && n30Count > 0 && n60Count > 0;
					}, 'waiting to see all values');

					runs(function() {
						expect(n60Count).toBeGreaterThan(0);
						expect(n30Count).toBeGreaterThan(0);
						expect(n10Count).toBeGreaterThan(0);
					});
				});


			});
		});

		describe("appendResParams", function() {
			var phonyDataStore = {
				get: function() {
					return {
						"a": "a",
						"b": 123,
						"c": [ "see", "sea" ]
					}
				}
			};

			it("works correctly on base URL that has no query string", function() {
				var result = utils.appendResParams("http://swoop.com", phonyDataStore);
				expect(result).toEqual("http://swoop.com?a=a&b=123&c=see&c=sea");
			});

			it("works correctly on base URL that has query string", function() {
				var result = utils.appendResParams("http://swoop.com?0=1", phonyDataStore);
				expect(result).toEqual("http://swoop.com?0=1&a=a&b=123&c=see&c=sea");
			});
		});


		describe('timeoffset calculation', function() {
			var getTs = null;
			var originalDate = Date;

			function isTimeAcceptable(ts) {
				var now = new Date().getTime();
				return ts >= (now-10) && ts <= (now+10);
			}

			beforeEach(function() {
				this.addMatchers({

					toBeAcceptable: function() {
						var ts = this.actual;
						var now = new originalDate().getTime();
						var lowest = now - 10;
						var highest = now + 10

						this.message = function () {
							return "Expected " + ts + " to be between " + lowest + " and " + highest + " now is "+now;
						}

						return ts >= lowest && ts <= highest;
					}

				});
			});

			afterEach(function() {
				Date = originalDate;
			});

			it('should adjust for dates in the distant future', function() {
				var serverTime = new Date().getTime();
				Date = function() {
					return new originalDate(new originalDate().getTime()+50000000000);
				}
				getTs = utils.getServerTimeFn(serverTime);
				expect(getTs()).toBeAcceptable();
			});

			it('should adjust for dates in the distant past', function() {
				var serverTime = new Date().getTime();
				Date = function() {
					return new originalDate(new originalDate().getTime()-50000000000);
				}
				getTs = utils.getServerTimeFn(serverTime);
				expect(getTs()).toBeAcceptable();
			});

			it('should adjust for dates in the near future', function() {
				var serverTime = new Date().getTime();
				Date = function() {
					return new originalDate(new originalDate().getTime()+5);
				}
				getTs = utils.getServerTimeFn(serverTime);
				expect(getTs()).toBeAcceptable();
			});

			it('should adjust for dates in the distant past', function() {
				var serverTime = new Date().getTime();
				Date = function() {
					return new originalDate(new originalDate().getTime()-5);
				}
				getTs = utils.getServerTimeFn(serverTime);
				expect(getTs()).toBeAcceptable();
			});


		});

		describe('css', function() {
			it('adds css to the given header', function() {
				var container = $('<div/>');
				var result = utils.loading.loadCss('.example { visible: true; }', container);
				expect(container.find('style').html()).toContain('example');
				expect(result.html()).toContain('example');
			});

			it('adds css to the default header', function() {
				var testEle = null;
				result = utils.loading.loadCss('.example { visible: true; }');
				$('style').each(function() {
					if(this === result[0]) {
						testEle = $(this);
					}
				});
				expect(testEle.html()).toContain('example');
			});

			it('adds a style tag with attributes', function() {
				var container = $('<div/>');
				var result = utils.loading.loadCss('', container, { media: 'print' });
				expect(container.find('style').attr('media')).toEqual('print');
			});

			afterEach(function() {
				$('style:contains("example")').remove();
			});
		});

		describe('cleanUnknownChars', function() {
			it('should return empty string or null text', function() {
				var r = utils.cleanUnknownChars();
				expect(r).toEqual('');
			});
		});

		describe('noop', function() {
			it('should return undefined', function() {
				var a = utils.noop();
				expect(a).toBeFalsy();
			});
		});

		describe('walkObject', function() {
			it('should return undefined for empty object', function() {
				var result = utils.walkObject(null, function() {}, $);
				expect(result).toBeFalsy();
			});
		});

		describe('getGUID', function() {

			it('should provide a valid guid', function(){
				var guid = utils.getGUID();
				expect(utils.isGUID(guid)).toBeTruthy();
			});

		});

		describe('offsite handler', function() {

			var analyticsSpy = null;
			var dataStore = null;
			var globalSpy = null;
			var handler = null;

			beforeEach(function() {
				analyticsSpy = {
					stageConversion: function() {
						var d = $.Deferred();
						d.resolve();
						return d.promise();
					},
					startConversion: utils.noop
				};
				spyOn(analyticsSpy, 'stageConversion').andCallThrough();
				spyOn(analyticsSpy, 'startConversion');
				dataStore = {};
				globalSpy = jasmine.createSpyObj('global', ['open']);
				handler = utils.getOffsiteHandler(globalSpy, analyticsSpy, dataStore);
			});

			it('should open a new window with URL', function() {
				var url = 'http://www.example.com';
				handler(url);
				expect(globalSpy.open.mostRecentCall.args[0]).toBe(url);
			});

			it('should stage a conversion event', function() {
				var url = 'http://www.example.com';
				var id = 'nomnom';
				var context = {some:'value'};
				handler(url, context, id);
				expect(analyticsSpy.stageConversion).toHaveBeenCalled();
			});

			//it('should send a conversion event', function() {
				//var url = 'http://www.example.com';
				//var id = 'nomnom';
				//var context = {some:'value'};
				//handler(url);
				//expect(analyticsSpy.startConversion).toHaveBeenCalled();
			//});


		});

	});
});

