
var CubeRotation = function(){
	this.face_names = ["R", "U", "F", "L", "D", "B"];
	
	this.face_rotation_cycle = [];
	this.face_rotation_cycle["R"] = ["F", "D", "B", "U"]; //R: F->D->B->U
	this.face_rotation_cycle["U"] = ["F", "R", "B", "L"]; //U: F->R->B->L
	this.face_rotation_cycle["F"] = ["R", "U", "L", "D"]; //F: R->U->L->D
	this.face_rotation_cycle["L"] = this.face_rotation_cycle["R"].slice().reverse();
	this.face_rotation_cycle["D"] = this.face_rotation_cycle["U"].slice().reverse();
	this.face_rotation_cycle["B"] = this.face_rotation_cycle["F"].slice().reverse();
	for (var op of this.face_names){
		this.face_rotation_cycle[op + "'"] = this.face_rotation_cycle[op].slice().reverse();
	}
	
	this.face_rotations = [];
	this.face_rotations["R"] = [new THREE.Vector3(1, 0, 0), Math.PI/2, new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), Math.PI/2)];
	this.face_rotations["U"] = [new THREE.Vector3(0, 1, 0), Math.PI/2, new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 1, 0), Math.PI/2)];
	this.face_rotations["F"] = [new THREE.Vector3(0,0,1), Math.PI/2, new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0,0,1), Math.PI/2)]
	this.face_rotations["L"] = [new THREE.Vector3(-1, 0, 0), Math.PI/2, new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(-1, 0, 0), Math.PI/2)];
	this.face_rotations["D"] = [new THREE.Vector3(0, -1, 0), Math.PI/2, new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, -1, 0), Math.PI/2)];
	this.face_rotations["B"] = [new THREE.Vector3(0, 0, -1), Math.PI/2, new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 0, -1), Math.PI/2)];

	this.operations = [];
	for(var key in this.face_rotations) { this.operations.push(key);}
	this.facet_configs = [];
	this.facet_configs["R"] = [0xff0000, new THREE.Vector3(100, -100, 100)];
	this.facet_configs["U"] = [0xffffff, new THREE.Vector3(-100, 100, 100)];
	this.facet_configs["F"] = [0x00ff00, new THREE.Vector3(-100, -100, 100)];
	this.facet_configs["L"] = [0xffa500, new THREE.Vector3(-100, -100, 100)];
	this.facet_configs["D"] = [0xffff00, new THREE.Vector3(100, -100, 100)];
	this.facet_configs["B"] = [0x0000ff, new THREE.Vector3(100, -100, -100)];
	
	this.facet_fold_config = [];
	this.facet_fold_config["R"] = [[new THREE.Vector3(300, 300, 0), new THREE.Vector3(0,0,1), Math.PI/2]];
	this.facet_fold_config["L"] = [[new THREE.Vector3(-300, 300, 0), new THREE.Vector3(0,0,1), -Math.PI/2]]; 
	this.facet_fold_config["B"] = [[new THREE.Vector3(0, 300,  -300), new THREE.Vector3(1,0,0), Math.PI/2]]; 
	this.facet_fold_config["F"] = [[new THREE.Vector3(0, 300, 300), new THREE.Vector3(1,0,0),-Math.PI/2]]; 
	this.facet_fold_config["D"] = [[new THREE.Vector3(0, 300, -300), new THREE.Vector3(1,0,0), Math.PI/2], [new THREE.Vector3(0, -300, -300), new THREE.Vector3(1,0,0), Math.PI/2]];

	this.facet_fold_translations = []; 	 	
	this.facet_fold_translations["R"] = [{facets: "R", origin:new THREE.Vector3(600, 0, 0), 	angle: Math.PI/2}, {facets: "FDBU", translation: new THREE.Vector3(0, 0, 600)}];
	this.facet_fold_translations["L"] = [{facets: "L", origin:new THREE.Vector3(-600, 0, 0), 	angle:Math.PI/2},  {facets: "DFUB", translation: new THREE.Vector3(0, 0, -600)}]; 
	this.facet_fold_translations["B"] = [{facets: "B", origin:new THREE.Vector3(0, 0,  -600), 	angle: Math.PI/2}]; 
	this.facet_fold_translations["F"] = [{facets: "F", origin:new THREE.Vector3(0, 0, 600),		angle: Math.PI/2}];
	this.facet_fold_translations["U"] = [{facets: "UFRBL", origin:new THREE.Vector3(0, 0, 0),   angle: Math.PI/2}];
	this.facet_fold_translations["D"] = [	{facets: "D", origin:new THREE.Vector3(0, 0, -1200),angle: Math.PI/2},
											{facets: "FRBL", origin:new THREE.Vector3(0, 0, 0), angle: -Math.PI/2},
										];
	this.AxisY = new THREE.Vector3(0, 1, 0);
	this.Origin = new THREE.Vector3(0, 0, 0);
}