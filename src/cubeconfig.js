/**
 ** @author Ligang Wang, http://github.com/ligangwang/
 **/

var CubeConfig = function(){
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
	
	this.facet_configs = [];
	this.facet_configs["R"] = {color:0xff0000, bottom_left:new THREE.Vector3(100, -100, 100)};
	this.facet_configs["U"] = {color:0xffffff, bottom_left:new THREE.Vector3(-100, 100, 100)};
	this.facet_configs["F"] = {color:0x00ff00, bottom_left:new THREE.Vector3(-100, -100, 100)};
	this.facet_configs["L"] = {color:0xffa500, bottom_left:new THREE.Vector3(-100, -100, 100)};
	this.facet_configs["D"] = {color:0xffff00, bottom_left:new THREE.Vector3(100, -100, 100)};
	this.facet_configs["B"] = {color:0x0000ff, bottom_left:new THREE.Vector3(100, -100, -100)};

	this.rotation_on_folded_configs = [];
	this.rotation_on_folded_configs["R"] = {axis:new THREE.Vector3(1, 0, 0), angle: Math.PI/2};
	this.rotation_on_folded_configs["U"] = {axis:new THREE.Vector3(0, 1, 0), angle: Math.PI/2};
	this.rotation_on_folded_configs["F"] = {axis:new THREE.Vector3(0,0,1), angle: Math.PI/2};
	this.rotation_on_folded_configs["L"] = {axis:new THREE.Vector3(-1, 0, 0), angle: Math.PI/2};
	this.rotation_on_folded_configs["D"] = {axis:new THREE.Vector3(0, -1, 0), angle: Math.PI/2};
	this.rotation_on_folded_configs["B"] = {axis:new THREE.Vector3(0, 0, -1), angle: Math.PI/2};
	this.operations = [];
	for(var key in this.rotation_on_folded_configs) { this.operations.push(key);}
	
	this.facet_folding_config = [];
	this.facet_folding_config["R"] = [{translation: new THREE.Vector3(300, 300, 0), axis: new THREE.Vector3(0,0,1), angle:Math.PI/2}];
	this.facet_folding_config["L"] = [{translation: new THREE.Vector3(-300, 300, 0), axis: new THREE.Vector3(0,0,1), angle:-Math.PI/2}]; 
	this.facet_folding_config["B"] = [{translation: new THREE.Vector3(0, 300,  -300), axis: new THREE.Vector3(1,0,0), angle:Math.PI/2}]; 
	this.facet_folding_config["F"] = [{translation: new THREE.Vector3(0, 300, 300), axis: new THREE.Vector3(1,0,0), angle:-Math.PI/2}]; 
	this.facet_folding_config["D"] = [{translation: new THREE.Vector3(0, 300, -300), axis: new THREE.Vector3(1,0,0), angle:Math.PI/2}, 
									  {translation: new THREE.Vector3(0, -300, -300), axis:new THREE.Vector3(1,0,0), angle:Math.PI/2}];

	this.rotation_on_unfolded_configs = []; 	 	
	this.rotation_on_unfolded_configs["R"] = [{facets: "R", origin:new THREE.Vector3(600, 0, 0), 	angle: Math.PI/2}, {facets: "FDBU", translation: new THREE.Vector3(0, 0, 600)}];
	this.rotation_on_unfolded_configs["L"] = [{facets: "L", origin:new THREE.Vector3(-600, 0, 0), 	angle:Math.PI/2},  {facets: "DFUB", translation: new THREE.Vector3(0, 0, -600)}]; 
	this.rotation_on_unfolded_configs["B"] = [{facets: "B", origin:new THREE.Vector3(0, 0,  -600), 	angle: Math.PI/2}]; 
	this.rotation_on_unfolded_configs["F"] = [{facets: "F", origin:new THREE.Vector3(0, 0, 600),		angle: Math.PI/2}];
	this.rotation_on_unfolded_configs["U"] = [{facets: "UFRBL", origin:new THREE.Vector3(0, 0, 0),   angle: Math.PI/2}];
	this.rotation_on_unfolded_configs["D"] = [	{facets: "D", origin:new THREE.Vector3(0, 0, -1200),angle: Math.PI/2},
											{facets: "FRBL", origin:new THREE.Vector3(0, 0, 0), angle: -Math.PI/2},
										];
	this.AxisY = new THREE.Vector3(0, 1, 0);
	this.Origin = new THREE.Vector3(0, 0, 0);
	
	this.cubie_configs = [
		{name: "FRU", position: new THREE.Vector3(200,200,200)},
		{name: "FUL", position: new THREE.Vector3(-200,200,200)}, //F: FRU->FUL
		{name: "RBU", position: new THREE.Vector3(200,200,-200)}, //U: FRU->RBU
		{name: "DRF", position: new THREE.Vector3(200,-200,200)}, //R: FRU->DRF	
		{name: "FLD", position: new THREE.Vector3(-200,-200,200)}, //F: FUL->FLD
		{name: "UBL", position: new THREE.Vector3(-200,200,-200)}, //L: FUL->UBL
		{name: "DBR", position: new THREE.Vector3(200,-200,-200)}, //B: RBU->DBR
		{name: "DLB", position: new THREE.Vector3(-200,-200,-200)},//D: FLD->LBD
	
		{name: "FU", position: new THREE.Vector3(0,200,200)},
		{name: "RU", position: new THREE.Vector3(200,200,0)},
		{name: "BU", position: new THREE.Vector3(0,200,-200)},
		{name: "LU", position: new THREE.Vector3(-200,200,0)},
	
		{name: "FR", position: new THREE.Vector3(200,0,200)},
		{name: "RB", position: new THREE.Vector3(200,0,-200)},
		{name: "BL", position: new THREE.Vector3(-200,0,-200)},
		{name: "LF", position: new THREE.Vector3(-200,0,200)},
		{name: "FD", position: new THREE.Vector3(0,-200,200)},
		{name: "RD", position: new THREE.Vector3(200,-200,0)},
		{name: "BD", position: new THREE.Vector3(0,-200,-200)},
		{name: "LD", position: new THREE.Vector3(-200,-200,0)},
	
		{name: "F", position: new THREE.Vector3(0,0,200)},
		{name: "D", position: new THREE.Vector3(0,-200,0)},
		{name: "B", position: new THREE.Vector3(0,0,-200)},
		{name: "R", position: new THREE.Vector3(200,0,0)},
		{name: "L", position: new THREE.Vector3(-200,0,0)},
		{name: "U", position: new THREE.Vector3(0,200,0)},
	];	
}