/*

safenames_test.js
====

*/

'use strict';

//var prototype = require("../");
var prototype = require("../src/safenames.js");

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports['safenames'] = {
  setUp: function(done) {
    // setup here
    done();
  },
  'regular properties': function(test) {
    test.expect(4);
	var i = prototype()
		.property("name","defaultValue")
		.property("bar",42)
		.method("foo",function(){test.equals(this.bar,42);})
		.create();
	test.ok(i != null);
	test.equals(i.name,"defaultValue");
	test.equals(i.bar, 42);
	i.foo();
	test.done();
  },
  'setter': function(test) {
    test.expect(3);
	var i = prototype()
		.property("name")
		.create();
	test.ok(i != null);
	test.equals(i.$name("lala"),i,"setter doesn't return object");
	test.equals(i.name, "lala","setter didn't set value");
	test.done()
  },
  'getter': function(test) {
    test.expect(3);
	var i = prototype()
		.property("name",42)
		.create();
	test.ok(i != null);
	test.equals(i.$name(),42);
	i.$name(17);
	test.equals(i.$name(),17);
	test.done()
  },
  'constant': function(test) {
    test.expect(4);
	
	var i = prototype()
		.constant("con",42)
		.create();
	test.ok(i != null);
	test.equals(i.con,42);
	test.throws(function(){
		i.con = (17);
	});
	test.equals(i.con,42);
	test.done()
  },
  'constructor': function(test) {
    test.expect(3);
	var C = prototype()
		.property("name",42)
		.constructor();
	var i = new C();
	test.ok(i != null);
	test.ok( i instanceof C, "i no instance of C" );
	test.equals(i.$name(),42);
	test.done()
  },
  'complex constructor': function(test) {
    test.expect(4);
	var C = prototype()
		.property("name",42)
		.constructor(function(){test.ok(true)});
	var i = new C();
	test.ok(i != null);
	test.ok( i instanceof C, "i no instance of C" );
	test.equals(i.$name(),42);
	test.done()
  },
  'object properties': function(test) {
    test.expect(2);
	var p = prototype()
		.properties( { name : { a: 42 } } )
		.done();
	var i = p.create();
	test.ok(i != null && p != null);
	test.equals(i.$name().$a(),42);
	test.done()
  },
  'array properties': function(test) {
    test.expect(3);
	var p = prototype()
		.properties( { name : [{ a: 42 }, 17] } )
		.done();
	var i = p.create();
	test.ok(i != null && p != null);
	test.equals(i.$name()[0].$a(),42);
	test.equals(i.$name()[1],17);
	test.done()
  },
  'unmodified prototype scalar': function(test) {
    test.expect(3);
	var p = prototype()
		.property("name",42)
		.done();
	var i = p.create();
	test.ok(i != null && p != null);
	i.$name(17);
	test.equals(i.$name(),17);
	var j = p.create();
	test.equals(j.$name(),42);
	test.done()
  },
  'unmodified prototype object properties': function(test) {
    test.expect(4);
	var p = prototype()
		.properties( { name : { a: 42 } } )
		.done();
	var i = p.create();
	test.ok(i != null && p != null);
	test.equals(i.$name().$a(),42);
	i.$name().$a(17);
	var j = p.create();
	test.equals(i.$name().$a(),17);
	test.equals(j.$name().$a(),42);
	test.done()
  },

  'unmodified prototype array properties': function(test) {
    test.expect(4);
	var p = prototype()
		.properties( { name : [{ a: 42 }, 17] } )
		.done();
	var i = p.create();
	test.ok(i != null && p != null);
	test.equals(i.$name()[0].$a(),42);
	i.$name().push(22);
	i.$name()[0].$a(17);
	var j = p.create();
	test.equals(i.$name()[0].$a(),17);
	test.equals(j.$name()[0].$a(),42);
	test.done()
  },

  'simple inheritance': function(test) {
    test.expect(3);
	var proot = prototype()
		.properties( { a: 42 } )
		.done();
	var p = prototype(proot)
		.properties( { b: 17 } )
		.done();
	var i = p.create();
	test.ok(i != null && p != null);
	test.equals(i.$a(),42);
	test.equals(i.$b(),17);
	test.done()
  },
  'instance property': function(test) {
    test.expect(3);
	var p = prototype()
		.properties( { b: 17 } )
		.done();
	var i = p.create();
	test.ok(i != null && p != null);
	test.equals(i.$b(),17);
	i.$$("a",42);
	test.equals(i.$a(),42);
	test.done()
  },

};

