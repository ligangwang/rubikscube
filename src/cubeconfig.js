/**
 ** @author Ligang Wang, http://github.com/ligangwang/
 **/

var CubeConfig = function(){
	this.axis_y = new THREE.Vector3(0, 1, 0);
	this.origin = new THREE.Vector3(0, 0, 0);

	//the fixed place holding for cubies
	this.cubicle_positions = [];

	this.cubicle_positions[sort("UFR")] = new THREE.Vector3(200,200,200);
	this.cubicle_positions[sort("ULF")] = new THREE.Vector3(-200,200,200); 
	this.cubicle_positions[sort("URB")] = new THREE.Vector3(200,200,-200); 
	this.cubicle_positions[sort("DRF")] = new THREE.Vector3(200,-200,200); 	
	this.cubicle_positions[sort("DFL")] = new THREE.Vector3(-200,-200,200);
	this.cubicle_positions[sort("UBL")] = new THREE.Vector3(-200,200,-200);
	this.cubicle_positions[sort("DBR")] = new THREE.Vector3(200,-200,-200);
	this.cubicle_positions[sort("DLB")] = new THREE.Vector3(-200,-200,-200);

	this.cubicle_positions[sort("UF")] = new THREE.Vector3(0,200,200);
	this.cubicle_positions[sort("UR")] = new THREE.Vector3(200,200,0);
	this.cubicle_positions[sort("UB")] = new THREE.Vector3(0,200,-200);
	this.cubicle_positions[sort("UL")] = new THREE.Vector3(-200,200,0);

	this.cubicle_positions[sort("FR")] = new THREE.Vector3(200,0,200);
	this.cubicle_positions[sort("BR")] = new THREE.Vector3(200,0,-200);
	this.cubicle_positions[sort("BL")] = new THREE.Vector3(-200,0,-200);
	this.cubicle_positions[sort("FL")] = new THREE.Vector3(-200,0,200);
	this.cubicle_positions[sort("DF")] = new THREE.Vector3(0,-200,200);
	this.cubicle_positions[sort("DR")] = new THREE.Vector3(200,-200,0);
	this.cubicle_positions[sort("DB")] = new THREE.Vector3(0,-200,-200);
	this.cubicle_positions[sort("DL")] = new THREE.Vector3(-200,-200,0);

	this.cubicle_positions["F"] = new THREE.Vector3(0,0,200);
	this.cubicle_positions["D"] = new THREE.Vector3(0,-200,0);
	this.cubicle_positions["B"] = new THREE.Vector3(0,0,-200);
	this.cubicle_positions["R"] = new THREE.Vector3(200,0,0);
	this.cubicle_positions["L"] = new THREE.Vector3(-200,0,0);
	this.cubicle_positions["U"] = new THREE.Vector3(0,200,0);


	this.facet_configs = [];
	this.facet_configs["R"] = {color:0xaa0000};
	this.facet_configs["U"] = {color:0xdcdcdc};
	this.facet_configs["F"] = {color:0x00aa00};
	this.facet_configs["L"] = {color:0xff6600};
	this.facet_configs["D"] = {color:0xffee00};
	this.facet_configs["B"] = {color:0x0000aa};

	//facelet is the place to hold facet. (cubicle:facelet)=>(cubie:facet)
	this.facelet_configs = [];
	this.facelet_configs["R"] = {bottom_left:new THREE.Vector3(100, -100, 100), position:new THREE.Vector3(100, 0, 0)};
	this.facelet_configs["U"] = {bottom_left:new THREE.Vector3(-100, 100, 100), position:new THREE.Vector3(0, 100, 0)};
	this.facelet_configs["F"] = {bottom_left:new THREE.Vector3(-100, -100, 100), position:new THREE.Vector3(0, 0, 100)};
	this.facelet_configs["L"] = {bottom_left:new THREE.Vector3(-100, -100, 100), position:new THREE.Vector3(-100, 0, 0)};
	this.facelet_configs["D"] = {bottom_left:new THREE.Vector3(100, -100, 100), position:new THREE.Vector3(0, -100, 0)};
	this.facelet_configs["B"] = {bottom_left:new THREE.Vector3(100, -100, -100), position:new THREE.Vector3(0, 0, -100)};

	//regular rotation config (on folded state)
	this.rotation_on_folded_configs = [];
	this.rotation_on_folded_configs["R"] = 	{axis:new THREE.Vector3(1, 0, 0), angle: -Math.PI/2};
	this.rotation_on_folded_configs["U"] = 	{axis:new THREE.Vector3(0, 1, 0), angle: -Math.PI/2};
	this.rotation_on_folded_configs["F"] = 	{axis:new THREE.Vector3(0, 0, 1), angle: -Math.PI/2};
	this.rotation_on_folded_configs["L"] = 	{axis:new THREE.Vector3(-1, 0, 0), angle: -Math.PI/2};
	this.rotation_on_folded_configs["D"] = 	{axis:new THREE.Vector3(0, -1, 0), angle: -Math.PI/2};
	this.rotation_on_folded_configs["B"] = 	{axis:new THREE.Vector3(0, 0, -1), angle: -Math.PI/2};
	this.rotation_on_folded_configs["R'"] = {axis:new THREE.Vector3(1, 0, 0), angle: Math.PI/2};
	this.rotation_on_folded_configs["U'"] = {axis:new THREE.Vector3(0, 1, 0), angle: Math.PI/2};
	this.rotation_on_folded_configs["F'"] = {axis:new THREE.Vector3(0,	0,1), angle: Math.PI/2};
	this.rotation_on_folded_configs["L'"] = {axis:new THREE.Vector3(-1, 0, 0), angle: Math.PI/2};
	this.rotation_on_folded_configs["D'"] = {axis:new THREE.Vector3(0, -1, 0), angle: Math.PI/2};
	this.rotation_on_folded_configs["B'"] = {axis:new THREE.Vector3(0, 0, -1), angle: Math.PI/2};
	
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

												{transform_type: "teleporter", cubicle: "DFR", facet: "F", out_bound:new THREE.Vector3(0, 0, 900), in_bound:new THREE.Vector3(0, 0, -1500), distance:600,  axis:AxisZ, out_direction:1, in_direction:1},
												{transform_type: "teleporter", cubicle: "FR", facet: "F", out_bound:new THREE.Vector3(0, 0, 900), in_bound:new THREE.Vector3(0, 0, -1500), distance:600,  axis:AxisZ, out_direction:1, in_direction:1},
												{transform_type: "teleporter", cubicle: "FRU", facet: "F", out_bound:new THREE.Vector3(0, 0, 900), in_bound:new THREE.Vector3(0, 0, -1500), distance:600,  axis:AxisZ, out_direction:1, in_direction:1},
											];
	this.rotation_on_unfolded_configs["R"] = [	{transform_type: "rotater", facets: "R", origin:new THREE.Vector3(600, 0, 0), 	angle: -Math.PI/2}, 
												{transform_type: "translater", facets: "FUB", translation: new THREE.Vector3(0, 0, -600)},
												{transform_type: "teleporter", cubicle: "DFR", facet: "D", out_bound:new THREE.Vector3(0, 0, -1500), in_bound:new THREE.Vector3(0, 0, 900), distance:600,  axis:AxisZ, out_direction:-1, in_direction:-1},
												{transform_type: "teleporter", cubicle: "DR", facet: "D", out_bound:new THREE.Vector3(0, 0, -1500), in_bound:new THREE.Vector3(0, 0, 900), distance:600,  axis:AxisZ, out_direction:-1, in_direction:-1},
												{transform_type: "teleporter", cubicle: "BDR", facet: "D", out_bound:new THREE.Vector3(0, 0, -1500), in_bound:new THREE.Vector3(0, 0, 900), distance:600,  axis:AxisZ, out_direction:-1, in_direction:-1},
											];
												
	this.rotation_on_unfolded_configs["L'"] = [	{transform_type: "rotater", facets: "L", origin:new THREE.Vector3(-600, 0, 0), 	angle:Math.PI/2},  
												{transform_type: "translater", facets: "FUB", translation: new THREE.Vector3(0, 0, -600)},
												{transform_type: "teleporter", cubicle: "DFL", facet: "D", out_bound:new THREE.Vector3(0, 0, -1500), in_bound:new THREE.Vector3(0, 0, 900), distance:600,  axis:AxisZ, out_direction:-1, in_direction:-1},
												{transform_type: "teleporter", cubicle: "DL", facet: "D", out_bound:new THREE.Vector3(0, 0, -1500), in_bound:new THREE.Vector3(0, 0, 900), distance:600,  axis:AxisZ, out_direction:-1, in_direction:-1},
												{transform_type: "teleporter", cubicle: "BDL", facet: "D", out_bound:new THREE.Vector3(0, 0, -1500), in_bound:new THREE.Vector3(0, 0, 900), distance:600,  axis:AxisZ, out_direction:-1, in_direction:-1},
												]; 
	this.rotation_on_unfolded_configs["L"] = [	{transform_type: "rotater", facets: "L", origin:new THREE.Vector3(-600, 0, 0), 	angle: -Math.PI/2},  
												{transform_type: "translater", facets: "DUB", translation: new THREE.Vector3(0, 0, 600)},
												{transform_type: "teleporter", cubicle: "DFL", facet: "F", out_bound:new THREE.Vector3(0, 0, 900), in_bound:new THREE.Vector3(0, 0, -1500), distance:600,  axis:AxisZ, out_direction:1, in_direction:1},
												{transform_type: "teleporter", cubicle: "FL", facet: "F", out_bound:new THREE.Vector3(0, 0, 900), in_bound:new THREE.Vector3(0, 0, -1500), distance:600,  axis:AxisZ, out_direction:1, in_direction:1},
												{transform_type: "teleporter", cubicle: "FLU", facet: "F", out_bound:new THREE.Vector3(0, 0, 900), in_bound:new THREE.Vector3(0, 0, -1500), distance:600,  axis:AxisZ, out_direction:1, in_direction:1},
												]; 
	this.rotation_on_unfolded_configs["F'"] = [
												{transform_type: "rotater", facets: "F", origin:new THREE.Vector3(0, 0, 600),	angle: Math.PI/2},
												{transform_type: "translater", facets: "RU", translation: new THREE.Vector3(-600, 0, 0)},
												
												{transform_type: "teleporter", cubicle: "DFL", facet: "L", out_bound:new THREE.Vector3(-900, 0, 0), in_bound:new THREE.Vector3(-300, 0, -1600), distance:600,  axis:AxisX, out_direction:-1, in_direction:1},
												{transform_type: "teleporter", cubicle: "FL", facet: "L", out_bound:new THREE.Vector3(-900, 0, 0), in_bound:new THREE.Vector3(-300, 0, -1600), distance:600,  axis:AxisX, out_direction:-1, in_direction:1},
												{transform_type: "teleporter", cubicle: "FLU", facet: "L", out_bound:new THREE.Vector3(-900, 0, 0), in_bound:new THREE.Vector3(-300, 0, -1600), distance:600,  axis:AxisX, out_direction:-1, in_direction:1},
												
												{transform_type: "teleporter", cubicle: "DFR", facet: "D", out_bound:new THREE.Vector3(300, 0, -1600), in_bound:new THREE.Vector3(900, 0, 0), distance:600,  axis:AxisX, out_direction:1, in_direction:-1},
												{transform_type: "teleporter", cubicle: "DF", facet: "D", out_bound:new THREE.Vector3(300, 0, -1600), in_bound:new THREE.Vector3(900, 0, 0), distance:600,  axis:AxisX, out_direction:1, in_direction:-1},
												{transform_type: "teleporter", cubicle: "DFL", facet: "D", out_bound:new THREE.Vector3(300, 0, -1600), in_bound:new THREE.Vector3(900, 0, 0), distance:600,  axis:AxisX, out_direction:1, in_direction:-1},
												];
	this.rotation_on_unfolded_configs["F"] = [
												{transform_type: "rotater", facets: "F", origin:new THREE.Vector3(0, 0, 600),angle: -Math.PI/2},
												{transform_type: "translater", facets: "LU", translation: new THREE.Vector3(600, 0, 0)},

												{transform_type: "teleporter", cubicle: "DFR", facet: "R", out_bound:new THREE.Vector3(900, 0, 0), in_bound:new THREE.Vector3(300, 0, -1600), distance:600,  axis:AxisX, out_direction:1, in_direction:-1},
												{transform_type: "teleporter", cubicle: "FR", facet:  "R", out_bound:new THREE.Vector3(900, 0, 0), in_bound:new THREE.Vector3(300, 0, -1600), distance:600,  axis:AxisX, out_direction:1, in_direction:-1},
												{transform_type: "teleporter", cubicle: "FRU", facet: "R", out_bound:new THREE.Vector3(900, 0, 0), in_bound:new THREE.Vector3(300, 0, -1600), distance:600,  axis:AxisX, out_direction:1, in_direction:-1},

												{transform_type: "teleporter", cubicle: "DFL", facet: "D", out_bound:new THREE.Vector3(-300, 0, -1600), in_bound:new THREE.Vector3(-900, 0, 0), distance:600,  axis:AxisX, out_direction:-1, in_direction:1},
												{transform_type: "teleporter", cubicle: "DF", facet: "D", out_bound:new THREE.Vector3(-300, 0, -1600), in_bound:new THREE.Vector3(-900, 0, 0), distance:600,  axis:AxisX, out_direction:-1, in_direction:1},
												{transform_type: "teleporter", cubicle: "DFR", facet: "D", out_bound:new THREE.Vector3(-300, 0, -1600), in_bound:new THREE.Vector3(-900, 0, 0), distance:600,  axis:AxisX, out_direction:-1, in_direction:1},
												];
												
	this.rotation_on_unfolded_configs["B'"] = [
												{transform_type: "rotater", facets: "B", origin:new THREE.Vector3(0, 0,  -600), 	angle: Math.PI/2},
												{transform_type: "translater", facets: "LU", translation: new THREE.Vector3(600, 0, 0)},
												
												{transform_type: "teleporter", cubicle: "BDR", facet: "R", out_bound:new THREE.Vector3(900, 0, 0), in_bound:new THREE.Vector3(300, 0, -800), distance:600,  axis:AxisX, out_direction:1, in_direction:-1},
												{transform_type: "teleporter", cubicle: "BR", facet:  "R", out_bound:new THREE.Vector3(900, 0, 0), in_bound:new THREE.Vector3(300, 0, -800), distance:600,  axis:AxisX, out_direction:1, in_direction:-1},
												{transform_type: "teleporter", cubicle: "BRU", facet: "R", out_bound:new THREE.Vector3(900, 0, 0), in_bound:new THREE.Vector3(300, 0, -800), distance:600,  axis:AxisX, out_direction:1, in_direction:-1},
												
												{transform_type: "teleporter", cubicle: "BDL", facet: "D", out_bound:new THREE.Vector3(-300, 0, -800), in_bound:new THREE.Vector3(-900, 0, 0), distance:600,  axis:AxisX, out_direction:-1, in_direction:1},
												{transform_type: "teleporter", cubicle: "BD", facet: "D", out_bound:new THREE.Vector3(-300, 0, -800), in_bound:new THREE.Vector3(-900, 0, 0), distance:600,  axis:AxisX, out_direction:-1, in_direction:1},
												{transform_type: "teleporter", cubicle: "BDR", facet: "D", out_bound:new THREE.Vector3(-300, 0, -800), in_bound:new THREE.Vector3(-900, 0, 0), distance:600,  axis:AxisX, out_direction:-1, in_direction:1},
												]; 
	this.rotation_on_unfolded_configs["B"] = [
												{transform_type: "rotater", facets: "B", origin:new THREE.Vector3(0, 0,  -600), 	angle: -Math.PI/2},
												{transform_type: "translater", facets: "RU", translation: new THREE.Vector3(-600, 0, 0)},
												
												{transform_type: "teleporter", cubicle: "BDL", facet: "L", out_bound:new THREE.Vector3(-900, 0, 0), in_bound:new THREE.Vector3(-300, 0, -800), distance:600,  axis:AxisX, out_direction:-1, in_direction:1},
												{transform_type: "teleporter", cubicle: "BL", facet: "L", out_bound:new THREE.Vector3(-900, 0, 0), in_bound:new THREE.Vector3(-300, 0, -800), distance:600,  axis:AxisX, out_direction:-1, in_direction:1},
												{transform_type: "teleporter", cubicle: "BLU", facet: "L", out_bound:new THREE.Vector3(-900, 0, 0), in_bound:new THREE.Vector3(-300, 0, -800), distance:600,  axis:AxisX, out_direction:-1, in_direction:1},
												
												{transform_type: "teleporter", cubicle: "BDR", facet: "D", out_bound:new THREE.Vector3(300, 0, -800), in_bound:new THREE.Vector3(900, 0, 0), distance:600,  axis:AxisX, out_direction:1, in_direction:-1},
												{transform_type: "teleporter", cubicle: "BD", facet: "D", out_bound:new THREE.Vector3(300, 0, -800), in_bound:new THREE.Vector3(900, 0, 0), distance:600,  axis:AxisX, out_direction:1, in_direction:-1},
												{transform_type: "teleporter", cubicle: "BDL", facet: "D", out_bound:new THREE.Vector3(300, 0, -800), in_bound:new THREE.Vector3(900, 0, 0), distance:600,  axis:AxisX, out_direction:1, in_direction:-1},
												]; 

}