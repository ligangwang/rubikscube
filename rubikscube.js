var CubieFace = function(color, bottom_left, axis){
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

CubieFace.prototype = {
	createSquareMesh : function(){
		var material = new THREE.MeshBasicMaterial( { color: this.color, side:THREE.DoubleSide } );
		var square_mesh = new THREE.Mesh( this.geometry, material );
		return square_mesh				
	},
	
	createEdgeMesh : function(){
		material = new THREE.LineBasicMaterial( { color: 0x000000, opacity: 1, linewidth: 4 } );
		return new THREE.Line(this.geometry, material);
	},
	
	setPosition : function(position){
		matrix = new THREE.Matrix4().makeTranslation(position.x, position.y, position.z);
		for (mesh of this.meshes){
			mesh.applyMatrix(matrix);
		}
	},
}


var Cubie = function(name, position, cubeRotation){
	meshes = [];
	cubieFaces = [];
	for (face_name of cubeRotation.face_names){
		if(name.indexOf(face_name) > -1){
			face = new CubieFace(cubeRotation.face_configs[face_name][0], cubeRotation.face_configs[face_name][1], cubeRotation.face_rotations[face_name][0]);
			meshes = meshes.concat(face.meshes);
			cubieFaces.push(face);
		}
	}
	this.cubieFaces = cubieFaces;
	this.cubeRotation = cubeRotation;
	this.meshes = meshes;
	this.name = name;
	this.orientation = name;
	this.setPosition(position);
}

Cubie.prototype = {
	setPosition : function(position){
		this.position = position;
		for (cubieFace of this.cubieFaces){
			cubieFace.setPosition(position);
		}
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
	for (cubie of this.cubies){
		this.meshes = this.meshes.concat(cubie.meshes);
	}
	this.is_in_rotation = false;
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
		camera.lookAt(new THREE.Vector3(0,0,0));
		camera.position.z = 800;
		camera.position.y = 800;
		camera.position.x = 800;
		controls = new THREE.OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;
		controls.dampingFactor = 0.25;
		controls.enableZoom = false;
		var i = 0;
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
		affected_objects = [];
		for (cubie of this.cubies){
			if (cubie.orientation.indexOf(affected_face_name) > -1){
				cubie.orientation = this.cubeRotation.transformOrientation(cubie.orientation, op);
				affected_objects = affected_objects.concat(cubie.meshes);
			}
		}
		axis = this.cubeRotation.face_rotations[op][0];
		angle = this.cubeRotation.face_rotations[op][1];
		this.rotate_objects(affected_objects, axis, angle);		
		
	},
	
	rotate_objects: function(objects, axis, angle){
		cube = this;
		this.is_in_rotation = true;
		var tween = new TWEEN.Tween({value:0}).to({value:angle}, 800);
		last_data = 0;
		tween.onUpdate(function(){
			delta = this.value - last_data;
			last_data = this.value;
			matrix = new THREE.Matrix4().makeRotationAxis(axis, delta);
			for (object of objects){
				object.applyMatrix(matrix);
			}
		});
		tween.onComplete(function(){
			cube.is_in_rotation = false;
		});
		tween.start();
	}
	
}