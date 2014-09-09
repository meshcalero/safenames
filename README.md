

safenames
====
A module that provides

* functional style object property definition and
* 'name-safe property access.

Instead of setting/getting properties directly on an object instance you declare the properties
and their default value on a object factory.

The factory ensures that name typos get catched at runtime by adding for each property a function 
to the object's prototype, that allows to set or get the value of the property.


[![NPM](https://nodei.co/npm/safenames.png)](https://nodei.co/npm/safenames/)



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

	
#### <a id="prototypeProperty"></a>Method `.prototypeProperty(propertyName [, defaultValue [, propertyDescriptor] ] )`

Allows to directly define a property on the property of the objects.

The given `value` overwrites the given propertyDescriptor's value property, unless explicitly set to `undefined`.

See [Object.defineProperty()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty) for descriptor defaults.

	
#### <a id="properties"></a>Method `.properties(properties)`

A convenience method that all to declare all [own properties](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/getOwnPropertyNames) of the given `properties` parameter as
properties by calling the [`property`](#property)-method for each of them, with `defaultValue` set to its value.

	
#### <a id="rawProperty"></a>Method `.rawProperty(propertyName [, defaultValue [, propertyDescriptor] ] )`

Behaves similar the [`property`](#property) method and creates a getter/setter method for the
given `properyName`, but doesn't analyse the type of the `defaultValue`
parameter.

This is useful in two cases:

* a property is supposed to hold a (variable) function value, for which you want getter/setter methods
* the defaultValue is an object that is supposed to be shared amongst all object instances, rather than
	each instance holding a private, getter-setter enriched deep-clone of the `defaultValue`

	
### Methods for object instantiation

#### create()

Creates a new instance if the object declared through the builder.

## License(s)

### MIT

Copyright (c) 2014 Andreas Schmidt

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.