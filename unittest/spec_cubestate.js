describe("CubeState", function() {
  var solved_cube_state;
  var scrambled_cube_state;
 beforeEach(function() {
    solved_cube_state = new CubeState(SINGMASTER_SOLVED_STATE);
  });

  it("should be able to return true when asked is solved state for singmaster solved notation", function() {
    expect(solved_cube_state.is_solved()).toEqual(true);
  });

  it("should solve the cube from any random positions", function(){
    //var init_state = "UR DF BR UL FU BU RD DL FR FL BD BL RFD LBD FLD BUR FUL RDB UBL UFR";
    //console.log(init_state.length);
    //new BottomupSolver(init_state).solve();
    for (var i=0;i<1;i++){
      scrambled_cube_state = new CubeState(SINGMASTER_SOLVED_STATE);
      get_random_ops().forEach(x=>scrambled_cube_state.rotate(x));
      var state = scrambled_cube_state.get_state();
      var solver = new BottomupSolver(state);
      expect(solver.solve()).not.toEqual([]);
    }
    //console.log(Array.from(Array(3).keys()));
  });


  it("should has valid position for solved position", function() {
    expect(is_valid_cube_state(SINGMASTER_SOLVED_STATE)).toEqual(true);
  });

  
  it("should has invalid position for the position having two cubies swapped", function() {
    //                         "UF UR UB UL DF DR DB DL FR FL BR BL UFR URB UBL ULF DRF DFL DLB DBR"
    expect(is_valid_cube_state("UR UF UB UL DF DR DB DL FR FL BR BL UFR URB UBL ULF DRF DFL DLB DBR")).toEqual(false);
  });

  it("should has valid position for the position having three cubies swapped", function() {
    //                         "UF UR UB UL DF DR DB DL FR FL BR BL UFR URB UBL ULF DRF DFL DLB DBR"
    expect(is_valid_cube_state("DL UR UB UL DF DR DB BR FR FL UF BL UFR URB UBL ULF DRF DFL DLB DBR")).toEqual(true);
  });

  it("should has invalid position for the position having one corner cubie twisted", function() {
    //                         "UF UR UB UL DF DR DB DL FR FL BR BL UFR URB UBL ULF DRF DFL DLB DBR"
    expect(is_valid_cube_state("UF UR UB UL DF DR DB DL FR FL BR BL UFR URB UBL ULF DRF DFL DLB BRD")).toEqual(false);
  });

  it("should has invalid position for the position having one edge cubie twisted", function() {
    //                         "UF UR UB UL DF DR DB DL FR FL BR BL UFR URB UBL ULF DRF DFL DLB DBR"
    expect(is_valid_cube_state("FU UR UB UL DF DR DB DL FR FL BR BL UFR URB UBL ULF DRF DFL DLB DBR")).toEqual(false);
  });

  it("test", function(){
    expect("esd".indexOf("d")).toEqual(2);
  });

  it("should has valid state from any 100 random positions", function(){
    //var init_state = "UR DF BR UL FU BU RD DL FR FL BD BL RFD LBD FLD BUR FUL RDB UBL UFR";
    for (var i=0;i<100;i++){
      scrambled_cube_state = new CubeState(SINGMASTER_SOLVED_STATE);
      get_random_ops().forEach(x=>scrambled_cube_state.rotate(x));
      var state = scrambled_cube_state.get_state();
      //console.log("valid state: ", state);
      expect(is_valid_cube_state(state)).toEqual(true);
    }
    //console.log(Array.from(Array(3).keys()));
  });
});
