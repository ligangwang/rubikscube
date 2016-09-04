describe("CubeState", function() {
  var solved_cube_state;
  var scrambled_cube_state;
 beforeEach(function() {
    solved_cube_state = new CubeState(SINGMASTER_SOLVED_STATE);
  });

  it("should be able to return true when asked is solved state for singmaster solved notation", function() {
    expect(solved_cube_state.is_solved()).toEqual(true);
  });

  it("should solve the cube from 100 random positions", function(){
    //var init_state = "UR DF BR UL FU BU RD DL FR FL BD BL RFD LBD FLD BUR FUL RDB UBL UFR";
    //console.log(init_state.length);
    //new BottomupSolver(init_state).solve();
    for (var i=0;i<100;i++){
      scrambled_cube_state = new CubeState(SINGMASTER_SOLVED_STATE);
      get_random_ops().forEach(x=>scrambled_cube_state.rotate(x));
      var state = scrambled_cube_state.get_state();
      var solver = new BottomupSolver(state);
      expect(solver.solve()).not.toEqual([]);
    }
    //console.log(Array.from(Array(3).keys()));
  });
});
