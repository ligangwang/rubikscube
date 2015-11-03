/**
 ** @author Ligang Wang, http://github.com/ligangwang/
 **/

var CubeConfig = function(){
	this.face_names = ["R", "U", "F", "L", "D", "B"];
	this.AxisY = new THREE.Vector3(0, 1, 0);
	this.Origin = new THREE.Vector3(0, 0, 0);
	
	this.cubie_configs = [
		{name: "FRU", position: new THREE.Vector3(200,200,200)},
		{name: "FUL", position: new THREE.Vector3(-200,200,200)}, 
		{name: "RBU", position: new THREE.Vector3(200,200,-200)}, 
		{name: "DRF", position: new THREE.Vector3(200,-200,200)}, 	
		{name: "FLD", position: new THREE.Vector3(-200,-200,200)},
		{name: "UBL", position: new THREE.Vector3(-200,200,-200)},
		{name: "DBR", position: new THREE.Vector3(200,-200,-200)},
		{name: "DLB", position: new THREE.Vector3(-200,-200,-200)},
	
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
	
	this.face_rotation_cycle = [];
	this.face_rotation_cycle["R"] = ["F", "U", "B", "D"]; //R: F->U->B->D
	this.face_rotation_cycle["U"] = ["F", "L", "B", "R"]; //U: F->R->B->L
	this.face_rotation_cycle["F"] = ["U", "R", "D", "L"]; //F: R->U->L->D
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

	//regular rotation config (on folded state)
	this.rotation_on_folded_configs = [];
	this.rotation_on_folded_configs["R"] = {axis:new THREE.Vector3(1, 0, 0), angle: -Math.PI/2};
	this.rotation_on_folded_configs["U"] = {axis:new THREE.Vector3(0, 1, 0), angle: -Math.PI/2};
	this.rotation_on_folded_configs["F"] = {axis:new THREE.Vector3(0,0,1), 	angle: -Math.PI/2};
	this.rotation_on_folded_configs["L"] = {axis:new THREE.Vector3(-1, 0, 0), angle: -Math.PI/2};
	this.rotation_on_folded_configs["D"] = {axis:new THREE.Vector3(0, -1, 0), angle: -Math.PI/2};
	this.rotation_on_folded_configs["B"] = {axis:new THREE.Vector3(0, 0, -1), angle: -Math.PI/2};
	this.rotation_on_folded_configs["R'"] = {axis:new THREE.Vector3(1, 0, 0), angle: Math.PI/2};
	this.rotation_on_folded_configs["U'"] = {axis:new THREE.Vector3(0, 1, 0), angle: Math.PI/2};
	this.rotation_on_folded_configs["F'"] = {axis:new THREE.Vector3(0,	0,1), angle: Math.PI/2};
	this.rotation_on_folded_configs["L'"] = {axis:new THREE.Vector3(-1, 0, 0), angle: Math.PI/2};
	this.rotation_on_folded_configs["D'"] = {axis:new THREE.Vector3(0, -1, 0), angle: Math.PI/2};
	this.rotation_on_folded_configs["B'"] = {axis:new THREE.Vector3(0, 0, -1), angle: Math.PI/2};
	this.operations = [];
	for(var key in this.rotation_on_folded_configs) { this.operations.push(key);}
	
	//config used for folding action 
	this.facet_folding_config = [];
	this.facet_folding_config["R"] = [{translation: new THREE.Vector3(300, 300, 0), axis: new THREE.Vector3(0,0,1), angle:Math.PI/2}];
	this.facet_folding_config["L"] = [{translation: new THREE.Vector3(-300, 300, 0), axis: new THREE.Vector3(0,0,1), angle:-Math.PI/2}]; 
	this.facet_folding_config["B"] = [{translation: new THREE.Vector3(0, 300,  -300), axis: new THREE.Vector3(1,0,0), angle:Math.PI/2}]; 
	this.facet_folding_config["F"] = [{translation: new THREE.Vector3(0, 300, 300), axis: new THREE.Vector3(1,0,0), angle:-Math.PI/2}]; 
	this.facet_folding_config["D"] = [{translation: new THREE.Vector3(0, 300, -300), axis: new THREE.Vector3(1,0,0), angle:Math.PI/2}, 
									  {translation: new THREE.Vector3(0, -300, -300), axis:new THREE.Vector3(1,0,0), angle:Math.PI/2}];

	/*
	rotating on unfolded 2D surface
	 */
	this.rotation_on_unfolded_configs = []; 	 	
	this.rotation_on_unfolded_configs["U'"] = [{transform_type: "rotater", facets: "UFRBL", origin:new THREE.Vector3(0, 0, 0),  angle: Math.PI/2}];
	this.rotation_on_unfolded_configs["U"] = [{transform_type: "rotater", facets: "UFRBL", origin:new THREE.Vector3(0, 0, 0),  angle: -Math.PI/2}];
	this.rotation_on_unfolded_configs["D'"] = [	
											{transform_type: "rotater", facets: "D", origin:new THREE.Vector3(0, 0, -1200),angle: Math.PI/2},
											{transform_type: "rotater", facets: "FRBL", origin:new THREE.Vector3(0, 0, 0), angle: -Math.PI/2},
											];
	this.rotation_on_unfolded_configs["D"] = [	
											{transform_type: "rotater", facets: "D", origin:new THREE.Vector3(0, 0, -1200),angle: -Math.PI/2},
											{transform_type: "rotater", facets: "FRBL", origin:new THREE.Vector3(0, 0, 0), angle: Math.PI/2},
											];

	this.rotation_on_unfolded_configs["R'"] = [	{transform_type: "rotater", facets: "R", origin:new THREE.Vector3(600, 0, 0), 	angle: Math.PI/2}, 
												{transform_type: "translater", facets: "DBU", translation: new THREE.Vector3(0, 0, 600)},
												{transform_type: "teleporter", cubie: "DFR", facet: "F", origin: 900, out_bound:new THREE.Vector3(0, 0, 900), in_bound:new THREE.Vector3(0, 0, -1500), target:-900,  axis:AxisZ, out_direction:1, in_direction:1},
												{transform_type: "teleporter", cubie: "FR", facet: "F", origin: 700,  out_bound:new THREE.Vector3(0, 0, 900), in_bound:new THREE.Vector3(0, 0, -1500), target:-1100,  axis:AxisZ, out_direction:1, in_direction:1},
												{transform_type: "teleporter", cubie: "FRU", facet: "F", origin: 500,  out_bound:new THREE.Vector3(0, 0, 900), in_bound:new THREE.Vector3(0, 0, -1500), target:-1300,  axis:AxisZ, out_direction:1, in_direction:1},
											];
	this.rotation_on_unfolded_configs["R"] = [	{transform_type: "rotater", facets: "R", origin:new THREE.Vector3(600, 0, 0), 	angle: -Math.PI/2}, 
												{transform_type: "translater", facets: "FUB", translation: new THREE.Vector3(0, 0, -600)},
												{transform_type: "teleporter", cubie: "DFR", facet: "D", origin: -1500, out_bound:new THREE.Vector3(0, 0, -1500), in_bound:new THREE.Vector3(0, 0, 900), target:300,  axis:AxisZ, out_direction:-1, in_direction:-1},
												{transform_type: "teleporter", cubie: "DR", facet: "D", origin: -1300, out_bound:new THREE.Vector3(0, 0, -1500), in_bound:new THREE.Vector3(0, 0, 900), target:500,  axis:AxisZ, out_direction:-1, in_direction:-1},
												{transform_type: "teleporter", cubie: "BDR", facet: "D", origin: -1100, out_bound:new THREE.Vector3(0, 0, -1500), in_bound:new THREE.Vector3(0, 0, 900), target:700,  axis:AxisZ, out_direction:-1, in_direction:-1},
											];
												
	this.rotation_on_unfolded_configs["L'"] = [	{transform_type: "rotater", facets: "L", origin:new THREE.Vector3(-600, 0, 0), 	angle:Math.PI/2},  
												{transform_type: "translater", facets: "FUB", translation: new THREE.Vector3(0, 0, -600)},
												{transform_type: "teleporter", cubie: "DFL", facet: "D", origin: -1500, out_bound:new THREE.Vector3(0, 0, -1500), in_bound:new THREE.Vector3(0, 0, 900), target:300,  axis:AxisZ, out_direction:-1, in_direction:-1},
												{transform_type: "teleporter", cubie: "DL", facet: "D", origin: -1300, out_bound:new THREE.Vector3(0, 0, -1500), in_bound:new THREE.Vector3(0, 0, 900), target:500,  axis:AxisZ, out_direction:-1, in_direction:-1},
												{transform_type: "teleporter", cubie: "BDL", facet: "D", origin: -1100, out_bound:new THREE.Vector3(0, 0, -1500), in_bound:new THREE.Vector3(0, 0, 900), target:700,  axis:AxisZ, out_direction:-1, in_direction:-1},
												]; 
	this.rotation_on_unfolded_configs["L"] = [	{transform_type: "rotater", facets: "L", origin:new THREE.Vector3(-600, 0, 0), 	angle: -Math.PI/2},  
												{transform_type: "translater", facets: "DUB", translation: new THREE.Vector3(0, 0, 600)},
												{transform_type: "teleporter", cubie: "DFL", facet: "F", origin: 900, out_bound:new THREE.Vector3(0, 0, 900), in_bound:new THREE.Vector3(0, 0, -1500), target:-900,  axis:AxisZ, out_direction:1, in_direction:1},
												{transform_type: "teleporter", cubie: "FL", facet: "F", origin: 700,  out_bound:new THREE.Vector3(0, 0, 900), in_bound:new THREE.Vector3(0, 0, -1500), target:-1100,  axis:AxisZ, out_direction:1, in_direction:1},
												{transform_type: "teleporter", cubie: "FLU", facet: "F", origin: 500,  out_bound:new THREE.Vector3(0, 0, 900), in_bound:new THREE.Vector3(0, 0, -1500), target:-1300,  axis:AxisZ, out_direction:1, in_direction:1},
												]; 
	this.rotation_on_unfolded_configs["F'"] = [
												{transform_type: "rotater", facets: "F", origin:new THREE.Vector3(0, 0, 600),	angle: Math.PI/2},
												{transform_type: "translater", facets: "RU", translation: new THREE.Vector3(-600, 0, 0)},
												
												{transform_type: "teleporter", cubie: "DFL", facet: "L", origin: -900,  out_bound:new THREE.Vector3(-900, 0, 0), in_bound:new THREE.Vector3(-500, 0, -1600), target:100,  axis:AxisX, out_direction:-1, in_direction:1},
												{transform_type: "teleporter", cubie: "FL", facet: "L", origin: -700,  out_bound:new THREE.Vector3(-900, 0, 0), in_bound:new THREE.Vector3(-500, 0, -1600), target:-100,  axis:AxisX, out_direction:-1, in_direction:1},
												{transform_type: "teleporter", cubie: "FLU", facet: "L", origin: -500,  out_bound:new THREE.Vector3(-900, 0, 0), in_bound:new THREE.Vector3(-500, 0, -1600), target:-300,  axis:AxisX, out_direction:-1, in_direction:1},
												
												{transform_type: "teleporter", cubie: "DFR", facet: "D", origin: 300,  out_bound:new THREE.Vector3(300, 0, -1600), in_bound:new THREE.Vector3(1100, 0, 0), target:500,  axis:AxisX, out_direction:1, in_direction:-1},
												{transform_type: "teleporter", cubie: "DF", facet: "D", origin: 100,  out_bound:new THREE.Vector3(300, 0, -1600), in_bound:new THREE.Vector3(1100, 0, 0), target:700,  axis:AxisX, out_direction:1, in_direction:-1},
												{transform_type: "teleporter", cubie: "DFL", facet: "D", origin: -100,  out_bound:new THREE.Vector3(300, 0, -1600), in_bound:new THREE.Vector3(1100, 0, 0), target:900,  axis:AxisX, out_direction:1, in_direction:-1},
												];
	this.rotation_on_unfolded_configs["F"] = [
												{transform_type: "rotater", facets: "F", origin:new THREE.Vector3(0, 0, 600),angle: -Math.PI/2},
												{transform_type: "translater", facets: "LU", translation: new THREE.Vector3(600, 0, 0)},

												{transform_type: "teleporter", cubie: "DFR", facet: "R", origin: 900,  out_bound:new THREE.Vector3(900, 0, 0), in_bound:new THREE.Vector3(500, 0, -1600), target:-100,  axis:AxisX, out_direction:1, in_direction:-1},
												{transform_type: "teleporter", cubie: "FR", facet:  "R", origin: 700,  out_bound:new THREE.Vector3(900, 0, 0), in_bound:new THREE.Vector3(500, 0, -1600), target:100,  axis:AxisX, out_direction:1, in_direction:-1},
												{transform_type: "teleporter", cubie: "FRU", facet: "R", origin: 500,  out_bound:new THREE.Vector3(900, 0, 0), in_bound:new THREE.Vector3(500, 0, -1600), target:300,  axis:AxisX, out_direction:1, in_direction:-1},

												{transform_type: "teleporter", cubie: "DFL", facet: "D", origin: -300,  out_bound:new THREE.Vector3(-300, 0, -1600), in_bound:new THREE.Vector3(-1100, 0, 0), target:-500,  axis:AxisX, out_direction:-1, in_direction:1},
												{transform_type: "teleporter", cubie: "DF", facet: "D", origin: -100,  out_bound:new THREE.Vector3(-300, 0, -1600), in_bound:new THREE.Vector3(-1100, 0, 0), target:-700,  axis:AxisX, out_direction:-1, in_direction:1},
												{transform_type: "teleporter", cubie: "DFR", facet: "D", origin: 100,  out_bound:new THREE.Vector3(-300, 0, -1600), in_bound:new THREE.Vector3(-1100, 0, 0), target:-900,  axis:AxisX, out_direction:-1, in_direction:1},
												];
												
	this.rotation_on_unfolded_configs["B'"] = [
												{transform_type: "rotater", facets: "B", origin:new THREE.Vector3(0, 0,  -600), 	angle: Math.PI/2},
												{transform_type: "translater", facets: "LU", translation: new THREE.Vector3(600, 0, 0)},
												
												{transform_type: "teleporter", cubie: "BDR", facet: "R", origin: 900,  out_bound:new THREE.Vector3(900, 0, 0), in_bound:new THREE.Vector3(500, 0, -800), target:-100,  axis:AxisX, out_direction:1, in_direction:-1},
												{transform_type: "teleporter", cubie: "BR", facet:  "R", origin: 700,  out_bound:new THREE.Vector3(900, 0, 0), in_bound:new THREE.Vector3(500, 0, -800), target:100,  axis:AxisX, out_direction:1, in_direction:-1},
												{transform_type: "teleporter", cubie: "BRU", facet: "R", origin: 500,  out_bound:new THREE.Vector3(900, 0, 0), in_bound:new THREE.Vector3(500, 0, -800), target:300,  axis:AxisX, out_direction:1, in_direction:-1},
												
												{transform_type: "teleporter", cubie: "BDL", facet: "D", origin: -300,  out_bound:new THREE.Vector3(-300, 0, -800), in_bound:new THREE.Vector3(-1100, 0, 0), target:-500,  axis:AxisX, out_direction:-1, in_direction:1},
												{transform_type: "teleporter", cubie: "BD", facet: "D", origin: -100,  out_bound:new THREE.Vector3(-300, 0, -800), in_bound:new THREE.Vector3(-1100, 0, 0), target:-700,  axis:AxisX, out_direction:-1, in_direction:1},
												{transform_type: "teleporter", cubie: "BDR", facet: "D", origin: 100,  out_bound:new THREE.Vector3(-300, 0, -800), in_bound:new THREE.Vector3(-1100, 0, 0), target:-900,  axis:AxisX, out_direction:-1, in_direction:1},
												]; 
	this.rotation_on_unfolded_configs["B"] = [
												{transform_type: "rotater", facets: "B", origin:new THREE.Vector3(0, 0,  -600), 	angle: -Math.PI/2},
												{transform_type: "translater", facets: "RU", translation: new THREE.Vector3(-600, 0, 0)},
												
												{transform_type: "teleporter", cubie: "BDL", facet: "L", origin: -900,  out_bound:new THREE.Vector3(-900, 0, 0), in_bound:new THREE.Vector3(-500, 0, -800), target:100,  axis:AxisX, out_direction:-1, in_direction:1},
												{transform_type: "teleporter", cubie: "BL", facet: "L", origin: -700,  out_bound:new THREE.Vector3(-900, 0, 0), in_bound:new THREE.Vector3(-500, 0, -800), target:-100,  axis:AxisX, out_direction:-1, in_direction:1},
												{transform_type: "teleporter", cubie: "BLU", facet: "L", origin: -500,  out_bound:new THREE.Vector3(-900, 0, 0), in_bound:new THREE.Vector3(-500, 0, -800), target:-300,  axis:AxisX, out_direction:-1, in_direction:1},
												
												{transform_type: "teleporter", cubie: "BDR", facet: "D", origin: 300,  out_bound:new THREE.Vector3(300, 0, -800), in_bound:new THREE.Vector3(1100, 0, 0), target:500,  axis:AxisX, out_direction:1, in_direction:-1},
												{transform_type: "teleporter", cubie: "BD", facet: "D", origin:  100,  out_bound:new THREE.Vector3(300, 0, -800), in_bound:new THREE.Vector3(1100, 0, 0), target:700,  axis:AxisX, out_direction:1, in_direction:-1},
												{transform_type: "teleporter", cubie: "BDL", facet: "D", origin:-100,  out_bound:new THREE.Vector3(300, 0, -800), in_bound:new THREE.Vector3(1100, 0, 0), target:900,  axis:AxisX, out_direction:1, in_direction:-1},
												]; 
}