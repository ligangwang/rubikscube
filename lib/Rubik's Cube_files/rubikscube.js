/**
 * @author Ligang Wang, http://github.com/ligangwang/
 */

var Facet = function(color, bottom_left, axis){
	this.color = color;
	this.axis = axis;
	this.vertices = [];
	point0 = bottom_left.clone();
	point1 = point0.clone().applyAxisAngle(this.axis, Math.PI/2);
	point2 = point1.clone().applyAxisAngle(this.axis, Math.PI/2);
	point3 = point2.clone().applyAxisAngle(this.axis, Math.PI/2);
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
	meshes = [];
	facets = [];
	for (face_name of cubeRotation.face_names){
		if(name.indexOf(face_name) > -1){
			facet = new Facet(cubeRotation.face_configs[face_name][0], cubeRotation.face_configs[face_name][1], cubeRotation.face_rotations[face_name][0]);
			meshes = meshes.concat(facet.meshes);
			facets.push(facet);
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
		for (facet of this.facets){
			facet.setPosition(position);
		}
	},
	
	unfold : function(){
		this.facets[0].transform(new THREE.Vector3(-300, -300, -300), new THREE.Vector3(0,0,1), Math.PI/2);
	},
	
	fold : function(){
		this.facets[0].transform(new THREE.Vector3(-300, -300, -300), new THREE.Vector3(0,0,1), -Math.PI/2);	
	},
}

var CubeRotation = function(){
	this.face_names = ["R", "U", "F", "L", "D", "B"];
	
	this.face_rotation_cycle = new Array();
	this.face_rotation_cycle["R"] = ["F", "D", "B", "U"]; //R: F->D->B->U
	this.face_rotation_cycle["U"] = ["F", "R", "B", "L"]; //U: F->R->B->L
	this.face_rotation_cycle["F"] = ["R", "U", "L", "D"]; //F: R->U->L->D
	this.face_rotation_cycle["L"] = this.face_rotation_cycle["R"].slice().reverse();
	this.face_rotation_cycle["D"] = this.face_rotation_cycle["U"].slice().reverse();
	this.face_rotation_cycle["B"] = this.face_rotation_cycle["F"].slice().reverse();
	for (op of this.face_names){
		this.face_rotation_cycle[op + "'"] = this.face_rotation_cycle[op].slice().reverse();
	}
	
	this.face_rotations = new Array();
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
	this.face_configs = new Array();
	this.face_configs["R"] = [0xff0000, new THREE.Vector3(100, -100, 100)];
	this.face_configs["U"] = [0xffffff, new THREE.Vector3(-100, 100, 100)];
	this.face_configs["F"] = [0x00ff00, new THREE.Vector3(-100, -100, 100)];
	this.face_configs["L"] = [0xffa500, new THREE.Vector3(-100, -100, 100)];
	this.face_configs["D"] = [0xffff00, new THREE.Vector3(100, -100, 100)];
	this.face_configs["B"] = [0x0000ff, new THREE.Vector3(100, -100, -100)];
}

CubeRotation.prototype = {
	transformOrientation : function(orientation, op){
		rotation_cycle = this.face_rotation_cycle[op];
		rotation_cycle_len = rotation_cycle.length;
		to_orientation = "";
		for (var i = 0, len=orientation.length; i < len; i++){
			from_face = orientation[i];
			pos = rotation_cycle.indexOf(from_face)
			if (pos > -1){
				to_face = rotation_cycle[(pos+1)%rotation_cycle_len];
				to_orientation += to_face;
			}else{
				to_orientation += from_face;
			}
		}
		return to_orientation;
	}
}

var RubiksCube = function(){
	this.position = new THREE.Vector3(0,0,0);
	this.cubies = [];
	this.cubeRotation = new CubeRotation(); 
	 
	this.cubies.push(new Cubie("FRU", new THREE.Vector3(200,200,200), this.cubeRotation));
	/*
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
	*/
	this.meshes = [];
	for (cubie of this.cubies){
		this.meshes = this.meshes.concat(cubie.meshes);
	}
	this.is_in_rotation = false;
	this.commands = "";
	this.enable_animation = true;
	this.is_unfolded = false;
}

RubiksCube.prototype = {
	render : function(){
		var scene = new THREE.Scene();
		var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 10000 );
		var renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setSize( window.innerWidth, window.innerHeight );
		renderer.setClearColor(0xf0f0f0);
		document.body.appendChild( renderer.domElement );
		for (mesh of this.meshes){
			scene.add( mesh );
		}
		camera.lookAt(scene.position);
		camera.position.z = 800;
		camera.position.y = 800;
		camera.position.x = 800;
		controls = new THREE.OrbitControls(camera, renderer.domElement);
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
		affected_face_name = op.slice(0, 1);
		affected_cubies = [];
		for (cubie of this.cubies){
			if (cubie.orientation.indexOf(affected_face_name) > -1){
				cubie.orientation = this.cubeRotation.transformOrientation(cubie.orientation, op);
				affected_cubies = affected_cubies.concat(cubie);
			}
		}
		axis = this.cubeRotation.face_rotations[op][0];
		angle = this.cubeRotation.face_rotations[op][1];
		if (this.enable_animation){
			this.rotate_cubies_with_animation(affected_cubies, axis, angle);		
		}else{
			this.rotate_cubies(affected_cubies, axis, angle);
		}
	},
	
	rotate_cubies_with_animation: function(cubies, axis, angle){
		cube = this;
		this.is_in_rotation = true;
		var tween = new TWEEN.Tween({value:0}).to({value:angle}, 800);
		last_data = 0;
		tween.onUpdate(function(){
			delta = this.value - last_data;
			last_data = this.value;
			cube.rotate_cubies(cubies, axis, delta);
		});
		tween.onComplete(function(){
			cube.is_in_rotation = false;
			cube.doOperation();
		});
		tween.start();
	},
	
	toggle_fold_unfold : function(){
		if(this.is_unfolded){
			this.fold();
		}else{
			this.unfold();
		}	
	},
	
	unfold:function(){
		if (this.is_unfolded) return;
		//unfolding
		this.cubies[0].unfold();
		this.is_unfolded = true;
	},
	
	fold: function(){
		if (!this.is_unfolded) return;
		//folding
		this.cubies[0].fold();
		this.is_unfolded = false;
	},
	
	rotate_cubies: function(cubies, axis, angle){
		matrix = new THREE.Matrix4().makeRotationAxis(axis, angle);
		for (cubie of cubies){
			for(facet of cubie.facets){
				facet.geometry.applyMatrix(matrix);
			}
		}
	},
	
	is_valid_char:function(prev_char, char){
		return (char in this.cubeRotation.face_rotations) || (prev_char != "'" && char == "'");
	},
	
	queue : function(command){
		this.commands = this.commands.concat(command);	
		if (!this.is_in_rotation){
			this.doOperation();
		}
	},
	
	doOperation : function(){
		op = this.getNextOp();
		if (op != ""){
			this.rotate(op);
		}	
	},
	
	getNextOp : function(){
		len = this.commands.length;
		look_at = 0;
		if (len > 1){
			if (this.commands[1] == "'"){
				look_at = 2;
			}else{
				look_at = 1;
			}
		}else if(len == 1){
			look_at = 1;
		}
		op = this.commands.slice(0, look_at);
		this.commands = this.commands.slice(look_at);
		console.log(this.commands)
		return op;
	},
	
	randomize : function(){
		saved = this.enable_animation;
		this.enable_animation = false;
		for (var i = 1; i < 20; i++){
			op_i = this.get_random(0, 11);
			op = this.cubeRotation.operations[op_i]
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
input_text = "";
input_timer = null;
resetInputTimer();
function onTimer(){
	if (input_text.length > 0){
		console.log(input_text);
		cube.queue(input_text);
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
		prev_char = input_text.substr(input_text.length - 1)
		if (cube.is_valid_char(prev_char, ch)){
			input_text += ch;
			resetInputTimer();
		}else if(ch == "S"){
			cube.randomize();
		}else if(ch == "O"){
			cube.toggle_fold_unfold();
		}
	}
}
	
function resetInputTimer(){
	window.clearTimeout(input_timer);
	input_timer = window.setTimeout(onTimer, 1000);
}
