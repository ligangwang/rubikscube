var face_pairs = [["F", "B"], ["L", "R"], ["U", "D"]];
var SINGMASTER_SOLVED_STATE = "UF UR UB UL DF DR DB DL FR FL BR BL UFR URB UBL ULF DRF DFL DLB DBR";
var SINGMASTER_SOLVED_SLOTS = SINGMASTER_SOLVED_STATE.split(' ');
var FACE_NAMES = [].concat.apply([], face_pairs);
var ALL_SLOTS = SINGMASTER_SOLVED_SLOTS.concat(FACE_NAMES);
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

OPERATIONS = Object.keys(ROTATION_FACE_CYCLES);
ROTATION_FACE_MAP = [];
for(var op_key in ROTATION_FACE_CYCLES){
    ROTATION_FACE_MAP[op_key] = _convert_cycle_to_map(ROTATION_FACE_CYCLES[op_key], 1);
    ROTATION_FACE_MAP[op_key.repeat(2)] = _convert_cycle_to_map(ROTATION_FACE_CYCLES[op_key], 2);
    op_face = op_key.slice(0, 1);
    map[op_face] = op_face; //the same face not changed.
    ROTATION_FACE_MAP[op_key][op_face] = op_face; 
    ROTATION_FACE_MAP[op_key.repeat(2)][op_face] = op_face; 
}

//console.log(ROTATION_FACE_MAP);
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
ALL_SLOTS.forEach(x=>{
        var loc = sort(x);
		loc.split('').forEach(x=>CUBE_FACES[x].push(loc))
    });

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

function get_random_ops(){
    return Array.from(Array(20).keys()).map(x=>OPERATIONS[get_random(0, OPERATIONS.length - 1)]);
}

var CubieState = function(facet_orientation, loc_orientation){
    this.name = sort(facet_orientation);
    this.cubicle = sort(loc_orientation);
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
        this.cubicle = Object.keys(loc_to_facet_map).sort().join('');
        return this.cubicle; //returning new location
    },

	is_solved : function(){
		return Object.keys(this.loc_to_facet_map).every(x=>x == this.loc_to_facet_map[x]);
	},
    
    get_number_of_facet_solved : function(){
        return Object.keys(this.facet_to_loc_map).filter(x=>this.facet_to_loc_map[x] == x).length;
    },

    clone : function(){
        var facets = Object.keys(this.facet_to_loc_map);
        var locs = facets.map(x=>this.facet_to_loc_map[x]);
        return new CubieState(facets.join(''), locs.join(''));
    },
   
}

var CubeState = function(state){
    this.loc_to_cubie_map = [];
    this.cubie_to_loc_map = [];
    this.init_state = state;
    var cubies = state.split(' ').concat(FACE_NAMES);
    if (ALL_SLOTS.length != cubies.length) throw "Length not matched for cubicle and cubie";
    ALL_SLOTS.forEach((x, i)=>this.add_cubie_state(ALL_SLOTS[i], cubies[i]));
}

CubeState.prototype = {
    get_state : function(){
        return SINGMASTER_SOLVED_SLOTS
            .map(x=>x.split('').map(o=>this.loc_to_cubie_map[sort(x)].loc_to_facet_map[o]))
            .map(x=>x.join('')).join(' ');
    },


    add_cubie_state : function(loc_orientation, facet_orientation){
        var loc = sort(loc_orientation);
        var cubie_state = new CubieState(facet_orientation, loc_orientation);
        this.loc_to_cubie_map[loc] = cubie_state;
        this.cubie_to_loc_map[cubie_state.name] = loc;
    },

    rotate : function(op){
        var loc_to_cubie_map = [];
        var op_face_name = op.slice(0, 1);
        CUBE_FACES[op_face_name].forEach(from_loc=>
            {
                cubie_state = this.loc_to_cubie_map[from_loc];
                var to_loc = cubie_state.rotate(op);
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
        return new CubeState(this.get_state());
    }
}

function is_valid_cube_state(state){
    var slots = SINGMASTER_SOLVED_SLOTS.map(x=>sort(x));
    var cubies = state.split(' ').map(x=>sort(x));
    if (!eq_set(new Set(slots), new Set(cubies))) return false;
    var cycles = get_cycles(slots, cubies);
    var swaps = cycles.map(x=>x.length - 1).reduce((a,b)=>a+b, 0);
    if (swaps%2!=0) return false;
    if (sum_of_corner(state) % 3 !=0) return false;
    if (sum_of_edge(state) % 2 != 0) return false;
    return true;
}

function sum_of_edge(state){
    var edge_cubies = state.split(' ').filter(x=>x.length==2);
    var fb_edges = edge_cubies.filter(x=>x.indexOf("U") < 0 && x.indexOf("D") < 0)
    var ud_edges = edge_cubies.filter(x=>x.indexOf("U") >= 0 || x.indexOf("D") >= 0)
    var edge_values = [];
    ["U", "D"].forEach(f=>edge_values = edge_values.concat(ud_edges.map(x=>x.indexOf(f)).filter(x=>x>=0)));
    ["F", "B"].forEach(f=>edge_values = edge_values.concat(fb_edges.map(x=>x.indexOf(f)).filter(x=>x>=0)));
    return edge_values.reduce((a,b)=>a+b, 0);
}

function sum_of_corner(state){
    var corner_cubies = state.split(' ').filter(x=>x.length==3);
    var corner_values = [];
    corner_values = corner_values.concat(corner_cubies.map(x=>Math.max(x.indexOf("U"))).filter(x=>x>=0));
    corner_values = corner_values.concat(corner_cubies.map(x=>Math.max(x.indexOf("D"))).filter(x=>x>=0));
    return corner_values.reduce((a,b)=>a+b, 0);
}

function get_cycles(slots, cubies){
    var cubie_to_loc_map = [];
    cubies.map((x,i)=>[cubies[i], slots[i]]).filter(x=>x[0] != x[1]).forEach(x=>cubie_to_loc_map[x[0]] = x[1]);
    //from 0 to 1
    var counts = 0;    
    var cubie_names = Object.keys(cubie_to_loc_map);
    if (cubie_names.length == 0) return [];
    var cycle = [];
    var cycles = [];
    cubie_names.forEach(x=>{
        if (x in cubie_to_loc_map){
            var loc = cubie_to_loc_map[x];
            delete cubie_to_loc_map[x];
            if (cycle.length == 0) {
                cycles.push(cycle);
                cycle.push(x);
            }
            while (cycle[0]!=loc){
                counts++;
                if (counts>100) throw "error wrong somethere";
                cycle.push(loc);
                var loc1 = cubie_to_loc_map[loc];
                delete cubie_to_loc_map[loc];
                loc = loc1;
            }
            cycle = [];
        }
    });
    return cycles;    
}
