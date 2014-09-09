/**

	safenames
	====
	A module that provides

	* functional style object property definition and
	* 'name-safe property access.
	
	Instead of setting/getting properties directly on an object instance you declare the properties
	and their default value on a object factory.

	The factory ensures that name typos get catched at runtime by adding for each property a function 
	to the object's prototype, that allows to set or get the value of the property.

	## Installation
	
	If you want to use `safenames` for your node project call:
	
		npm install safenames --savedev
	
	## Usage
	
	### Prototype declaration

		var builder = require("safenames");
		
		var Proto = builder()
			.property("name","defaultValue")
			.property("bar",42)
			.method("foo",function(){})
			.done();

	The variable `Proto` contains an object builder that allows creation of new objects 
	with all the declared properties and methods. To instantiate an object you use the builder's `create` method

		var instance = Proto.create();

		
	### Property access

	The new created object's prototype contains for each property `xyz` a method `$xyz`
	that acts as both getter and setter: When called with an argument it sets the property to the new value,
	when called without argument it returns the value of the property.

	The setter methods return the object, so that setters allow chained value setting:

		instance
			.$name("newValue")
			.$bar(17);

	This not only provides a convenient way to set multiple values of an object. Using a function
	instead of a value assignment to a property prevents you from not catching typos during value access:

	In regular Javascript you will not receive a runtime error when you have typos like

		var theName = instance.nmae;
		instance.abr = 52;

	This is perfectly valid Javascript and will not create a runtime error directly. It just assigns an `undefined` value to the variable `theName`	and silently create a new property `bra`.
	If this was not your intention, this bug will still have a runtime impact, but usually somewhere in your business logic and manifest itself	somewhere else in the code -- quite hard to catch and find.

	By using the getter/setter approach provided by `safenames` those issues are gone:

		var theName = instance.$nmae();
		instance.$abr(52);

	In both cases you will receive a runtime error at the position of the typo because 
	Javascript fails to call an undefined method. 

	This gives your code quite some robustness!

	Of course there is no such thing than free lunch: For this robustness you have to pay by accepting [some performance
	penalty](http://jsperf.com/property-access-vs-getter-setter) due to the additional function call overhead. But in the rare cases, where this minor penalty really matters, (keep in mind that while the relative performance difference may look scary, the absolute difference is on a modern computer
	nothing prevents you from accessing the properties directly - as the objects created are still regular Javascript objects.

	### Alternative object instantiation methods

	In addition to the `create` method the builder object supports alternative ways to instantiate new objects.

	#### Object instantiation with Object.create()

	If you want to instantiate the new object yourself using JavaScript's `Object.create()` method,
	you can still do this by using the builder's `prototype` and `descriptors` methods:

		var Proto = builder()
			.property("name","defaultValue")
			.property("bar",42)
			.method("foo",function(){}),
			.done()
			
		var instance = Object.create(Proto.prototype(),Proto.descriptors());

	As the builder's `create` method does exactly that, it is unlikely that you will ever do this. But 
	sometimes you want to have access to the prototype (e.g. for JavaScript's `isPrototypeOf` method:

		assert.ok(Proto.prototype().isPrototypeOf(instance));
		
	But for that case you might want to use the builder's `createsPrototypeOf` directly, which offer's a more convenient 
	way to write the same:

		assert.ok(Proto.createsPrototypeOf(instance));
		

	#### Use constructor instantiation

	When you instead prefer the classical Javascript object creation with `new Xyz`, you can fetch a constructor function
	from the builder and use this:

		var Proto = builder()
			.property("name","defaultValue")
			.property("bar",42)
			.method("foo",function(){})
			.constructor();
			
		var instance = new Proto();

	As properties already have default values and thanks to the setter chaining you often don't need a initialization function any more. Instead you write something like:

		var instance = new Proto()
			.$name(17);

	If you still need to have an explicit initialization function, you can pass it as function parameter to the
	constructor call:

		var Proto = builder()
			.property("name","defaultValue")
			.property("bar",42)
			.method("foo",function(){})
			.constructor(function(name,bar){
				this.$name(name);
				this.$bar(bar);
			})
			
		var instance = new Proto("newName",17);

	## Reference
	
**/

'use strict';

module.exports=(function(){

var assert = require("assert");

/**
	<a id="factory"></a>The `safenames` module exports solely a factory method for an object builder.
	By *requireing* the `safenames` module you get access to the factory method.
	
		var builderFactory = require("safenames");
		
	You can call the factory method in three different ways:
	
	* `builderFactory()`:
	
		When called without parameter, the factory will create a builder without a super prototype
	
	* `builderFactory(aPrototype)`:
	
		When called with a prototype object, the factory will create a builder with the given
		prototype object as super prototype
		
	* `builderFactory(aObjectBuilder)`:
	
		When called with a `safenames` object builder, it will create a builder that has the same super prototype
		than the objects created by the given builder and that inherits all propeties (and their default values)
		from them too.
	
**/
function newObjectBuilder(prototype){
	return new ObjectBuilder(prototype);
}

/*
### mixedPropertyDescriptor( descriptor... )
takes a (chain of) property descriptor objects and folds them into a single one, where the
properties later in the chain have precedence of those earlier in the chain
*/

function mixedPropertyDescriptor(descriptors){
	var result = {};
	for( var i=0; i<arguments.length; i++ ){
		var d=arguments[i];
		if( d != null ){
			["configurable","enumerable","writable","value","get","set"].forEach(function(p){
				if( d[p] !== undefined ) result[p] = d[p];
			});
		}
	};
	return result;
}

/*
### REGULAR_PROPERTY
The default property descriptor for new created regular properties:
*/

var REGULAR_PROPERTY = {
	configurable:false,
	enumerable:true,
	writable:true,
};

/*
### GETTER_SETTER
The default property descriptor for the getter-setter methods define for regular properties on the object's prototype
*/

var GETTER_SETTER = {
	configurable:false,
	enumerable:false,
	writable:false,
};

/*
### METHOD
The default property descriptor for the methods defined on the object's prototypes:
*/

var METHOD = {
	configurable:true,
	enumerable:false,
	writable:false,
};

function mixedPropertyDescriptors(objects){
	var result = {};
	var args = arguments;
	for( var i=0; i<args.length; i++ ){
		["configurable","enumerable","writable","value","get","set"].forEach(function(dp){
			var d = args[i];
			assert.equal( typeof d, "object"  );
			Object.keys(d).forEach(function(name){
				if( d[name][dp] !== undefined ) {
					if( result[name] == null ){ 
						result[name] = {};
					}
					result[name][dp] = d[name][dp];
				}
			});
		});
	};
	return result;
}

function createPropertyDescriptor(defaultDescriptor,defaultValue,descriptor){
	return defaultValue === undefined && descriptor == null
			? mixedPropertyDescriptor(defaultDescriptor)
			: descriptor == null
			  ? mixedPropertyDescriptor(defaultDescriptor,{value:defaultValue})
			  : defaultValue === undefined
				? mixedPropertyDescriptor(defaultDescriptor,descriptor)
				: mixedPropertyDescriptor(defaultDescriptor,descriptor,{value:defaultValue});
}

function createGetterSetter(propertyName){
	return new Function( "return arguments.length==0 ? this."+propertyName+" : (this."+propertyName+"=arguments[0],this)" );
}

function ObjectBuilder ( prototype, parent ){
	this.parent = parent;
	this.scalarProperties = {};
	this.objectProperties = {};
	if( prototype == null ){
		this.proto = new Prototype();
	}
	else if (Object.prototype.isPrototypeOf.call(ObjectBuilder.prototype,prototype)) {
		this.proto = Object.create(prototype.proto);
		this.scalarProperties = mixedPropertyDescriptors(prototype.scalarProperties);
		this.objectProperties = mixedPropertyDescriptors(prototype.objectProperties);
	}
	else {
		this.proto = Object.create(prototype);
		this.proto.$$ = Prototype.prototype.$$;
	}
}

ObjectBuilder.prototype = {
/**	
	### Methods for object property declaration
	
	An object builder provides various chainable methods for the declaration of the
	object.
	
	#### <a id="property"></a>Method `.property(propertyName [, defaultValue [, propertyDescriptor] ] )`
	
	When `defaultValue` is given and contains a function then `property`-method behaves exactly like the
	[`method`](#method)-method.
	
	In all other case the method call declares an additional property with name `propertyName`. 
	The object's prototype will
	in addition contain a combined getter/setter function named `'$'+propertyName`. This function will, 
	
	* when called without parameter, return the property value,
	* when called with parameter, set the property to the given value.
	
	When `defaultValue` is given every object instance created by that builder will then
	contain the property set to the given default value. 
	
	When the given default value is an object, each instance will contain a deep-clone of the given object.
	In addition the cloned objects (and their sub objects) will also contain corresponding getter/setter methods
	for each of their properties.
	
	The method also accepts a propertyDescriptor as defined for [Object.defineProperty](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty). 
	This parameter allows a fine grained control over the property. If not provided, properties declared with 
	this method will default to 
	
	* configurable:false
	* enumerable:true
	* writable:true
	
	and by that behave like regular properties created for any object. The given parameter doesn't replace the
	default behaviour, but just overwrites attribute by attribute. So to make a property read-only it is sufficient
	to pass `{ writeable : false }`;
	
	**ATTENTION!** Usually the propertyDescriptor's `value` attribute gets ignored and instead the behaviour as described
	for the `defaultValue` parameter gets applied. Only when `defaultValue` is explicitly set to `undefined`
	the `value` attribute gets applied, but then without the deep-clone mechanism of `defaultValue`. This will cause, in case of object values, that all instances will share the same instance of the descriptor's defaultValue. This is then
	equivalent to calling the [`rawProperty`](#rawProperty)-method.
	
**/
	property: function(propertyName, defaultValue, descriptor){
		assert.ok(propertyName != null,"missing property name");
		if( typeof defaultValue == "function" ){
			return this.method(propertyName,defaultValue,descriptor);
		}
		else if( typeof defaultValue == "object" ){
			var valueBuilder = Array.isArray(defaultValue) 
				? defaultValue.map( function(item){	
					return typeof item == "object" 
						? new ObjectBuilder(item.prototype).properties(item).done()
						: item; 
				  } )
				: new ObjectBuilder(defaultValue.prototype).properties(defaultValue).done();
			this.objectProperties[propertyName] = createPropertyDescriptor(
				REGULAR_PROPERTY, valueBuilder, descriptor 
			);
		}
		else {
			this.scalarProperties[propertyName] = createPropertyDescriptor(
				REGULAR_PROPERTY, defaultValue, descriptor 
			);
		}
		return this.prototypeProperty(
			"$"+propertyName
			,createGetterSetter(propertyName)
			,GETTER_SETTER
		);
	},
/**	
	#### <a id="method"></a>Method `.method(propertyName, defaultValue [, propertyDescriptor] )`
	
	Declares a property with the given name `methodName` and function `fn` for the **prototype of the
	object**.
	
	The method property's descriptor defaults to 

	* configurable:true
	* enumerable:false
	* writable:false

	and can get overwritten with the optional `propertyDescriptor` parameter.
	
	This method is intended to be used for *real* methods, shared amongst all instances of objects created by
	a builder. If you intent to modify a function property on individual instances, you should use the regular
	[`property`](#property)-method instead
**/
	method: function(methodName, fn, propertyDescriptor){
		assert.ok(methodName != null,"missing method name");
		assert.ok(arguments.length>1,"missing function argument for method \""+methodName+"\"");
		return this.prototypeProperty( methodName, fn, mixedPropertyDescriptor( METHOD, propertyDescriptor ) );
	},
/**	
	#### <a id="constant"></a>Method `.constant(propertyName, defaultValue [, propertyDescriptor] )`
	
	Declares a property with the given name `constantName` and value `value` for the **prototype of the
	object**. For implicit name checks also a getter/setter method will get defined.
	
	The constant property's descriptor defaults to 

	* configurable:false
	* enumerable:false
	* writable:false

	and can get overwritten with the optional `propertyDescriptor` parameter.
	
	**ATTENTION!** Being created on the prototype, the property's `defaultValue` is shared amongst all objects created by
	that builder. But when `defaultValue` is an object only the reference to the object is constant, the object
	itself can still be variable and modified by every instance, unless the object itself is protected against
	modifications, e.g. by [Object.freeze](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze).
**/
	constant: function(constantName, value, propertyDescriptor){
		assert.ok(constantName != null,"missing constant name");
		assert.ok(arguments.length>1,"missing value for constant \""+constantName+"\"");
		this.prototypeProperty(
			"$"+constantName
			,createGetterSetter(constantName)
			,GETTER_SETTER
		);
		return this.prototypeProperty( constantName, value, propertyDescriptor );
	},
/**	
	#### <a id="nested"></a>Method `.nested(propertyName [, prototype [, propertyDescriptor] ] )`
	
	Declares a new property `propertyName` and a getter/setter method identically to the [property](#property)-method. In addition a new object builder that will get used for the property's in instances.
	
	
	The method returns the new object builder -- changing the scope of the method chain. To return to the encompassing
	object builder, use the `done` method:
	
		var B = builder()
			.property("a",1)
			.nested("b")
				.property("c",2)
				.done()
			.property(d,3)
			.done();
			
		var b = B.create(); // { a:15, b:{ c:2 ], d: 3 }
	
	
	The optional `prototype` has the same semantics as the parameter for the [factory method](#factory).
	
	The nested property's descriptor defaults to 

	* configurable:true
	* enumerable:true
	* writable:true

	and can get overwritten with the optional `propertyDescriptor` parameter.
	
**/
	nested: function(propertyName,prototype,propertyDescriptor){
		assert.ok(propertyName != null,"missing property name");
		var result =  new ObjectBuilder(prototype,this);
		this.objectProperties[propertyName] = 
			mixedPropertyDescriptor(REGULAR_PROPERTY,propertyDescriptor,{value:result});
		this.prototypeProperty(
			"$"+propertyName
			,createGetterSetter(propertyName)
			,GETTER_SETTER
		);	
		return result;
	},
/**	
	#### <a id="prototypeProperty"></a>Method `.prototypeProperty(propertyName [, defaultValue [, propertyDescriptor] ] )`
	
	Allows to directly define a property on the property of the objects.
	
	The given `value` overwrites the given propertyDescriptor's value property, unless explicitly set to `undefined`.
	
	See [Object.defineProperty()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty) for descriptor defaults.
	
**/	
	prototypeProperty: function(propertyName,value,propertyDescriptor){
		Object.defineProperty(
			this.proto
			,propertyName
			,value === undefined ? propertyDescriptor : mixedPropertyDescriptor( propertyDescriptor,{ value: value } )
		);
		return this;
	},
/**	
	#### <a id="properties"></a>Method `.properties(properties)`
	
	A convenience method that all to declare all [own properties](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/getOwnPropertyNames) of the given `properties` parameter as
	properties by calling the [`property`](#property)-method for each of them, with `defaultValue` set to its value.
	
**/	
	properties: function(propertyPrototype){
		if( propertyPrototype == null ) return this;
		assert.equal( typeof propertyPrototype, "object" );
		var self = this;
		Object.getOwnPropertyNames(propertyPrototype)
			.forEach( function(p){ self.property(p, propertyPrototype[p]); } );
		return this;
	},
/**	
	#### <a id="rawProperty"></a>Method `.rawProperty(propertyName [, defaultValue [, propertyDescriptor] ] )`
	
	Behaves similar the [`property`](#property) method and creates a getter/setter method for the
	given `properyName`, but doesn't analyse the type of the `defaultValue`
	parameter.
	
	This is useful in two cases:
	
	* a property is supposed to hold a (variable) function value, for which you want getter/setter methods
	* the defaultValue is an object that is supposed to be shared amongst all object instances, rather than
		each instance holding a private, getter-setter enriched deep-clone of the `defaultValue`
	
**/
	rawProperty: function(propertyName, defaultValue, descriptor){
		assert.ok(propertyName != null,"missing property name");
		this.scalarProperties[propertyName] = createPropertyDescriptor(
			REGULAR_PROPERTY, defaultValue, descriptor 
		);
		return this.prototypeProperty(
			"$"+propertyName
			,createGetterSetter(propertyName)
			,GETTER_SETTER
		);
	},
	done: function(){
		return this.parent == null ? this : this.parent;
	},
/**	
	### Methods for object instantiation
	
	#### create()
	
	Creates a new instance if the object declared through the builder.
	
**/	
	create: function(){
		return Object.create(this.proto,this.descriptors());
	},
	constructor: function(){
		var descs = this.descriptors();
		var baseConstructor = function(){
			Object.defineProperties(this,descs);
		};
		var constructor;
		if(arguments.length>0){
			var fn = arguments[0];
			assert.ok( typeof fn == "function", "constructor argument must be a function" );
			constructor = function(){ baseConstructor.apply(this);fn.apply(this,arguments); }
		}
		else {
			constructor = function(){ baseConstructor.apply(this); };
		}
		constructor.prototype = this.proto;
		return constructor;
	},
	prototype: function(){
		return this.proto;
	},
	descriptors: function(){
		if( Object.keys(this.objectProperties).length == 0 ) return this.scalarProperties;
		var objectDesc = mixedPropertyDescriptors(this.scalarProperties, this.objectProperties);
		Object.keys(this.objectProperties).forEach(function(p){
			var desc = objectDesc[p];
			desc.value = Array.isArray( desc.value )
				? desc.value.map( function(item){ return typeof item == "object" ? item.create() : item;} )
				: desc.value.create();
		});
		return objectDesc;
	},
	createsPrototypeOf: function(obj){
		return this.proto.isPrototypeOf(obj);
	}
}

function Prototype(){}
Prototype.prototype.$$ = function(propertyName,value,propertyDescriptor){
	Object.defineProperty(
		this
		,propertyName
		,value === undefined 
			? mixedPropertyDescriptor( REGULAR_PROPERTY, propertyDescriptor )
			: mixedPropertyDescriptor( REGULAR_PROPERTY, propertyDescriptor,{ value: value } )
	);	
	Object.defineProperty(
		this
		,"$"+propertyName
		,mixedPropertyDescriptor( GETTER_SETTER,{ value: createGetterSetter(propertyName) } )
	);	
	return this;
};


return newObjectBuilder;

}());