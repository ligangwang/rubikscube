/**
 ** @author Ligang Wang, http://github.com/ligangwang/
 **/
var Facet = function(name, cubie, color){
	this.name = name;
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
		this.square_mesh = this.create_square_mesh(1);
		this.edge_mesh = this.create_edge_mesh();
		this.meshes = [this.square_mesh, this.edge_mesh];
	},

	create_square_mesh : function(opacity){
		var material = new THREE.MeshBasicMaterial( { color: this.color, side:THREE.DoubleSide, opacity: opacity, transparent: true } );
		return new THREE.Mesh( this.geometry, material );
	},
	
	create_edge_mesh : function(){
		var material = new THREE.LineBasicMaterial( { color: 0x000000, opacity: 1, linewidth: 6 } );
		return new THREE.Line(this.geometry, material);
	},

	set_opacity : function(opacity){
		this.square_mesh.material.opacity = opacity;
	},
	
	set_position : function(){
		var m = new THREE.Matrix4();
		return function(position){
			m.makeTranslation(position.x, position.y, position.z);
			this.geometry.applyMatrix(m);
		}
	}(),
	
	apply_matrix: function(matrix){	
		this.geometry.applyMatrix(matrix);
	},
	
	clone: function(){
		var facet = new Facet(this.cubie, this.color);
		facet.geometry = this.geometry.clone();
		facet.meshes = [facet.create_square_mesh(this.square_mesh.material.opacity), facet.create_edge_mesh()]
		return facet;
	},
	
	add_contents_to_scene : function(scene){
		this.meshes.forEach(x=>scene.add(x));
	},
	
	remove_from_scene : function(scene){
		this.meshes.forEach(x=>scene.remove(x));
	},
}

var Cubie = function(name, position, cube_config){
	this.name = sort(name);
	this.cube_config = cube_config;

	var facets = [];
	name.split('').forEach(face_name=>
		{
			var facet = new Facet(face_name, this, cube_config.facet_configs[face_name].color);
			facet.construct(cube_config.facet_configs[face_name].bottom_left, cube_config.rotation_on_folded_configs[face_name].axis);
			facets[face_name] = facet;
		}
	);
	this.facets = facets;
	this.set_position(position);
}

Cubie.prototype = {
	set_position : function(position){
		this.position = position;
		Object.keys(this.facets).map(x=>this.facets[x]).forEach(facet=>facet.set_position(position));
	},
	
	set_opacity : function(opacity){
		Object.keys(this.facets).map(x=>this.facets[x]).forEach(facet=>facet.set_opacity(opacity));
	},

	apply_matrix: function(matrix){
		Object.keys(this.facets).map(x=>this.facets[x]).forEach(facet=>facet.apply_matrix(matrix));
	},
	
	add_contents_to_scene : function(scene){
		Object.keys(this.facets).forEach(x=>this.facets[x].add_contents_to_scene(scene));
	}
}

var RubiksCube = function(){
	this.cube_config = new CubeConfig(); 
	this.position = new THREE.Vector3(0,0,0);
	this.cube_state = new CubeState(this.cube_config.init_state);
	this.cubies = [];           //cubies index storing cubies per location(cubicle)
	this.cube_config.cubie_configs.forEach(
		x=>{	
				this._add_cubie(x.name, x.position); 
				var loc = sort(x.name);
				loc.split('').forEach(x=>CUBE_FACES[x].push(loc))
			});
	
	this.is_in_animation = false;
	this.commands = "";
	this.enable_animation = true;
	this.is_folded = true;
	this.set_is_in_solver_mode(false);
}

RubiksCube.prototype = {
	_add_cubie : function(name, position){
		var cubie = new Cubie(name, position, this.cube_config)
		this.cubies[cubie.name] = cubie;
		//this.cube_state.add_cubie_state(name, name)
	},
	
	add_contents_to_scene : function(scene){
		this.scene = scene;
		Object.keys(this.cubies).forEach(x=>this.cubies[x].add_contents_to_scene(scene));
	},
	
	set_opacity : function(opacity){
		Object.keys(this.cubies).map(x=>this.cubies[x]).forEach(x=>x.set_opacity(opacity));
	},
	
	set_is_in_solver_mode : function(enabled){
		if(enabled){
			this.time_per_animation_move = 200; //in ms
		}else
			this.time_per_animation_move = 600;
		this.is_in_solver_mode = enabled;
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
		this._with_animation(
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
		//console.log(this.cubies);
	},
	
	_get_facet_from_location_face : function(loc, loc_face_name){
		cubie_state = this.cube_state.loc_to_cubie_map[loc]
		return this.cubies[cubie_state.name].facets[cubie_state.loc_to_facet_map[loc_face_name]];
	},

	rotate : function(op){
		if (this.is_in_animation){
			console.log("the cube is rotating. quiting ".concat(op))
			return;
		}
		cube = this;
		var op_face_name = op.slice(0, 1);
		var rotate_cubies = this._get_cubies(op_face_name);
		var  transformers = [];
		if (this.is_folded){
			var rotate_axis = this.cube_config.rotation_on_folded_configs[op].axis;
			var rotate_angle = this.cube_config.rotation_on_folded_configs[op].angle;
			transformers.push(new Rotater(rotate_cubies, this.cube_config.origin, rotate_axis, rotate_angle));
		}else{//rotating on unfolded state
			for(var rotate_config of this.cube_config.rotation_on_unfolded_configs[op]){
				if (rotate_config.transform_type == "translater"){
					var facets = this._get_facets_from_cubies(rotate_cubies, rotate_config.facets);
					transformers.push(new Translater(facets, rotate_config.translation));
				}else if (rotate_config.transform_type == "rotater"){
					var facets = this._get_facets_from_cubies(rotate_cubies, rotate_config.facets);
					transformers.push(new Rotater(facets, rotate_config.origin, this.cube_config.axis_y, rotate_config.angle));
				}else if (rotate_config.transform_type == "teleporter"){
					transformers.push(new Teleporter(this.scene, this._get_facet_from_location_face(rotate_config.cubie, rotate_config.facet), rotate_config.origin, 
					rotate_config.out_bound, rotate_config.in_bound, rotate_config.target,  rotate_config.axis, rotate_config.out_direction, rotate_config.in_direction));
				}
			}
		}
		
		this._with_animation(
			function(args, total, delta){ 
				transformers.forEach(x=>x.transform(total, delta));
			}, 
			{cube:this},
			function(args){ 
				cube.cube_state.rotate(op);
			}
		);

		if (this.cube_state.is_solved() && this.is_in_solver_mode)
			this.set_is_in_solver_mode(false);
	},
	
	
	_with_animation: function(action, args, on_complete){
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
				on_complete(args);
				args.cube._do_next_command();
			});
			tween.start();
		}else{
			action(args, 1, 1);
			on_complete(args);
			args.cube._do_next_command();
		}
	},
 
	_get_cubies : function(loc_face_name){
		return this.cube_state.get_cubie_states(loc_face_name).map(cs=>this.cubies[cs.name]);
	},

	_get_facets : function(loc_face_name){
		return this.cube_state.get_cubie_states(loc_face_name).map(cs=>this.cubies[cs.name].facets[cs.loc_to_facet_map[loc_face_name]]);
	},

	_get_facets_by_loc_face: function(cubies, loc_face_name){
		return cubies.map(x=>this.cube_state.cubie_to_loc_map[x.name])
			.filter(loc=>loc.indexOf(loc_face_name) >= 0)
			.map(loc=>this.cube_state.loc_to_cubie_map[loc])
			.map(cs=>this.cubies[cs.name].facets[cs.loc_to_facet_map[loc_face_name]]);
	},

	_get_facets_from_cubies : function(cubies, loc_face_names){
		return [].concat.apply([], loc_face_names.split('').map(loc_face=>this._get_facets_by_loc_face(cubies, loc_face)));
	},
	
	_fold: function(do_unfolding, delta){
		for (var facet_name in this.cube_config.facet_folding_config){
			var facets = this._get_facets(facet_name);
			var folding_configs = this.cube_config.facet_folding_config[facet_name];
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
		this._with_animation(
			function(args, total, delta){ 
				args.cube._fold(args.cube.is_folded, delta);
			}, 
			{cube:this},
			function(args){ args.cube.is_folded  = !args.cube.is_folded;}
		);
	},

	is_valid_input_char:function(prev_char, char){
		if ("OST".indexOf(char) > -1){
			return true;
		}
		return (char in this.cube_config.rotation_on_folded_configs) || ("OST'".indexOf(prev_char) < 0 && char == "'");
	},

	command : function(command){
		this.commands = this.commands.concat(command);	
		if (!this.is_in_animation){
			this._do_next_command();
		}
	},
	
	
	_do_next_command : function(){
		var op = this._get_next_op();
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
	
	_get_next_op : function(){
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
		return op;
	},
	
	randomize : function(){
		var saved = this.enable_animation;
		this.enable_animation = false;
		for (var i = 0; i < 20; i++){
			var op_i = this._get_random(0, this.cube_config.operations.length - 1);
			var op = this.cube_config.operations[op_i];
			this.rotate(op);
		}
		this.enable_animation = saved; 	
	},
	
	_get_random:function(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	},

	get_cube_state : function(){
		return this.cube_state.clone();
	},

	get_cube_state_string : function(){
		return this.cube_state.get_state();
	},
}
