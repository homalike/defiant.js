
if (!JSON.toXML) {

	// TODO:
	// handle keys that starts with an integer

	JSON.toXML = function(tree) {
		'use strict';

		var interpreter = {
				repl: function(dep) {
					for (var key in this) {
						delete this[key];
					}
					Defiant.extend(this, dep);
				},
				to_xml: function(tree) {
					var str = this.hash_to_xml(null, tree);
					//console.log(str);
					return Defiant.xmlFromString(str);
				},
				hash_to_xml: function(name, tree, array_child) {
					var is_array = tree.constructor === Array,
						elem = [],
						attr = [],
						key,
						val,
						val_is_array,
						type,
						is_attr,
						cname,
						constr;

					for (key in tree) {
						val     = tree[key];
						if (val == null || val.toString() === 'NaN') val = null;

						is_attr = key.slice(0,1) === '@';
						cname   = array_child ? name : key;
						cname   = (cname == +cname) ? 'item' : cname;
						constr  = val == null ? null : val.constructor;

						if (is_attr) {
							attr.push( cname.slice(1) +'="'+ this.escape_xml(val) +'"' );
							if (constr.name !== 'String') attr.push( 'd:'+ cname.slice(1) +'="'+ constr.name +'"' );
						} else if (val == null) {
							elem.push( this.scalar_to_xml( cname, val ) );
						} else {
							switch (constr) {
								case Object:
									elem.push( this.hash_to_xml( cname, val ) );
									break;
								case Array:
									if (key === cname) {
										val_is_array = val.constructor === Array;
										if (val_is_array) {
											for (var i=0, il=val.length; i<il; i++) {
												if (val[i].constructor === Array) val_is_array = true;
												if (!val_is_array && val[i].constructor === Object) val_is_array = true;
											}
										}
										elem.push( this.scalar_to_xml( cname, val, val_is_array ) );
										break;
									}
								case String:
									if (typeof(val) === 'string') val = val.toString().replace(/\&/g, '&amp;');
								case Number:
								case Boolean:
									if (cname === '#text' && constr.name !== 'String') attr.push('d:constr="'+ constr.name +'"');
									elem.push( this.scalar_to_xml( cname, val ) );
									break;
								default:
									//console.log( val.constructor, key, val );
									throw 'ERROR! '+ key;
							}
						}
					}
					
					if (!name) {
						name = 'data';
						attr.push(Defiant.namespace);
						if (is_array) attr.push('d:constr="Array"');
					}

					if (array_child) return elem.join('');

					return '<'+ name + (attr.length ? ' '+ attr.join(' ') : '') + (elem.length ? '>'+ elem.join('') +'</'+ name +'>' : '/>' );
				},
				scalar_to_xml: function(name, val, override) {
					var text,
						attr,
						constr;

					if (val == null || val.toString() === 'NaN') val = null;
					if (val == null) return '<'+ name +' d:constr="null"/>';
					if (override) return this.hash_to_xml( name, val, true );

					constr = val.constructor;
					text = (constr === Array)   ? this.hash_to_xml( 'item', val, true )
												: this.escape_xml(val);

					attr = ' d:constr="'+ (constr.name) +'"';
					if ( (constr.name) === 'String' ) attr = '';

					return (name === '#text') ? this.escape_xml(val) : '<'+ name + attr +'>'+ text +'</'+ name +'>';
				},
				escape_xml: function(text) {
					return String(text) .replace(/</g, '&lt;')
										.replace(/>/g, '&gt;')
										.replace(/"/g, '&quot;');
				}
			},
			doc = interpreter.to_xml.call(interpreter, tree);

		interpreter.repl.call(tree, doc.documentElement.toJSON());

		return doc;
	};
}
