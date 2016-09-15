/**
 ** @author Ligang Wang, http://github.com/ligangwang/
 **/
var CubeConsole = function(initial_state, parent_control){
	this.cube = new RubiksCube(initial_state, new THREE.Scene());
	this.cube.enable_animation = true;
	this.input_text = "";
	this.input_timer = null;
	
	this.parent_control = parent_control;
	this.render_width = 800;
	this.render_height = 600;
	this.renderer = new THREE.WebGLRenderer({ antialias: true });
	this.renderer.setPixelRatio( window.devicePixelRatio );
	this.renderer.setSize( this.render_width, this.render_height );
	this.renderer.setClearColor(0x262626);
	
	//this.renderer.autoClear = false;
	this.parent_control.appendChild( this.renderer.domElement );
	this.stats = new Stats();
	this.parent_control.appendChild( this.stats.dom );

	this.camera = new THREE.PerspectiveCamera( 50, this.render_width / this.render_height, 0.1, 10000 );
	this.camera.lookAt(this.cube.scene.position);
	this.camera.position.z = 1000;
	this.camera.position.y = 1000;
	this.camera.position.x = 1000;

	this.interactive = new CubeInteractive(this.cube, this.camera, this.renderer.domElement);

}

CubeConsole.prototype = {
	render : function(){
		var scene = this.cube.scene;
		var renderer = this.renderer;
		var camera = this.camera;
		var controls = this.interactive.controls;
		var stats = this.stats;
		function animate() {
			TWEEN.update();
			controls.update();
			stats.update();
			renderer.render( scene, camera );
			requestAnimationFrame( animate );
		}
		animate();
	},	
	
	reset_input_timer : function(){
		window.clearTimeout(this.input_timer);
		this.input_timer = window.setTimeout(this.on_timer, 1000, this);
	},
	

	on_timer : function(console){
		if (console.input_text.length > 0){
			console.cube.command(console.input_text);
			console.input_text = "";
		}
	},

	delete_char : function(){	
		this.input_text = this.input_text.substring( 0, this.input_text.length - 1 );
		this.reset_input_timer();
	},

	input_char : function(ch){
		if (!this.cube.is_in_solver_mode) {
			ch = ch.toUpperCase();	
			var prev_char = this.input_text.substr(this.input_text.length - 1)
			if (this.cube.is_valid_input_char(prev_char, ch)){
				this.input_text += ch;
				this.reset_input_timer();
			}
		}
	},
}