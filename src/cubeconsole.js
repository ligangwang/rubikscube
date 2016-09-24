/**
 ** @author Ligang Wang, http://github.com/ligangwang/
 **/


var CubeConsole = function(initialState, parentControl){
	this.cube = new RubiksCube(initialState, new THREE.Scene());
	this.cube.enableAnimation = true;
	this.inputText = "";
	this.inputTimer = null;
	
	this.parentControl = parentControl;
	this.renderWidth = parentControl.offsetWidth;
	this.renderHeight = parentControl.offsetHeight;
	this.renderer = new THREE.WebGLRenderer({ antialias: true });
	this.renderer.setPixelRatio( window.devicePixelRatio );
	this.renderer.setSize( this.renderWidth, this.renderHeight );
	this.renderer.setClearColor(0x262626);
	
	//this.renderer.autoClear = false;
	this.parentControl.appendChild( this.renderer.domElement );
	this.stats = new Stats();
	this.parentControl.appendChild( this.stats.dom );

	this.camera = new THREE.PerspectiveCamera( 50, this.renderWidth / this.renderHeight, 0.1, 10000 );
	this.camera.lookAt(this.cube.scene.position);
	this.camera.position.z = 1000;
	this.camera.position.y = 1000;
	this.camera.position.x = 1000;

	this.interactive = new CubeInteractive(this.cube, this.camera, this.renderer.domElement);
	
	this.cubeController = {
		speed : 5,
		transparent : 0
	};
	this.initController();

/*	
	var plane = new THREE.Plane(new THREE.Vector3(0, 0, -1), -200);
	var geom = new THREE.SphereGeometry(100, 100, 100);
	geom = sliceGeometry(geom, plane);
	var material = new THREE.MeshBasicMaterial({ wireframe: false });
	var mesh = new THREE.Mesh(geom, material);
	this.cube.scene.add(mesh);	
*/	
}

CubeConsole.prototype = {
	initController : function(){
		var gui = new dat.GUI();
		gui.add(this.cubeController, "speed", 1, 50, 5).onChange(v=>{
			this.cube.timePerAnimationMove = 5000/v; 
		});
		gui.add(this.cubeController, "transparent", 0, 100, 0).onChange(v=>{
			var transparent = v;
			var opacity = (100-transparent)/100;
			this.cube.setOpacity(opacity);
		});
	},

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
	
	resetInputTimer : function(){
		window.clearTimeout(this.inputTimer);
		this.inputTimer = window.setTimeout(this.onTimer, 1000, this);
	},
	

	onTimer : function(console){
		if (console.inputText.length > 0){
			console.cube.command(console.inputText);
			console.inputText = "";
		}
	},

	deleteChar : function(){	
		this.inputText = this.inputText.substring( 0, this.inputText.length - 1 );
		this.resetInputTimer();
	},

	inputChar : function(ch){
		if (!this.cube.isInSolverMode) {
			ch = ch.toUpperCase();
			var prevChar = this.inputText.substr(this.inputText.length - 1)
			if (this.cube.isValidInputChar(prevChar, ch)){
				this.inputText += ch;
				this.resetInputTimer();
			}
		}
	},
}