/**
 ** @author Ligang Wang, http://github.com/ligangwang/
 **/
var SquareFrame = 0;
var SquareFrameless = 1;
var Facet = function(name, color, cubie, bottom_left, axis, position){
	this.shape = SquareFrameless;
	this.name = name;
	this.color = color;
	this.cubie = cubie;
	this.bottom_left = bottom_left;
	this.axis = axis;
	this.position = position.clone();
	this.create_geometry();
	this.create_meshes();
	this.set_facet_to_meshes();
	this.clone_geometry_in_split = null;
	this.split_mesh1 = null;
	this.split_geometry1 = null;
	this.split_mesh2 = null;
	this.split_geometry2 = null;
}

Facet.prototype = {
	set_facet_to_meshes : function(){
		this.meshes.forEach(x=>x.facet = this);
	},

	create_geometry : function(){
		if (this.shape === SquareFrameless){
			this.create_facet_geometry();
		}
		else{
			this.create_composite_geometry();
		}
	},

	create_meshes : function (){
		if (this.shape === SquareFrameless){
			this.create_facet_meshes();
		}
		else{
			this.create_composite_meshes();
		}
	},

	set_geometry : function(geometry){
		var old_geometry = this.geometry;
		this.geometry = geometry;
		this.meshes.forEach(x=>{
			x.geometry = geometry;
		});
		old_geometry.dispose();
		this.geometry.verticesNeedUpdate = true;
	},

	create_facet_geometry : function(){
		var width = 200, radius = 40;
		var position = this.position;
		var shape = new THREE.Shape();
		var height = width;
		var x = -width/2; y = x;
	
		shape.moveTo( x, y + radius );
		shape.lineTo( x, y + height - radius );
		shape.quadraticCurveTo( x, y + height, x + radius, y + height );
		shape.lineTo( x + width - radius, y + height) ;
		shape.quadraticCurveTo( x + width, y + height, x + width, y + height - radius );
		shape.lineTo( x + width, y + radius );
		shape.quadraticCurveTo( x + width, y, x + width - radius, y );
		shape.lineTo( x + radius, y );
		shape.quadraticCurveTo( x, y, x, y + radius );

		this.geometry = new THREE.ShapeGeometry( shape );

		var m = new THREE.Matrix4();
		if (this.name == "L" || this.name == "R") {
			//mesh.rotation.set(0, Math.PI/2, 0);
			m.makeRotationAxis(new THREE.Vector3(0,1,0), Math.PI/2);
			this.apply_matrix(m);
		}
		else if (this.name == "U" || this.name == "D"){
			//mesh.rotation.set(Math.PI/2, 0, 0);
			m.makeRotationAxis(new THREE.Vector3(1,0,0), Math.PI/2);
			this.apply_matrix(m);
		}
		m.makeTranslation(position.x, position.y, position.z);
		this.apply_matrix(m);
	},

	create_facet_meshes : function(){
		this.meshes = [new THREE.Mesh( this.geometry, new THREE.MeshBasicMaterial({color: this.color, side: THREE.DoubleSide }))];
	},

	update_split_geometries : function(scene, split_geometry1, split_geometry2){
		if (this.split_mesh1 === null){
			this.split_geometry1 = split_geometry1;
			this.split_mesh1 = new THREE.Mesh( split_geometry1, new THREE.MeshBasicMaterial({color: this.color, side: THREE.DoubleSide }));
			scene.add(this.split_mesh1);
			this.split_geometry2 = split_geometry2;
			this.split_mesh2 = new THREE.Mesh( split_geometry2, new THREE.MeshBasicMaterial({color: this.color, side: THREE.DoubleSide }));
			scene.add(this.split_mesh2);
			this.remove_contents_from_scene(scene);
		}
		this.split_mesh1.geometry = split_geometry1;
		this.split_mesh2.geometry = split_geometry2;
	},

	remove_split_geometries : function(scene){
		if (this.split_mesh1 !== null){
			scene.remove(this.split_mesh1);
			scene.remove(this.split_mesh2);
			this.add_contents_to_scene(scene);
			this.split_mesh1 = null;
			this.split_mesh2 = null;
			this.split_geometry1.dispose();
			this.split_geometry2.dispose();
			this.split_geometry1 = null;
			this.split_geometry2 = null;
		}
	},
	

	create_composite_geometry : function(){
		var vertices = [];
		var point0 = this.bottom_left.clone();
		var point1 = point0.clone().applyAxisAngle(this.axis, Math.PI/2);
		var point2 = point1.clone().applyAxisAngle(this.axis, Math.PI/2);
		var point3 = point2.clone().applyAxisAngle(this.axis, Math.PI/2);
		vertices.push(point0);
		vertices.push(point1);
		vertices.push(point2);
		vertices.push(point3);
		
		this.geometry = new THREE.Geometry();
		this.geometry.vertices = vertices;
		this.geometry.faces.push(new THREE.Face3(0, 1, 2));
		this.geometry.faces.push(new THREE.Face3(2, 3, 0));
	},

	create_composite_meshes : function(){
		this.meshes = [this.create_square_mesh(1), this.create_edge_mesh()];
	},

	create_square_mesh : function(opacity){
		var material = new THREE.MeshBasicMaterial( { color: this.color, opacity: opacity, transparent: true, side: THREE.DoubleSide } );
		return new THREE.Mesh( this.geometry, material );
	},
	
	create_edge_mesh : function(){
		var material = new THREE.LineBasicMaterial( { color: 0x000000, opacity: 1, linewidth: 6, side: THREE.DoubleSide } );
		return new THREE.Line(this.geometry, material);
	},

	set_opacity : function(opacity){
		this.square_mesh.material.opacity = opacity;
	},
	
	set_position : function(){
		var m = new THREE.Matrix4();
		return function(position){
			m.makeTranslation(position.x, position.y, position.z);
			this.apply_matrix(m);
			this.position.add(position);
		}
	}(),
	
	apply_matrix: function(matrix){	
		this.geometry.applyMatrix(matrix);
		this.geometry.computeFaceNormals();
		this.geometry.computeVertexNormals();
	},
	
	clone: function(){
		var facet = new Facet(this.name, this.color, this.cubie, this.bottom_left, this.axis, this.position);
		facet.geometry = this.geometry.clone();
		facet.create_meshes();
		facet.set_facet_to_meshes()
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
				var facelet_name = cubie_state.facet_to_loc_map[facet_name];
				var facet = new Facet(facet_name, cube_config.facet_configs[facet_name].color, this, 
					cube_config.facelet_configs[facelet_name].bottom_left, cube_config.rotation_on_folded_configs[facelet_name].axis, cube_config.facelet_configs[facelet_name].position);
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
	
	this.set_cube_state(state);
	this.is_in_animation = false;
	this.commands = "";
	this.enable_animation = true;
	this.is_folded = true;
	this.set_is_in_solver_mode(false);
}
var debug_count = 0;
RubiksCube.prototype = {
	set_cube_state : function(state){
		var cube_state = new CubeState(state);
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
		//console.log(this.get_state());
		
		//console.log(this.cubies["DFR"].facets["F"].geometry.vertices.map(x=>x.z).reduce((a,b)=>a>b?a:b, -10000));
		var cubie = this.cubies["DFL"].facets["L"];
		// if (debug_count % 2 == 0)
		// 	cubie.remove_contents_from_scene(this.scene);
		// else
		// 	cubie.add_contents_to_scene(this.scene);
		debug_count += 1;
		//cubie.geometry.computeFaceNormals();
		//cubie.geometry.computeVertexNormals();
		//R, L
		//geometry = sliceGeometry(cubie.geometry, new THREE.Plane(new THREE.Vector3(0,0,-1), 800)); //OUT
		//geometry = sliceGeometry(cubie.geometry, new THREE.Plane(new THREE.Vector3(0,0,1), -800)); //IN

		//geometry = sliceGeometry(cubie.geometry, new THREE.Plane(new THREE.Vector3(0,0,1), 1400)); //OUT
		//geometry = sliceGeometry(cubie.geometry, new THREE.Plane(new THREE.Vector3(0,0,-1), -1400)); //IN

		//F
		//geometry = sliceGeometry(cubie.geometry, new THREE.Plane(new THREE.Vector3(-1,0,0), 800)); //OUT
		//geometry = sliceGeometry(cubie.geometry, new THREE.Plane(new THREE.Vector3(1,0,0), -800)); //IN

		//F
		//geometry = sliceGeometry(cubie.geometry, new THREE.Plane(new THREE.Vector3(1,0,0), 800)); //OUT
		//geometry = sliceGeometry(cubie.geometry, new THREE.Plane(new THREE.Vector3(-1,0,0), -800)); //IN
		
		/*
		geometry.vertices.forEach((v, i)=> 
			{
				if(v.z < 800)
					console.log("not equal vertice: ", v);
			}
		)*/
		/*
		geometry.vertices.forEach(v=>{
				v.y -= 200;
			});
		
		mesh = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial({color: 0xff0000, side: THREE.DoubleSide}));
		this.scene.add(mesh);
		*/
	},
	
	_get_facet_from_location_face : function(loc, loc_face_name){
		cubie_state = this.cube_state.loc_to_cubie_map[loc]
		return this.cubies[cubie_state.name].facets[cubie_state.loc_to_facet_map[loc_face_name]];
	},

	_get_transformers : function(op, init_angle = 0, total_angle = null){
		var op_face_name = op.slice(0, 1);
		var rotate_cubies = this._get_cubies(op_face_name);
		var  transformers = [];
		var total_ratio = Math.abs(total_angle)*2/Math.PI; var init_ratio = Math.abs(init_angle)*2/Math.PI;
		if (this.is_folded){
			var rotate_axis = this.cube_config.rotation_on_folded_configs[op].axis;
			var rotate_angle = (total_angle===null)? this.cube_config.rotation_on_folded_configs[op].angle : total_angle;
			rotate_angle -= init_angle;
			transformers.push(new Rotater(rotate_cubies, this.cube_config.origin, rotate_axis, rotate_angle));
		}else{//rotating on unfolded state
			for(var rotate_config of this.cube_config.rotation_on_unfolded_configs[op]){
				if (rotate_config.transform_type == "translater"){
					var facets = this._get_facets_from_cubies(rotate_cubies, rotate_config.facets);
					//console.log("translator: ",op, rotate_config.translation);
					var translation = (total_angle === null)? rotate_config.translation : rotate_config.translation.clone().multiplyScalar(total_ratio);
					translation.sub(rotate_config.translation.clone().multiplyScalar(init_ratio));
					transformers.push(new Translater(facets, translation));
					//console.log("translator post: ", translation)
				}else if (rotate_config.transform_type == "rotater"){
					var facets = this._get_facets_from_cubies(rotate_cubies, rotate_config.facets);
					var rotate_angle = (total_angle===null)? rotate_config.angle : rotate_config.angle * total_ratio;
					rotate_angle -= rotate_config.angle * init_ratio;
					transformers.push(new Rotater(facets, rotate_config.origin, this.cube_config.axis_y, rotate_angle));
				}else if (rotate_config.transform_type == "teleporter"){
					var distance = (total_angle ===null)? rotate_config.distance : rotate_config.distance * total_ratio;
					distance -= rotate_config.distance * init_ratio;
					transformers.push(new Teleporter(this.scene, this._get_facet_from_location_face(rotate_config.cubicle, rotate_config.facet),  
					distance,  rotate_config.out_bound, rotate_config.in_bound, rotate_config.axis, rotate_config.out_direction, rotate_config.in_direction, total_angle !== null));
				}
			}
		}
		return transformers;
	},

	rotate_angle : function(op, angle){
		this._get_transformers(op, 0, angle).forEach(x=>x.transform(1,1));
	},

	rotate : function(op, init_angle = 0){
		if (this.is_in_animation){
			console.log("the cube is rotating. quiting ".concat(op))
			return;
		}
		var transformers = this._get_transformers(op, init_angle, null);	
		var cube = this;	
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
	
	is_active : function(){
		return this.is_in_animation || this.is_in_solver_mode;
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
					facet.apply_matrix(m);
					facet.position.applyMatrix4(m);
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
			function(args){ 
				args.cube.is_folded  = !args.cube.is_folded;
				/*
				for (var facet_name in args.cube.cube_config.facet_folding_config){
					var facets = args.cube._get_facets(facet_name);
					facets.forEach(facet=>{
						facet.position.x = Math.round(facet.position.x);
						facet.position.y = Math.round(facet.position.y);
						facet.position.z = Math.round(facet.position.z);
					});
				}*/
			});
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
		get_random_ops().forEach(x=>this.rotate(x));
		this.enable_animation = saved; 	
	},
	

	get_cube_state : function(){
		return this.cube_state.clone();
	},

	get_state : function(){
		return this.cube_state.get_state();
	},
}
