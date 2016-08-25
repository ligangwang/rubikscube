
        //1. determine the first layer to solve
        //1.1 count number of edge facets solved for each face
        //1.2 count number of corner facets solved for each face
        //1.3 get the first layer by having the maximum of the tuple

        //2. solve the first layer X, having the opposite face Z
        //2.1 collect the list of (4) edge cubies, for each one
        //    XY, solving Y facet first (solving loc(Y) -> Y)
        //    if loc(Y) is Y: done solve loc(X)->X
        //    otherwise if loc(X) is Y then do command of loc(Y) moved to X'Y', then do 2.1.a
        //                 else 2.1.a: search command from location Y'->Y
        //2.2 collect the list of (4) corner cubies,
        //    locate corner cubies at Z face
        //    if loc(X) is not on Z: 2.2.a search command on loc(X) face from X->Z: C then CZ(', depending on previous clockwise)C'
        //    otherwise: do search command on loc(Y) from X->Z: C then CZ(', depending on previous clockwise)ZZC'Z then 2.2.a again
        //    no corner cubies at Z face, but have corner cubies at X face and wrong orientation then on C(loc(X)), then CZC' then 2.2.a

        //3. solve 4 edge cubies for the second layer
        //3.1. locate the edge cubies positioned at Z layer, find the cubies that non of facet is Z for each one:
        //     locate the facet it's location is not Z: M, search command C to (loc(M)->M), then do transform: Z->facet(Z) 3.1.a:
        //3.1.a:M rotate Z->facet(Z):Y without changing the first layer X:
        //C: Z(M->Y); J:Y(X->Z); K:M(Z->Y) do C'JCJ'CKC'K'
        //repeat this until not edge on Z layer.
        //3.2. locate the edges wrong but on the the second layer. set M = loc(first facet), Y=loc(the second facet) do 3.1.a and 3.1
        //  until all edges are correct on the second layer

        //4. solve the 3rd layer
        //4.1 solve the 4 edge cubies: forming cross
        //4.1.a None of edge that has loc(Z) == Z: then pick the first neighboring face: M
        //  do 4.1.a.a  Y:Z'(M) and MZYZ'Y'M'
        //4.1.b one edge on Z, N:loc(the facet not on the Z) set M: Z'(N) then do 4.1.a.a
        //4.1.c two/three edges on Z, locate the faces M != Z where facet[M] == Z
        //      and opposite cubie where loc(Z) == Z, if none, get the first one as M, then 4.1.a.a
        //4.1.d adjust position of edge cubies, get Z face cycle,[....], [loc()...], get exchange face pairs for each M, N and N is Z'(M)
        //      do P:Z'(N): PZP'ZPZZP'Z
        //4.2 solve the 4 corner cubies
        //4.2.a solve the 4 corner cubies position
        //4.2.a.1 locate the correct one, then having M, N, P on N is Z'(M), P:Z(M), do ZNZ'P'ZPZ'N'
        //      until all corner positioned correctly
        //4.2.a.2 M,N: N'XNX' until M,N solved, using Z', to move M,N then repeating untill all fixed

var BottomupSolver = function(cube_state){
    this.cube_state = cube_state; //store facets per each location
    this.count_limited = 0;
}

BottomupSolver.prototype = {
    solve : function(){
        var all_ops = []
        var ops;
        if (! this.cube_state.is_solved()){
            var X = this._determine_the_first_layer_to_solve();
            console.log("determined the first layer to solve: %s", X);
            ops = this._solve_first_layer_edge_cubies(X);
            console.log("solved the first layer edge cubies: %s", ops.toString());
            all_ops = all_ops.concat(ops);
            var Z = OPPOSITE_FACE_NAMES[X];
            ops = this._solve_first_layer_corner_cubies(X, Z);
            console.log("solved the first layer corner cubies: " + ops);
            all_ops = all_ops.concat(ops);
        }
        return all_ops;
    },

    _solve_second_layer_edge_cubies : function(X, Z){

    },

    _solve_first_layer_corner_cubies : function(X, Z){
        var ops = [];
        var op, push_op, loc, side_locs;
        var z_corner_locs = CUBE_FACES[Z].filter(loc=>loc.length == 3);
        var corner_cubies_x_not_at_z = z_corner_locs.filter(loc=>X in self.cube_state.loc_to_cubie_map[loc].facet_to_loc_map &&
            self.cube_state.loc_to_cubie_map[loc].facet_to_loc_map[X] != Z);
        //console.log("corner_cubies_x_not_at_z: " + corner_cubies_x_not_at_z);
        if (corner_cubies_x_not_at_z.length >0){
            console.log("corner_cubies_x_not_at_z: " + corner_cubies_x_not_at_z);
            loc = corner_cubies_x_not_at_z[0];
            var facet_x_on = self.cube_state.loc_to_cubie_map[loc].facet_to_loc_map[X]
            var side_loc = loc.split('').filter(x=>x!=Z && x!=facet_x_on)[0]
            var side_facet = self.cube_state.loc_to_cubie_map[loc].loc_to_facet_map[side_loc];
            //console.log("side loc and facet: " + side_loc + " " + side_facet);
            if (side_loc != side_facet){
                op = get_command_from_path(Z, side_loc, side_facet);
                ops.push(op); self.cube_state.rotate(op);
                console.log(op);

            }
            //one is Z,facet_x_on in loc
            push_op = get_command_from_path(facet_x_on, X, side_loc);
            if (push_op == null || push_op == undefined) throw "error: " + facet_x_on + " " + X + " " + side_loc;
            ops.push(push_op); self.cube_state.rotate(push_op);
            console.log(push_op);
            op = get_command_from_path(Z, facet_x_on, side_loc);
            if (op == null || op == undefined) throw "error: " + Z + " " + facet_x_on + " " + side_loc;
            ops.push(op); self.cube_state.rotate(op);
            console.log(op);
            op = reverse_op(push_op); 
            if (op == null || op == undefined) throw "error:";
            ops.push(op); self.cube_state.rotate(op);
            console.log(op);

            ops = ops.concat(this._solve_first_layer_corner_cubies(X, Z));

        }
        var corner_cubies_x_at_z = z_corner_locs.filter(loc=>self.cube_state.loc_to_cubie_map[loc].facet_to_loc_map[X] == Z);
        //console.log("corner_cubies_x_at_z: (%s, %s): ", X, Z);
        
        //console.log(corner_cubies_x_at_z.map(loc=>self.cube_state.loc_to_cubie_map[loc]));
        if (corner_cubies_x_at_z.length > 0){
            console.log("corner_cubies_x_at_z:" + corner_cubies_x_at_z);
            loc = corner_cubies_x_at_z[0];
            side_locs = loc.split('').filter(x=>x!=Z);
            var a_loc = side_locs[0]; b_loc = side_locs[1];
            var a_facet = self.cube_state.loc_to_cubie_map[loc].loc_to_facet_map[a_loc]; 
            var b_facet = self.cube_state.loc_to_cubie_map[loc].loc_to_facet_map[b_loc];
            if (b_loc != a_facet){
                op = get_command_from_path(Z, b_loc, a_facet);
                //if (op == null || op == undefined) throw "error: " + Z + " " + b_loc + " " + a_facet;
                ops.push(op); self.cube_state.rotate(op);
                console.log(op);
            }
            push_op = get_command_from_path(a_facet, X, b_facet); 
            //if (push_op == null || push_op == undefined) throw "error: " + a_facet + " " + X + " " + b_facet;
            ops.push(push_op); self.cube_state.rotate(push_op);
            console.log(push_op);
            var z_op = get_command_from_path(Z, b_facet, a_facet); 
            //if (z_op == null || z_op == undefined) throw "error: " + Z + " " + b_facet + " " + a_facet;
            ops.push(z_op.repeat(2)); self.cube_state.rotate(z_op.repeat(2));
            console.log(z_op.repeat(2));
            op = reverse_op(push_op); ops.push(op); self.cube_state.rotate(op);
            console.log(op);
            ops.push(z_op); self.cube_state.rotate(z_op);
            console.log(z_op);
            ops = ops.concat(this._solve_first_layer_corner_cubies(X, Z));
        }
        var x_corner_locs = CUBE_FACES[X].filter(loc=>loc.length == 3).filter(loc=>!self.cube_state.loc_to_cubie_map[loc].is_solved());
        //console.log("x_corner_locs: " + x_corner_locs);
        if (x_corner_locs.length > 0){
            console.log("x_corner_locs: " + x_corner_locs);
            loc = x_corner_locs[0];
            side_locs = loc.split('').filter(x=>x!=X);
            var a_loc = side_locs[0]; var b_loc = side_locs[1];
            push_op = get_command_from_path(a_loc, X, b_loc); ops.push(push_op); self.cube_state.rotate(push_op);
            console.log(push_op);
            op = get_command_from_path(Z, b_loc, a_loc); ops.push(op); self.cube_state.rotate(op);
            console.log(op);
            op = reverse_op(push_op); ops.push(op); self.cube_state.rotate(op);
            console.log(op);
            ops = ops.concat(this._solve_first_layer_corner_cubies(X, Z));
        }
        return ops;
    },

    _exists_solved_cubie_on_face : function(face_name)
    {
        return ROTATION_FACE_CYCLES[face_name].some(side=>this.cube_state.loc_to_cubie_map[sort(side+face_name)].is_solved());
    },

    _solve_first_layer_edge_facets: function(facet_to_solve, side_name, cubie_name, X){
        var ops = [];
        var op;
        var cubie_loc = this.cube_state.cubie_to_loc_map[cubie_name];
        var facet_loc = this.cube_state.loc_to_cubie_map[cubie_loc].facet_to_loc_map[facet_to_solve];
        var side_loc = this.cube_state.loc_to_cubie_map[cubie_loc].facet_to_loc_map[side_name];
        if (facet_loc == facet_to_solve)//solved
            return ops;
        if (side_loc==facet_to_solve||side_loc == OPPOSITE_FACE_NAMES[facet_to_solve]){
            if (facet_loc != X && facet_loc != OPPOSITE_FACE_NAMES[X])
                op = get_command_from_path(facet_loc, X, side_loc);
            else op = facet_loc;
            //console.log("solving %s of %s", facet_to_solve, cubie_name);
            //console.log("got: %s at %s (%s) : %s --> %s ", op, facet_loc, X, side_name, side_loc);
            ops.push(op); this.cube_state.rotate(op);
            ops = ops.concat(this._solve_first_layer_edge_facets(facet_to_solve, side_name, cubie_name, X));
        }else{
            //console.log("getting command for %s @ %s, %s @ %s", side_name, side_loc, facet_to_solve, facet_loc);
            if (side_loc == X && this._exists_solved_cubie_on_face(X)){
                op = facet_loc.repeat(2); //moving the cubie to Z side
            }else{
                op = get_command_from_path(side_loc, facet_loc, facet_to_solve);
            }
            //console.log("got command is %s ", op);
            // if (op == null || op == undefined){
            //     console.log("no op matched for %s, %s, %s", side_loc, facet_loc, facet_to_solve);
            //     throw "Error !";
            // }
            ops.push(op); this.cube_state.rotate(op);
            ops = ops.concat(this._solve_first_layer_edge_facets(facet_to_solve, side_name, cubie_name, X));
        }
        return ops;
    },

    _solve_first_layer_edge_cubies : function(X){
        var ops = [];
        var sides_to_solve  = ROTATION_FACE_CYCLES[X]
            .map(side=>[X in this.cube_state.loc_to_cubie_map[sort(side+X)].loc_to_facet_map, 
                        this.cube_state.loc_to_cubie_map[sort(side+X)].get_number_of_facet_solved(), side])
            .filter(x=>x[1]!=2).sort().map(x=>x[2]);
        if (sides_to_solve.length > 0){
            var side = sides_to_solve[0];
            var name = sort(side + X);
            var loc = name;
            if (!this.cube_state.loc_to_cubie_map[loc].is_solved()){
                //console.log("solving %s on %s ...", side, name);
                var op = this._solve_first_layer_edge_facets(side, X, name, X)
                ops = ops.concat(op);
                //console.log("done: " + op);
                //console.log("solving %s on %s ...", X, name);
                op = this._solve_first_layer_edge_facets(X, side, name, X)
                ops = ops.concat(op);
                //console.log("done: " + op);
                this.count_limited ++;
                //console.log(this.count_limited);
                if(this.count_limited > 100)
                    throw "count limit hit !";
            }
            ops = ops.concat(this._solve_first_layer_edge_cubies(X));
        };
        return ops;
    },

    _determine_the_first_layer_to_solve : function(){
        var num_of_edge_facets_solved = [];
        FACE_NAMES.forEach(face_name=>
            {
                var count_key =
                [
                    this.cube_state.get_num_of_facets_solved(CUBE_FACES[face_name].filter(loc=>loc.length==2)),
                    this.cube_state.get_num_of_facets_solved(CUBE_FACES[face_name].filter(loc=>loc.length==3))
                ].map(x=>x<10?"0" + x.toString() : x.toString()).join('');
                num_of_edge_facets_solved[count_key] = face_name;
            }
        );
        //console.log(num_of_edge_facets_solved);
        var max_number_of_facets_solved = Object.keys(num_of_edge_facets_solved).reduce((a,b)=>a>b?a:b);
        return num_of_edge_facets_solved[max_number_of_facets_solved];
    },
}