        
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

var BottomupSolver = function(cube_states){
    this.cube_states = cube_states;
    this.cube_faces = [];
    FACE_NAMES.forEach(x=>this.cube_faces[x] = []);
    Object.keys(cube_states).forEach(location=>location.split('').forEach(x=>this.cube_faces[x].push(location)));
}



BottomupSolver.prototype = {
    solve : function(){
        commands = []
        if (! this._is_solved()){
            var X = this._determine_the_first_layer_to_solve();
            commands = commands.concat(this._solve_first_layer(X));
            var Z = OPPOSITE_FACE_NAMES[X];
        }
        return commands;
    },

    _solve_first_layer : function(X){
        commands = [];
        return commands;
    },

    _num_of_faces_solved : function(locations){
        return locations.map(loc=>Object.keys(this.cube_states[loc]).filter(x=>x==this.cube_states[loc][x]).length)
                    .reduce((a,b)=>a+b, 0);
    },

    _determine_the_first_layer_to_solve : function(){
        num_of_edge_facets_solved = [];
        FACE_NAMES.forEach(face_name=>
            {
                count_key = 
                [
                    this._num_of_faces_solved(this.cube_faces[face_name].filter(loc=>loc.length==2)),
                    this._num_of_faces_solved(this.cube_faces[face_name].filter(loc=>loc.length==3))
                ].map(x=>x<10?"0" + x.toString() : x.toString()).join('');
                num_of_edge_facets_solved[count_key] = face_name;
            }
        );
        //console.log(num_of_edge_facets_solved);
        max_number_of_facets_solved = Object.keys(num_of_edge_facets_solved).reduce((a,b)=>a>b?a:b);
        return num_of_edge_facets_solved[max_number_of_facets_solved];
    },

    _is_solved_cubie : function(cubie_states){
        return Object.keys(cubie_states).every(x=>x==cubie_states[x]);
    },

    _is_solved : function()
    {
        return Object.keys(this.cube_states).every(x=>this._is_solved_cubie(this.cube_states[x]));
    },

    _do_command : function(op)
    {
        
    },

}