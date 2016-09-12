/**
 ** @author Ligang Wang, http://github.com/ligangwang/
 **/
 
function sort(s) {
	return s.split("").sort().join("");
}

var AxisX = {
	get: function (obj) {
		return obj.x;
	},
	
	set: function(obj, v){
		obj.x = v;
	},
	
	make_translation: function(m, v){
		m.makeTranslation(v, 0, 0);
	},
	
	adjust : function(obj, v){
		obj.x += v;	
	},

	get_vector2 : function(obj){
		return new THREE.Vector2(obj.y, obj.z);
	},

	plane : function(d){
		return new THREE.Plane(new THREE.Vector3(-1, 0, 0), d);
	},
	
	get_op : function(){
		return "R";
	}
};

var AxisY = {
	get: function (obj) {
		return obj.y;
	},
	
	set: function(obj, v){
		obj.y = v;
	},
	   
	make_translation: function(m, v){
		m.makeTranslation(0, v, 0);
	},
	  
	adjust : function(obj, v){
		obj.y += v;	
	},

	get_vector2 : function(obj){
		return new THREE.Vector2(obj.z, obj.x);
	},

	plane : function(d){
		return new THREE.Plane(new THREE.Vector3(0,-1, 0), d);
	},
	
	get_op : function(){
		return "U";
	}
};

var AxisZ = {
	get: function (obj) {
		return obj.z;
	},
	
	set: function(obj, v){
		obj.z = v;
	},
	
	make_translation: function(m, v){
		m.makeTranslation(0, 0, v);
	},
	  
	adjust : function(obj, v){
		obj.z += v;	
	},

	get_vector2 : function(obj){
		return new THREE.Vector2(obj.x, obj.y);
	},

	plane : function(d){
		return new THREE.Plane(new THREE.Vector3(0,0,-1), d);
	},
	
	get_op : function(){
		return "F";
	}
};

var Transform = function(){
	var translation = new THREE.Matrix4();
	var rotation = new THREE.Matrix4();
	var inverse_translation = new THREE.Matrix4();
	return function(translate, axis, angle){
		translation.makeTranslation(-translate.x, -translate.y, -translate.z);
		inverse_translation.makeTranslation(translate.x, translate.y, translate.z);
		rotation.makeRotationAxis(axis, angle);
		var m = translation.multiplyMatrices(rotation, translation);	
		m.multiplyMatrices(inverse_translation, m);
		return m;
	};
}()


function get_random(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function eq_set(as, bs){
	if (as.size!=bs.size) return false;
	for(var a of as) if (!bs.has(a)) return false;
	return true;
}

function getNumericStyleProperty(style, prop){
    return parseInt(style.getPropertyValue(prop),10) ;
}

function element_position(e) {
    var x = 0, y = 0;
    var inner = true ;
    do {
        x += e.offsetLeft;
        y += e.offsetTop;
        var style = getComputedStyle(e,null) ;
        var borderTop = getNumericStyleProperty(style,"border-top-width") ;
        var borderLeft = getNumericStyleProperty(style,"border-left-width") ;
        y += borderTop ;
        x += borderLeft ;
        if (inner){
          var paddingTop = getNumericStyleProperty(style,"padding-top") ;
          var paddingLeft = getNumericStyleProperty(style,"padding-left") ;
          y += paddingTop ;
          x += paddingLeft ;
        }
        inner = false ;
    } while (e = e.offsetParent);
    return { x: x, y: y };
}