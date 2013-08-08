define(function() {
	'use strict';
	/*
	dereference
	Arguments:
		<object> object - the object to dereference
		<array> path - an array of values to expect as attributes to the
			specified object
		<object> andDefine - if specified, this value will be defined at
			the specified attribute (and any intermediate values will be
			assigned object literals
	Examples:
		Getting:
		var test = {}, result;
		result = dereference( test, ["path", "to", "value"] );

		result == undefined

		Setting:
		var test = {}, result;
		result = dereference( test, ["path", "to", "value"], "theValue" );

		result == "theValue"
		test == { path: { to: { value: "theValue" } } } */
	return function( object, path, andDefine, overwrite ) {

		var idx, len, relative, property;

		if ( !path ) {
			return object;
		}

		relative = object;

		for ( idx = 0, len = path.length; idx < len; ++idx ) {
			property = path[ idx ];
			if ( typeof relative[ property ] === 'undefined' ) {
				if ( andDefine ) {

					// If there are more attributes specified, define an
					// object literal in this attribute to support further
					// nesting
					if ( idx < len - 1 ) {
						relative[ property ] = {};

					// Otherwise, this is the final attribute specified, so
					// define its value as the value specified
					} else {
						relative[ property ] = andDefine;
					}

					// JavaScript silently fails to add properties to certain
					// value types (i.e. Numbers, booleans, and string literals),
					// So an explicit check is made to ensure the attribute
					// was successfully attached
					if ( typeof relative[ property ] === 'undefined' ) {
						throw new Error('dereference: Unable to assign property of value: ' + relative);
					}
				} else {
					return;
				}
			} else if (overwrite && idx === path.length-1) {
				relative[property] = andDefine;
			}
			relative = relative[ property ];
		}
		return relative;
	};
});
