var face_pairs = [["F", "B"], ["L", "R"], ["U", "D"]];
var FACE_NAMES = [].concat.apply([], face_pairs);
var OPPOSITE_FACE_NAMES = [];
face_pairs.forEach(x=>{
    OPPOSITE_FACE_NAMES[x[0]] = x[1];
    OPPOSITE_FACE_NAMES[x[1]] = x[0];
});

var _convert_cycle_to_map = function(cycle, repeat_times){
    map = []
    for (var i = 0, len=cycle.length; i < len; i++){
        map[cycle[i]] = cycle[(i+repeat_times)%len];
    }
    return map;
}

ROTATION_FACE_CYCLES = [];
ROTATION_FACE_CYCLES["R"] = ["F", "U", "B", "D"]; //R: F->U->B->D
ROTATION_FACE_CYCLES["U"] = ["F", "L", "B", "R"]; //U: F->R->B->L
ROTATION_FACE_CYCLES["F"] = ["U", "R", "D", "L"]; //F: R->U->L->D
ROTATION_FACE_CYCLES["L"] = ROTATION_FACE_CYCLES["R"].slice().reverse();
ROTATION_FACE_CYCLES["D"] = ROTATION_FACE_CYCLES["U"].slice().reverse();
ROTATION_FACE_CYCLES["B"] = ROTATION_FACE_CYCLES["F"].slice().reverse();
for (var op of FACE_NAMES){
    ROTATION_FACE_CYCLES[op + "'"] = ROTATION_FACE_CYCLES[op].slice().reverse();
}

ROTATION_FACE_MAP = [];
for(var op_key in ROTATION_FACE_CYCLES){
    ROTATION_FACE_MAP[op_key] = _convert_cycle_to_map(ROTATION_FACE_CYCLES[op_key], 1);
    ROTATION_FACE_MAP[op_key.repeat(2)] = _convert_cycle_to_map(ROTATION_FACE_CYCLES[op_key], 2);
    op_face = op_key.slice(0, 1);
    map[op_face] = op_face; //the same face not changed.
    ROTATION_FACE_MAP[op_key][op_face] = op_face; 
    ROTATION_FACE_MAP[op_key.repeat(2)][op_face] = op_face; 
}

console.log(ROTATION_FACE_MAP);
var get_command_from_path = function(rotate_face, from_side, to_side){
    cycle = ROTATION_FACE_CYCLES[rotate_face];
    start_pos = cycle.indexOf(from_side);
    if (start_pos < 0)
        return null;
    steps = 0;
    matched = false;
    for(var i=( start_pos + 1 ) % cycle.length; i!=start_pos; i=(i+1) % cycle.length){
        steps ++;
        if (cycle[i] == to_side)
        {
            matched = true;
            break;
        }
    }
    if (!matched)
        return null;

    return steps > cycle.length/2 ? (rotate_face + "'").repeat(steps-cycle.length/2) : rotate_face.repeat(steps); 
}

CUBE_FACES = [];	//cube index storing locations(cubicles) per face 
FACE_NAMES.forEach(x=>CUBE_FACES[x] = []);

var reverse_op = function(op){
    if (op.length == 1)
        return op + "'";
    else if (op.length == 2){
        ops = op.split('');
        return op[1] == "'" ? op[0] : op;
    }
    else
        throw "not supported op: " + op;
}

var CubieState = function(facet_orientation, loc_orientation){
    this.name = sort(facet_orientation);
    this.loc_to_facet_map = [];
    this.facet_to_loc_map = [];
    facet_orientation.split('').forEach((x, i)=>{
            this.facet_to_loc_map[x] = loc_orientation[i];
            this.loc_to_facet_map[loc_orientation[i]] = x;
        }
    );
}

CubieState.prototype = {
    rotate : function(op){
        loc_to_facet_map = []
        Object.keys(this.loc_to_facet_map).forEach(from_loc=>
            {
                to_loc = ROTATION_FACE_MAP[op][from_loc];
                facet_name = this.loc_to_facet_map[from_loc];
                loc_to_facet_map[to_loc] = facet_name;
                this.facet_to_loc_map[facet_name] = to_loc;
            }
        );
        this.loc_to_facet_map = loc_to_facet_map;

        return Object.keys(loc_to_facet_map).sort().join(''); //returning new location
    },

	is_solved : function(){
		return Object.keys(this.loc_to_facet_map).every(x=>x == this.loc_to_facet_map[x]);
	},
    
    get_number_of_facet_solved : function(){
        return Object.keys(this.facet_to_loc_map).filter(x=>this.facet_to_loc_map[x] == x).length;
    },

    clone : function(){
        facets = Object.keys(this.facet_to_loc_map);
        locs = facets.map(x=>this.facet_to_loc_map[x]);
        return new CubieState(facets.join(''), locs.join(''));
    }
}

var CubeState = function(){
    this.loc_to_cubie_map = [];
    this.cubie_to_loc_map = [];

}

CubeState.prototype = {
    add_cubie_state : function(facet_orientation, loc_orientation){
        loc = sort(loc_orientation);
        cubie_state = new CubieState(facet_orientation, loc_orientation);
        this.loc_to_cubie_map[loc] = cubie_state;
        this.cubie_to_loc_map[cubie_state.name] = loc;

        loc.split('').forEach(x=>CUBE_FACES[x].push(loc))
    },

    rotate : function(op){
        loc_to_cubie_map = [];
        var op_face_name = op.slice(0, 1);
        CUBE_FACES[op_face_name].forEach(from_loc=>
            {
                cubie_state = this.loc_to_cubie_map[from_loc];
                to_loc = cubie_state.rotate(op);
                this.cubie_to_loc_map[cubie_state.name] = to_loc;
                loc_to_cubie_map[to_loc] = cubie_state;
            }
        );

        Object.keys(loc_to_cubie_map).forEach(loc=>this.loc_to_cubie_map[loc] = loc_to_cubie_map[loc]);
    },

    get_cubie_states : function(loc_face_name){
        return CUBE_FACES[loc_face_name].map(loc=>this.loc_to_cubie_map[loc]);
    },

    get_cubie_state : function(cubie_name){
        return this.loc_to_cubie_map[this.cubie_to_loc_map[cubie_name]];
    },

	is_solved : function(){
		return Object.keys(this.loc_to_cubie_map).map(loc=>this.loc_to_cubie_map[loc]).every(cubie_state=>cubie_state.is_solved());
	},

    get_num_of_facets_solved : function(locations){
        return locations.map(loc=>Object.keys(this.loc_to_cubie_map[loc].loc_to_facet_map)
                    .filter(x=>x==this.loc_to_cubie_map[loc].loc_to_facet_map[x]).length)
                    .reduce((a,b)=>a+b, 0);
    },

    clone : function(){
        cube_state = new CubeState();
        Object.keys(this.loc_to_cubie_map).forEach(loc=>cube_state.loc_to_cubie_map[loc] = this.loc_to_cubie_map[loc].clone());
        Object.keys(this.cubie_to_loc_map).forEach(name=>cube_state.cubie_to_loc_map[name] = this.cubie_to_loc_map[name]);
        return cube_state;
    }
}