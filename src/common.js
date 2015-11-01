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
	
	makeTranslation: function(m, v){
		m.makeTranslation(v, 0, 0);
	},
	
	adjust : function(obj, v){
		obj.x += v;	
	}
};

var AxisY = {
	get: function (obj) {
		return obj.y;
	},
	
	set: function(obj, v){
		obj.y = v;
	},
	   
	makeTranslation: function(m, v){
		m.makeTranslation(0, v, 0);
	},
	  
	adjust : function(obj, v){
		obj.y += v;	
	}
};

var AxisZ = {
	get: function (obj) {
		return obj.z;
	},
	
	set: function(obj, v){
		obj.z = v;
	},
	
	makeTranslation: function(m, v){
		m.makeTranslation(0, 0, v);
	},
	  
	adjust : function(obj, v){
		obj.z += v;	
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