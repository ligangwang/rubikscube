/**
 ** @author Ligang Wang, http://github.com/ligangwang/
 **/
var Facet = function(name, color){
	this.name = name;
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
		var facet = new Facet(this.name, this.color);
		facet.geometry = this.geometry.clone();
		facet.meshes = [facet.create_square_mesh(this.square_mesh.material.opacity), facet.create_edge_mesh()]
		return facet;
	},
	
	add_contents_to_scene : function(scene){
		this.meshes.forEach(x=>scene.add(x));
	},
	
	remove_contents_from_scene : function(scene){
		this.meshes.forEach(x=>scene.remove(x));
	},
}

var Cubie = function(name){
	this.name = name;
}

Cubie.prototype = {
	set_cubie_state : function(cubie_state, cube_config){
		var facets = [];
		cubie_state.name.split('').forEach(facet_name=>
			{
				var facet = new Facet(facet_name, cube_config.facet_configs[facet_name].color);
				var facelet_name = cubie_state.facet_to_loc_map[facet_name];
				facet.construct(cube_config.facelet_configs[facelet_name].bottom_left, cube_config.rotation_on_folded_configs[facelet_name].axis);
				facets[facet_name] = facet;
			}
		);
		this.facets = facets;
		this.set_position(cube_config.cubicle_positions[cubie_state.cubicle]);
	},

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
	},

	remove_contents_from_scene : function(scene){
		Object.keys(this.facets).forEach(x=>this.facets[x].remove_contents_from_scene(scene));
	}
}

var RubiksCube = function(state, scene){
	this.scene = scene;
	this.cube_config = new CubeConfig(); 
	this.position = new THREE.Vector3(0,0,0);
	this.cubies = [];           
	
	this.set_cube_state(new CubeState(state));
	this.is_in_animation = false;
	this.commands = "";
	this.enable_animation = true;
	this.is_folded = true;
	this.set_is_in_solver_mode(false);
}

RubiksCube.prototype = {
	set_cube_state : function(cube_state){
		Object.keys(this.cube_config.cubicle_positions)
			.forEach(x=>this.set_cubie_state(cube_state.loc_to_cubie_map[x], this.cube_config));
		this.cube_state = cube_state;
		this.add_contents_to_scene(this.scene);
	},

	set_cubie_state : function(cubie_state){
		this.remove_cubie(cubie_state.name);
		this.cubies[cubie_state.name] = new Cubie(cubie_state.name);
		this.cubies[cubie_state.name].set_cubie_state(cubie_state, this.cube_config);
	},

	add_contents_to_scene : function(scene){
		this.scene = scene;
		Object.keys(this.cubies).forEach(x=>this.cubies[x].add_contents_to_scene(scene));
	},

	remove_cubie : function(cubie_name){
		if (cubie_name in this.cubies){
			this.cubies[cubie_name].remove_contents_from_scene(this.scene);
			delete this.cubies[cubie_name];
		}
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
		//this.remove_cubie("FRU");
		console.log(this.get_state());
		//this.set_cube_state(new CubeState("LF UR UB UL RF DR DB DL FU FD BR BL LFU URB UBL LDF RUF RFD DLB DBR"));
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
				if (cube.cube_state.is_solved() && cube.is_in_solver_mode){
					cube.set_is_in_solver_mode(false);
				}
			}
		);
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

	get_state : function(){
		return this.cube_state.get_state();
	},
}
