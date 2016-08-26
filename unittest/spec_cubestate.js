describe("CubeState", function() {
  var cube_state;
  
 beforeEach(function() {
    cube_state = new CubeState();
  });

  it("should be able to add a cubie state", function() {
    cube_state.add_cubie_state("FUR", "FUL");
    expect(cube_state.loc_to_cubie_map["FLU"].name).toEqual("FRU");
  });

});
