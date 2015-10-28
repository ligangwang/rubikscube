/**
 * @author Ligang Wang, http://github.com/ligangwang/
 */

var Facet = function(color, bottom_left, axis){
	this.color = color;
	this.axis = axis;
	this.vertices = [];
	var point0 = bottom_left.clone();
	var point1 = point0.clone().applyAxisAngle(this.axis, Math.PI/2);
	var point2 = point1.clone().applyAxisAngle(this.axis, Math.PI/2);
	var point3 = point2.clone().applyAxisAngle(this.axis, Math.PI/2);
	this.vertices.push(point0);
	this.vertices.push(point1);
	this.vertices.push(point2);
	this.vertices.push(point3);
	
	this.geometry = new THREE.Geometry();
	this.geometry.vertices = this.vertices;
	this.geometry.faces.push(new THREE.Face3(0, 1, 2));
	this.geometry.faces.push(new THREE.Face3(2, 3, 0));
	this.meshes = [this.createSquareMesh(), this.createEdgeMesh()];
}

Facet.prototype = {
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
	
	transform : function(){
		var translation = new THREE.Matrix4();
		var rotation = new THREE.Matrix4();
		var inverse_translation = new THREE.Matrix4();
		return function(translate, axis, angle){
			translation.makeTranslation(translate.x, translate.y, translate.z);
			inverse_translation.makeTranslation(-translate.x, -translate.y, -translate.z);
			rotation.makeRotationAxis(axis, angle);
			var m = translation.multiplyMatrices(rotation, translation);	
			m.multiplyMatrices(inverse_translation, m);
			this.geometry.applyMatrix(m);
		};
	}(),
}


var Cubie = function(name, position, cubeRotation){
	var meshes = [];
	var facets = [];
	for (var face_name of cubeRotation.face_names){
		if(name.indexOf(face_name) > -1){
			var facet = new Facet(cubeRotation.face_configs[face_name][0], cubeRotation.face_configs[face_name][1], cubeRotation.face_rotations[face_name][0]);
			meshes = meshes.concat(facet.meshes);
			facets[face_name] = facet;
		}
	}
	this.facets = facets;
	this.cubeRotation = cubeRotation;
	this.meshes = meshes;
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
			facet.geometry.applyMatrix(matrix);
		}
	},
	
	rotateOrientation : function(op){
		var orientation = this.cubeRotation.rotateOrientation(this.orientation, op);
		var from_facets = this.facets;
		this.facets = [];
		for (var i = 0, len = this.orientation.length; i < len; i++){
			var from_facet = this.orientation[i];
			var to_facet = orientation[i];
			this.facets[to_facet] = from_facets[from_facet];
		}
		this.orientation = orientation;
	},
		
}

var CubeRotation = function(){
	this.face_names = ["R", "U", "F", "L", "D", "B"];
	
	this.face_rotation_cycle = [];
	this.face_rotation_cycle["R"] = ["F", "D", "B", "U"]; //R: F->D->B->U
	this.face_rotation_cycle["U"] = ["F", "R", "B", "L"]; //U: F->R->B->L
	this.face_rotation_cycle["F"] = ["R", "U", "L", "D"]; //F: R->U->L->D
	this.face_rotation_cycle["L"] = this.face_rotation_cycle["R"].slice().reverse();
	this.face_rotation_cycle["D"] = this.face_rotation_cycle["U"].slice().reverse();
	this.face_rotation_cycle["B"] = this.face_rotation_cycle["F"].slice().reverse();
	for (op of this.face_names){
		this.face_rotation_cycle[op + "'"] = this.face_rotation_cycle[op].slice().reverse();
	}
	
	this.face_rotations = [];
	this.face_rotations["R"] = [new THREE.Vector3(1, 0, 0), Math.PI/2, new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), Math.PI/2)];
	this.face_rotations["U"] = [new THREE.Vector3(0, 1, 0), Math.PI/2, new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 1, 0), Math.PI/2)];
	this.face_rotations["F"] = [new THREE.Vector3(0,0,1), Math.PI/2, new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0,0,1), Math.PI/2)]
	this.face_rotations["L"] = [new THREE.Vector3(-1, 0, 0), Math.PI/2, new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(-1, 0, 0), Math.PI/2)];
	this.face_rotations["D"] = [new THREE.Vector3(0, -1, 0), Math.PI/2, new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, -1, 0), Math.PI/2)];
	this.face_rotations["B"] = [new THREE.Vector3(0, 0, -1), Math.PI/2, new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 0, -1), Math.PI/2)];

	this.face_rotations["R'"] = [new THREE.Vector3(1, 0, 0), -Math.PI/2, new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), -Math.PI/2)];
	this.face_rotations["U'"] = [new THREE.Vector3(0, 1, 0), -Math.PI/2, new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 1, 0), -Math.PI/2)];
	this.face_rotations["F'"] = [new THREE.Vector3(0, 0, 1), -Math.PI/2, new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0,0,1), -Math.PI/2)]
	this.face_rotations["L'"] = [new THREE.Vector3(-1, 0, 0), -Math.PI/2, new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(-1, 0, 0), -Math.PI/2)];
	this.face_rotations["D'"] = [new THREE.Vector3(0, -1, 0), -Math.PI/2, new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, -1, 0), -Math.PI/2)];
	this.face_rotations["B'"] = [new THREE.Vector3(0, 0, -1), -Math.PI/2, new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 0, -1), -Math.PI/2)];
	this.operations = [];
	for(var key in this.face_rotations) { this.operations.push(key);}
	this.face_configs = [];
	this.face_configs["R"] = [0xff0000, new THREE.Vector3(100, -100, 100)];
	this.face_configs["U"] = [0xffffff, new THREE.Vector3(-100, 100, 100)];
	this.face_configs["F"] = [0x00ff00, new THREE.Vector3(-100, -100, 100)];
	this.face_configs["L"] = [0xffa500, new THREE.Vector3(-100, -100, 100)];
	this.face_configs["D"] = [0xffff00, new THREE.Vector3(100, -100, 100)];
	this.face_configs["B"] = [0x0000ff, new THREE.Vector3(100, -100, -100)];
	
	this.facet_fold_config = [];
	this.facet_fold_config["R"] = [[new THREE.Vector3(-300, -300, 0), new THREE.Vector3(0,0,1), Math.PI/2]];
	this.facet_fold_config["L"] = [[new THREE.Vector3(300, -300, 0), new THREE.Vector3(0,0,1), -Math.PI/2]]; 
	this.facet_fold_config["B"] = [[new THREE.Vector3(0, -300,  300), new THREE.Vector3(1,0,0), Math.PI/2]]; 
	this.facet_fold_config["F"] = [[new THREE.Vector3(0, -300, -300), new THREE.Vector3(1,0,0),-Math.PI/2]]; 
	this.facet_fold_config["D"] = [[new THREE.Vector3(0, -300, 300), new THREE.Vector3(1,0,0), Math.PI/2]];//, [new THREE.Vector3(0, 300, 300), new THREE.Vector3(1,0,0), Math.PI/2]];
}

CubeRotation.prototype = {
	rotateOrientation : function(orientation, op){
		var rotation_cycle = this.face_rotation_cycle[op];
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
	
	transform : function(){
		var translation = new THREE.Matrix4();
		var rotation = new THREE.Matrix4();
		var inverse_translation = new THREE.Matrix4();
		return function(translate, axis, angle){
			translation.makeTranslation(translate.x, translate.y, translate.z);
			inverse_translation.makeTranslation(-translate.x, -translate.y, -translate.z);
			rotation.makeRotationAxis(axis, angle);
			var m = translation.multiplyMatrices(rotation, translation);	
			m.multiplyMatrices(inverse_translation, m);
			return m;
			//this.geometry.applyMatrix(m);
		};
	}(),
}

var RubiksCube = function(){
	this.position = new THREE.Vector3(0,0,0);
	this.cubies = [];
	this.cubeRotation = new CubeRotation(); 
	 
	this.cubies.push(new Cubie("FRU", new THREE.Vector3(200,200,200), this.cubeRotation));
	this.cubies.push(new Cubie("FUL", new THREE.Vector3(-200,200,200), this.cubeRotation)); 	//F: FRU->FUL
	this.cubies.push(new Cubie("RBU", new THREE.Vector3(200,200,-200), this.cubeRotation)); 	//U: FRU->RBU
	this.cubies.push(new Cubie("DRF", new THREE.Vector3(200,-200,200), this.cubeRotation)); 	//R: FRU->DRF	
	this.cubies.push(new Cubie("FLD", new THREE.Vector3(-200,-200,200), this.cubeRotation)); //F: FUL->FLD
	this.cubies.push(new Cubie("UBL", new THREE.Vector3(-200,200,-200), this.cubeRotation)); //L: FUL->UBL
	this.cubies.push(new Cubie("DBR", new THREE.Vector3(200,-200,-200), this.cubeRotation)); //B: RBU->DBR
	this.cubies.push(new Cubie("DLB", new THREE.Vector3(-200,-200,-200), this.cubeRotation));//D: FLD->LBD
	
	this.cubies.push(new Cubie("FU", new THREE.Vector3(0,200,200), this.cubeRotation));
	this.cubies.push(new Cubie("RU", new THREE.Vector3(200,200,0), this.cubeRotation));
	this.cubies.push(new Cubie("BU", new THREE.Vector3(0,200,-200), this.cubeRotation));
	this.cubies.push(new Cubie("LU", new THREE.Vector3(-200,200,0), this.cubeRotation));
	
	this.cubies.push(new Cubie("FR", new THREE.Vector3(200,0,200), this.cubeRotation));
	this.cubies.push(new Cubie("RB", new THREE.Vector3(200,0,-200), this.cubeRotation));
	this.cubies.push(new Cubie("BL", new THREE.Vector3(-200,0,-200), this.cubeRotation));
	this.cubies.push(new Cubie("LF", new THREE.Vector3(-200,0,200), this.cubeRotation));
	this.cubies.push(new Cubie("FD", new THREE.Vector3(0,-200,200), this.cubeRotation));
	this.cubies.push(new Cubie("RD", new THREE.Vector3(200,-200,0), this.cubeRotation));
	this.cubies.push(new Cubie("BD", new THREE.Vector3(0,-200,-200), this.cubeRotation));
	this.cubies.push(new Cubie("LD", new THREE.Vector3(-200,-200,0), this.cubeRotation));
	
	this.cubies.push(new Cubie("F", new THREE.Vector3(0,0,200), this.cubeRotation));
	this.cubies.push(new Cubie("D", new THREE.Vector3(0,-200,0), this.cubeRotation));
	this.cubies.push(new Cubie("B", new THREE.Vector3(0,0,-200), this.cubeRotation));
	this.cubies.push(new Cubie("U",  new THREE.Vector3(0,200,0), this.cubeRotation));
	this.cubies.push(new Cubie("R", new THREE.Vector3(200,0,0), this.cubeRotation));
	this.cubies.push(new Cubie("L", new THREE.Vector3(-200,0,0), this.cubeRotation));
	
	this.meshes = [];
	for (var cubie of this.cubies){
		this.meshes = this.meshes.concat(cubie.meshes);
	}
	this.is_in_rotation = false;
	this.commands = "";
	this.enable_animation = true;
	this.time_per_animation_move = 800; //in millisecond
	this.is_folded = true;
}

RubiksCube.prototype = {
	render : function(){
		var scene = new THREE.Scene();
		var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 10000 );
		var renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setSize( window.innerWidth, window.innerHeight );
		renderer.setClearColor(0xf0f0f0);
		document.body.appendChild( renderer.domElement );
		for (var mesh of this.meshes){
			scene.add( mesh );
		}
		camera.lookAt(scene.position);
		camera.position.z = 800;
		camera.position.y = 800;
		camera.position.x = 800;
		var controls = new THREE.OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;
		controls.dampingFactor = 0.25;
		controls.enableZoom = false;
		function animate() {
			requestAnimationFrame( animate );
			controls.update();
			TWEEN.update();
			renderer.render( scene, camera );
		}
		animate();			
	},
	
	rotate : function(op){
		if (this.is_in_rotation){
			console.log("the cube is rotating. quiting ".concat(op))
			return;
		}
		if (!this.is_folded){
			console.log("the cube is unfolded. quiting ".concat(op))
			return;
		}
		var affected_face_name = op.slice(0, 1);
		var affected_cubies = [];
		for (cubie of this.cubies){
			if (cubie.orientation.indexOf(affected_face_name) > -1){
				affected_cubies = affected_cubies.concat(cubie);
			}
		}
		var axis = this.cubeRotation.face_rotations[op][0];
		var angle = this.cubeRotation.face_rotations[op][1];
		
		this.with_animation(
			function(args, delta){ args.cube.rotate_cubies(args.cubies, args.axis, delta * args.angle);}, 
			{cube:this, cubies: affected_cubies, axis: axis, angle:angle},
			function(args){ 
				for(var cubie of affected_cubies){
					cubie.rotateOrientation(op);
				}
				args.cube.do_next_command();
			}
		);
	},

	with_animation: function(action, args, onComplete){
		if (this.enable_animation){
			this.is_in_rotation = true;
			var tween = new TWEEN.Tween({value:0.0}).to({value: 1.0}, this.time_per_animation_move);
			var last_data = 0.0;
			tween.onUpdate(function(){
				var delta = this.value - last_data;
				last_data = this.value;
				action(args, delta);
			});
			tween.onComplete(function(){
				args.cube.is_in_rotation = false;
				onComplete(args);
			});
			tween.start();
		}else{
			action(args, 1);
			onComplete(args);
		}
	},
	
	get_facets:function(orientation){
		var facets = [];
		for(var cubie of this.cubies){
			if(orientation in cubie.facets){
				facets.push(cubie.facets[orientation]);
			}
		}	
		return facets;
	},
	
	do_fold: function(do_unfolding, delta){
		for (var orientation in this.cubeRotation.facet_fold_config){
			var facets = this.get_facets(orientation);
			var transforms = this.cubeRotation.facet_fold_config[orientation];
			if ( !do_unfolding ){
				transforms = transforms.slice();
				transforms.reverse();
			}
			
			for (var transform of transforms){
				var translate = transform[0];
				var rotate_axis = transform[1];
				var rotate_angle = transform[2] * delta;
				var m = this.cubeRotation.transform(translate, rotate_axis, do_unfolding? rotate_angle:-rotate_angle);
				for (var facets of facets){
					facets.geometry.applyMatrix(m);
				} 
			}
		}
	},
	
	fold : function(){
		this.with_animation(
			function(args, delta){ 
				args.cube.do_fold(args.cube.is_folded, delta);
			}, 
			{cube:this},
			function(args){ args.cube.is_folded  = !args.cube.is_folded;}
		);
	},
	
	rotate_cubies: function(){
		var m = new THREE.Matrix4();		
		return function(cubies, axis, angle){
			m.makeRotationAxis(axis, angle);
			for (var cubie of cubies){
				cubie.applyMatrix(m);
			}
		}
	}(),
	
	is_valid_input_char:function(prev_char, char){
		if ("OS".indexOf(char) > -1){
			return true;
		}
		return (char in this.cubeRotation.face_rotations) || (prev_char != "'" && char == "'");
	},
	
	command : function(command){
		this.commands = this.commands.concat(command);	
		if (!this.is_in_rotation){
			this.do_next_command();
		}
	},
	
	do_next_command : function(){
		var op = this.get_next_op();
		if (op != ""){
			if (op == "S"){
				this.ramdomize();
			}
			else if(op == "O"){
				this.fold();
			}
			else{this.rotate(op);}
		}	
	},
	
	get_next_op : function(){
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
		console.log(this.commands)
		return op;
	},
	
	randomize : function(){
		var saved = this.enable_animation;
		this.enable_animation = false;
		for (var i = 0; i < 20; i++){
			var op_i = this.get_random(0, 11);
			var op = this.cubeRotation.operations[op_i]
			this.rotate(op);
		}
		this.enable_animation = saved; 	
	},
	
	/**
	* Returns a random number between min (inclusive) and max (inclusive)
	*/
	get_random:function(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}	
}

var cube = new RubiksCube();
cube.enable_animation = true;
cube.render();

document.addEventListener( 'keypress', onDocumentKeyPress, false );
document.addEventListener( 'keydown', onDocumentKeyDown, false );	
var input_text = "";
var input_timer = null;
resetInputTimer();
function onTimer(){
	if (input_text.length > 0){
		console.log(input_text);
		cube.command(input_text);
		input_text = "";
	}
}
			
function onDocumentKeyDown( event ) {
	var keyCode = event.keyCode;
	// backspace
	if ( keyCode == 8 ) {
		event.preventDefault();
		input_text = input_text.substring( 0, input_text.length - 1 );
		resetInputTimer();
		return false;
	}
}

function onDocumentKeyPress ( event ) {
	var keyCode = event.which;
	// backspace
	if ( keyCode == 8 ) {
		event.preventDefault();
	} else {
		var ch = String.fromCharCode( keyCode ).toUpperCase();
		var prev_char = input_text.substr(input_text.length - 1)
		if (cube.is_valid_input_char(prev_char, ch)){
			input_text += ch;
			resetInputTimer();
		}
	}
}
	
function resetInputTimer(){
	window.clearTimeout(input_timer);
	input_timer = window.setTimeout(onTimer, 1000);
}
