/**
 ** @author Ligang Wang, http://github.com/ligangwang/
 **/
var Facet = function(cubie, color){
	this.cubie = cubie;
	this.color = color;
}

Facet.prototype = {
	construct : function(bottom_left, axis){
		var vertices = [];
		var point0 = bottom_left.clone();
		var point1 = point0.clone().applyAxisAngle(axis, Math.PI/2);
		var point2 = point1.clone().applyAxisAngle(axis, Math.PI/2);
		var point3 = point2.clone().applyAxisAngle(axis, Math.PI/2);
		vertices.push(point0);
		vertices.push(point1);
		vertices.push(point2);
		vertices.push(point3);
		
		this.geometry = new THREE.Geometry();
		this.geometry.vertices = vertices;
		this.geometry.faces.push(new THREE.Face3(0, 1, 2));
		this.geometry.faces.push(new THREE.Face3(2, 3, 0));
		this.meshes = [this.createSquareMesh(), this.createEdgeMesh()];
	},

	createSquareMesh : function(){
		var material = new THREE.MeshBasicMaterial( { color: this.color, side:THREE.DoubleSide, opacity: 0.9, transparent: true } );
		return new THREE.Mesh( this.geometry, material );
	},
	
	createEdgeMesh : function(){
		var material = new THREE.LineBasicMaterial( { color: 0x000000, opacity: 1, linewidth: 4 } );
		return new THREE.Line(this.geometry, material);
	},
	
	setPosition : function(){
		var m = new THREE.Matrix4();
		return function(position){
			m.makeTranslation(position.x, position.y, position.z);
			this.geometry.applyMatrix(m);
		}
	}(),
	
	applyMatrix: function(matrix){	
		this.geometry.applyMatrix(matrix);
	},
	
	clone: function(){
		var facet = new Facet(this.cubie, this.color);
		facet.geometry = this.geometry.clone();
		facet.meshes = [facet.createSquareMesh(), facet.createEdgeMesh()]
		return facet;
	},
	
	addToScene : function(scene){
		for (var mesh of this.meshes){
			scene.add(mesh);
		}
	},
	
	removeFromScene : function(scene){
		for (var mesh of this.meshes){
			scene.remove(mesh);
		}
	},
}

var Cubie = function(name, position, cube_config){
	var facets = [];
	for (var face_name of cube_config.face_names){
		if(name.indexOf(face_name) > -1){
			var facet = new Facet(this, cube_config.facet_configs[face_name].color);
			facet.construct(cube_config.facet_configs[face_name].bottom_left, cube_config.rotation_on_folded_configs[face_name].axis);
			facets[face_name] = facet;
		}
	}
	this.facets = facets;
	this.cube_config = cube_config;
	this.name = name;
	this.orientation = name;
	this.setPosition(position);
}

Cubie.prototype = {
	setPosition : function(position){
		this.position = position;
		for (var key in this.facets){
			var facet = this.facets[key];
			facet.setPosition(position);
		}
	},

	applyMatrix: function(matrix){	
		for (var key in this.facets){
			var facet = this.facets[key];
			facet.applyMatrix(matrix);
		}
	},
	
	rotateOrientation : function(op){
		var orientation = this._rotateOrientation(this.orientation, op);
		var from_facets = this.facets;
		this.facets = [];
		for (var i = 0, len = this.orientation.length; i < len; i++){
			var from_facet = this.orientation[i];
			var to_facet = orientation[i];
			this.facets[to_facet] = from_facets[from_facet];
		}
		this.orientation = orientation;
	},
	
	_rotateOrientation : function(orientation, op){
		var rotation_cycle = this.cube_config.face_rotation_cycle[op];
		var rotation_cycle_len = rotation_cycle.length;
		var to_orientation = "";
		for (var i = 0, len=orientation.length; i < len; i++){
			var from_face = orientation[i];
			var pos = rotation_cycle.indexOf(from_face)
			if (pos > -1){
				var to_face = rotation_cycle[(pos+1)%rotation_cycle_len];
				to_orientation += to_face;
			}else{
				to_orientation += from_face;
			}
		}
		return to_orientation;
	},
	
}

var RubiksCube = function(){
	this.position = new THREE.Vector3(0,0,0);
	this.cubies = [];
	this.cube_config = new CubeConfig(); 

	for(var cubie_config of this.cube_config.cubie_configs){
		this._addCubie(new Cubie(cubie_config.name, cubie_config.position, this.cube_config));
	}
	this.cubie_list = [];
	for (var key in this.cubies){
		this.cubie_list.push(this.cubies[key]);
	}
	this.is_in_animation = false;
	this.commands = "";
	this.enable_animation = true;
	this.time_per_animation_move = 800; //in millisecond
	this.is_folded = true;
}

RubiksCube.prototype = {
	_addCubie : function(cubie){
		orientation = sort(cubie.name);
		this.cubies[orientation] = cubie;	
	},
	
	addToScene : function(scene){
		this.scene = scene;
		for (var cubie_key in this.cubies){
			var cubie = this.cubies[cubie_key];
			for (var key in cubie.facets){
				var facet = cubie.facets[key];
				facet.addToScene(scene);
			}
		}
	},
	
	_updateOrientation : function(cubies, op){
		for(var cubie of cubies){
			cubie.rotateOrientation(op);
			this.cubies[sort(cubie.orientation)] = cubie;
		}
	},
	
	test : function(){
		//this.time_per_animation_move = 20000;
		/*
		rotate_configs = [
			{transform_type: "teleporter", cubie: "DFR", facet: "D", origin: 300,  out_bound:new THREE.Vector3(300, 0, -1600), in_bound:new THREE.Vector3(1100, 0, 0), target:500,  axis:AxisX, out_direction:1, in_direction:-1},
			{transform_type: "teleporter", cubie: "DF", facet: "D", origin: 100,  out_bound:new THREE.Vector3(300, 0, -1600), in_bound:new THREE.Vector3(1100, 0, 0), target:700,  axis:AxisX, out_direction:1, in_direction:-1},
		];
		var transformers = []; 
		for(rotate_config of rotate_configs){
			transformers.push(new Teleporter(this.scene, this.cubies[rotate_config.cubie].facets[rotate_config.facet], rotate_config.origin, 
					rotate_config.out_bound, rotate_config.in_bound, rotate_config.target,  rotate_config.axis, rotate_config.out_direction, rotate_config.in_direction));
		}
		this._withAnimation(
			function(args, total, delta){ 
				for (var transformer of transformers){
					transformer.transform(total, delta);
				}
				//console.log(total);
			}, 
			{cube: this},
			function(args){ 
			}
		);
		*/
	},
	
	rotate : function(op){
		if (this.is_in_animation){
			console.log("the cube is rotating. quiting ".concat(op))
			return;
		}
		cube = this;
		var op_face_name = op.slice(0, 1);
		var rotate_cubies = [];
		for (var cubie_key in this.cubies){
			var cubie = this.cubies[cubie_key];
			if (op_face_name in cubie.facets){
				rotate_cubies = rotate_cubies.concat(cubie);
			}
		}
		var  transformers = [];
		if (this.is_folded){
			var is_reverse_op = op.slice(1)=="'";
			var rotate_axis = this.cube_config.rotation_on_folded_configs[op_face_name].axis;
			var rotate_angle = this.cube_config.rotation_on_folded_configs[op_face_name].angle;
			transformers.push(new Rotater(rotate_cubies, this.cube_config.Origin, rotate_axis, is_reverse_op? -rotate_angle:rotate_angle));
		}else{//rotating on unfolded state
			for(var rotate_config of this.cube_config.rotation_on_unfolded_configs[op]){
				if (rotate_config.transform_type == "translater"){
					var facets = this._getFacets(rotate_cubies, rotate_config.facets);
					transformers.push(new Translater(facets, rotate_config.translation));
				}else if (rotate_config.transform_type == "rotater"){
					var facets = this._getFacets(rotate_cubies, rotate_config.facets);
					transformers.push(new Rotater(facets, rotate_config.origin, this.cube_config.AxisY, rotate_config.angle));
				}else if (rotate_config.transform_type == "teleporter"){
					transformers.push(new Teleporter(this.scene, this.cubies[rotate_config.cubie].facets[rotate_config.facet], rotate_config.origin, 
					rotate_config.out_bound, rotate_config.in_bound, rotate_config.target,  rotate_config.axis, rotate_config.out_direction, rotate_config.in_direction));
				}
			}
		}
		
		this._withAnimation(
			function(args, total, delta){ 
				for (var transformer of transformers){
					transformer.transform(total, delta);
				}
			}, 
			{cube:this},
			function(args){ 
				cube._updateOrientation(rotate_cubies, op);
			}
		);
	},
	
	
	_withAnimation: function(action, args, onComplete){
		if (this.enable_animation){
			this.is_in_animation = true;
			var tween = new TWEEN.Tween({value:0.0}).to({value: 1.0}, this.time_per_animation_move);
			var last_data = 0.0;
			tween.onUpdate(function(){
				var delta = this.value - last_data;
				last_data = this.value;
				action(args, this.value, delta);
			});
			tween.onComplete(function(){
				args.cube.is_in_animation = false;
				onComplete(args);
				args.cube._doNextCommand();
			});
			tween.start();
		}else{
			action(args, 1, 1);
			onComplete(args);
			args.cube._doNextCommand();
		}
	},
 
 	_getFacets : function(cubies, facet_names){
		var facets = []
		for(var cubie of cubies){
			for (var key in cubie.facets){
				if (facet_names.indexOf(key) > -1){ 
					var facet = cubie.facets[key];
					facets.push(facet);
				}
			}
		}
		return facets;
	},
	
	_fold: function(do_unfolding, delta){
		for (var orientation in this.cube_config.facet_folding_config){
			var facets = this._getFacets(this.cubie_list, orientation);
			var folding_configs = this.cube_config.facet_folding_config[orientation];
			var m = undefined;
			for (var folding_config of folding_configs){
				var translate = folding_config.translation;
				if (m != undefined){
					translate.applyMatrix4(m);
				}
				var rotate_axis = folding_config.axis;
				var rotate_angle = folding_config.angle * delta;
				m = Transform(translate, rotate_axis, do_unfolding? rotate_angle:-rotate_angle);
				for (var facet of facets){
					facet.geometry.applyMatrix(m);
				} 
			}
		}
	},
	
	fold : function(){
		this._withAnimation(
			function(args, total, delta){ 
				args.cube._fold(args.cube.is_folded, delta);
			}, 
			{cube:this},
			function(args){ args.cube.is_folded  = !args.cube.is_folded;}
		);
	},

	isValidInputChar:function(prev_char, char){
		if ("OST".indexOf(char) > -1){
			return true;
		}
		return (char in this.cube_config.rotation_on_folded_configs) || ("OST'".indexOf(prev_char) < 0 && char == "'");
	},

	command : function(command){
		this.commands = this.commands.concat(command);	
		if (!this.is_in_animation){
			this._doNextCommand();
		}
	},
	
	
	_doNextCommand : function(){
		var op = this._getNextOp();
		if (op != ""){
			if (op == "S"){
				this.randomize();
			}
			else if(op == "O"){
				this.fold();
			}
			else if(op == "T"){
				this.test();
			}
			else{this.rotate(op);}
		}	
	},
	
	_getNextOp : function(){
		var len = this.commands.length;
		var look_at = 0;
		if (len > 1){
			if (this.commands[1] == "'"){
				look_at = 2;
			}else{
				look_at = 1;
			}
		}else if(len == 1){
			look_at = 1;
		}
		var op = this.commands.slice(0, look_at);
		this.commands = this.commands.slice(look_at);
		//console.log(op, this.commands);
		return op;
	},
	
	randomize : function(){
		if (!this.is_folded) return;
		var saved = this.enable_animation;
		this.enable_animation = false;
		for (var i = 0; i < 20; i++){
			var op_i = this._getRandom(0, this.cube_config.operations.length - 1);
			var op = this.cube_config.operations[op_i];
			this.rotate(op);
		}
		this.enable_animation = saved; 	
	},
	
	_getRandom:function(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}	
}
