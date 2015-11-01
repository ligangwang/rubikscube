/**
 ** @author Ligang Wang, http://github.com/ligangwang/
 **/

var CubeConsole = function(){
	this.cube = new RubiksCube();
	this.cube.enable_animation = true;
	this.input_text = "";
	this.input_timer = null;
}

CubeConsole.prototype = {
	render : function(){
		var scene = new THREE.Scene();
		this.cube.addToScene(scene);
		var renderer = new THREE.WebGLRenderer({ antialias: true });
		var width = 800, height = 600;
		renderer.setSize( width, height );
		var camera = new THREE.PerspectiveCamera( 50, width / height, 0.1, 10000 );
		renderer.setClearColor(0xf0f0f0);
		document.body.appendChild( renderer.domElement );
		
		camera.lookAt(scene.position);
		camera.position.z = 1200;
		camera.position.y = 1200;
		camera.position.x = 1200;
		var controls = new THREE.OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;
		controls.dampingFactor = 0.25;
		controls.enableZoom = false;
		function animate() {
			requestAnimationFrame( animate );
			controls.update();
			TWEEN.update();
			renderer.render( scene, camera );
		}
		animate();
	},	
	
	resetInputTimer : function(){
		window.clearTimeout(this.input_timer);
		this.input_timer = window.setTimeout(this.onTimer, 1000, this);
	},
	

	onTimer : function(console){
		if (console.input_text.length > 0){
			console.cube.command(console.input_text);
			console.input_text = "";
		}
	},

	backSpace : function(){	
		this.input_text = this.input_text.substring( 0, this.input_text.length - 1 );
		this.resetInputTimer();
	},

	inputChar : function(ch){
		ch = ch.toUpperCase();				
		var prev_char = this.input_text.substr(this.input_text.length - 1)
		if (this.cube.isValidInputChar(prev_char, ch)){
			this.input_text += ch;
			this.resetInputTimer();
		}
	},
}