/*! safenames 2014-09-09 */
"use strict";module.exports=function(){function a(a){return new f(a)}function b(){for(var a={},b=0;b<arguments.length;b++){var c=arguments[b];null!=c&&["configurable","enumerable","writable","value","get","set"].forEach(function(b){void 0!==c[b]&&(a[b]=c[b])})}return a}function c(){for(var a={},b=arguments,c=0;c<b.length;c++)["configurable","enumerable","writable","value","get","set"].forEach(function(d){var e=b[c];h.equal(typeof e,"object"),Object.keys(e).forEach(function(b){void 0!==e[b][d]&&(null==a[b]&&(a[b]={}),a[b][d]=e[b][d])})});return a}function d(a,c,d){return void 0===c&&null==d?b(a):null==d?b(a,{value:c}):void 0===c?b(a,d):b(a,d,{value:c})}function e(a){return new Function("return arguments.length==0 ? this."+a+" : (this."+a+"=arguments[0],this)")}function f(a,b){this.parent=b,this.scalarProperties={},this.objectProperties={},null==a?this.proto=new g:Object.prototype.isPrototypeOf.call(f.prototype,a)?(this.proto=Object.create(a.proto),this.scalarProperties=c(a.scalarProperties),this.objectProperties=c(a.objectProperties)):(this.proto=Object.create(a),this.proto.$$=g.prototype.$$)}function g(){}var h=require("assert"),i={configurable:!1,enumerable:!0,writable:!0},j={configurable:!1,enumerable:!1,writable:!1},k={configurable:!0,enumerable:!1,writable:!1};return f.prototype={property:function(a,b,c){if(h.ok(null!=a,"missing property name"),"function"==typeof b)return this.method(a,b,c);if("object"==typeof b){var g=Array.isArray(b)?b.map(function(a){return"object"==typeof a?new f(a.prototype).properties(a).done():a}):new f(b.prototype).properties(b).done();this.objectProperties[a]=d(i,g,c)}else this.scalarProperties[a]=d(i,b,c);return this.prototypeProperty("$"+a,e(a),j)},method:function(a,c,d){return h.ok(null!=a,"missing method name"),h.ok(arguments.length>1,'missing function argument for method "'+a+'"'),this.prototypeProperty(a,c,b(k,d))},constant:function(a,b,c){return h.ok(null!=a,"missing constant name"),h.ok(arguments.length>1,'missing value for constant "'+a+'"'),this.prototypeProperty("$"+a,e(a),j),this.prototypeProperty(a,b,c)},nested:function(a,c,d){h.ok(null!=a,"missing property name");var g=new f(c,this);return this.objectProperties[a]=b(i,d,{value:g}),this.prototypeProperty("$"+a,e(a),j),g},prototypeProperty:function(a,c,d){return Object.defineProperty(this.proto,a,void 0===c?d:b(d,{value:c})),this},properties:function(a){if(null==a)return this;h.equal(typeof a,"object");var b=this;return Object.getOwnPropertyNames(a).forEach(function(c){b.property(c,a[c])}),this},rawProperty:function(a,b,c){return h.ok(null!=a,"missing property name"),this.scalarProperties[a]=d(i,b,c),this.prototypeProperty("$"+a,e(a),j)},done:function(){return null==this.parent?this:this.parent},create:function(){return Object.create(this.proto,this.descriptors())},constructor:function(){var a,b=this.descriptors(),c=function(){Object.defineProperties(this,b)};if(arguments.length>0){var d=arguments[0];h.ok("function"==typeof d,"constructor argument must be a function"),a=function(){c.apply(this),d.apply(this,arguments)}}else a=function(){c.apply(this)};return a.prototype=this.proto,a},prototype:function(){return this.proto},descriptors:function(){if(0==Object.keys(this.objectProperties).length)return this.scalarProperties;var a=c(this.scalarProperties,this.objectProperties);return Object.keys(this.objectProperties).forEach(function(b){var c=a[b];c.value=Array.isArray(c.value)?c.value.map(function(a){return"object"==typeof a?a.create():a}):c.value.create()}),a},createsPrototypeOf:function(a){return this.proto.isPrototypeOf(a)}},g.prototype.$$=function(a,c,d){return Object.defineProperty(this,a,void 0===c?b(i,d):b(i,d,{value:c})),Object.defineProperty(this,"$"+a,b(j,{value:e(a)})),this},a}();