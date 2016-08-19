var face_pairs = [["F", "B"], ["L", "R"], ["U", "D"]];
var FACE_NAMES = [].concat.apply([], face_pairs);
var OPPOSITE_FACE_NAMES = [];
face_pairs.forEach(x=>{
    OPPOSITE_FACE_NAMES[x[0]] = x[1];
    OPPOSITE_FACE_NAMES[x[1]] = x[0];
});

var _convert_cycle_to_map = function(cycle){
    map = []
    for (var i = 0, len=cycle.length; i < len; i++){
        map[cycle[i]] = cycle[(i+1)%len];
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
    var map = _convert_cycle_to_map(ROTATION_FACE_CYCLES[op_key]);
    op_face = op_key.slice(0, 1);
    map[op_face] = op_face; //the same face not changed.
    ROTATION_FACE_MAP[op_key] = map;
    
}

var get_command_from_path = function(rotate_face, from_side, to_side){
    cycle = ROTATION_FACE_CYCLES[rotate_face];
    console.log(cycle);
    start_pos = cycle.indexOf(from_side);
    if (start_pos < 0)
        return null;
    console.log(start_pos);
    steps = 0;
    matched = false;
    for(var i=( start_pos + 1 ) % cycle.length; i!=start_pos; i=(i+1) % cycle.length){
        steps ++;
        console.log("steps: " + steps + " " + i);
        if (cycle[i] == to_side)
        {
            matched = true;
            break;
        }
    }
    if (!matched)
        return null;

    console.log(steps);
    return steps > cycle.length/2 ? (rotate_face + "'").repeat(steps-cycle.length/2) : rotate_face.repeat(steps); 
}
