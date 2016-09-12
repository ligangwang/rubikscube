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
	//this.renderer.setPixelRatio( window.devicePixelRatio );
	this.renderer.setSize( this.render_width, this.render_height );
	this.renderer.setClearColor(0x606060);
	
	//this.renderer.autoClear = false;
	this.parent_control.appendChild( this.renderer.domElement );

	this.camera = new THREE.PerspectiveCamera( 50, this.render_width / this.render_height, 0.1, 10000 );
	this.camera.lookAt(this.cube.scene.position);
	this.camera.position.z = 1200;
	this.camera.position.y = 1200;
	this.camera.position.x = 1200;

	this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
	this.controls.enableDamping = true;
	this.controls.dampingFactor = 0.25;
	this.controls.enableZoom = false;
	this.is_in_drag_rotation = false;
	this.raycaster = new THREE.Raycaster();
	this.mouse = new THREE.Vector2();
	this.rotate_axis = [AxisX, AxisY, AxisZ];
	this.rotate_axis_plane = this.rotate_axis.map(x=>x.plane(300));
	this.rotate_axis_index = -1;
}

CubeConsole.prototype = {
	render : function(){
		var scene = this.cube.scene;
		var renderer = this.renderer;
		var camera = this.camera;
		var controls = this.controls;
		function animate() {
			TWEEN.update();
			controls.update();
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

	on_mouse_up : function(event){
		this.is_in_drag_rotation = false;
	},

	on_mouse_move : function(event){
		if (this.is_in_drag_rotation){
			this._set_mouse_position(this.mouse, event);
			this.raycaster.setFromCamera(this.mouse, this.camera);
			if (this.rotate_axis_index < 0){
				var max_angle = -1;
				this.rotate_axis.forEach((axis, i)=>{
					var intersect = this.raycaster.ray.intersectPlane(this.rotate_axis_plane[i]);
					var angle = Math.abs(axis.get_vector2(intersect).angle() - axis.get_vector2(this.intersects[i]).angle());
					if (angle>max_angle){
						max_angle = angle;
						this.rotate_axis_index = i;
					}
				});
				this.intersect = this.intersects[this.rotate_axis_index];
				//console.log("determined: ", this.rotate_axis_index, max_angle);
			}else{
				var intersect = this.raycaster.ray.intersectPlane(this.rotate_axis_plane[this.rotate_axis_index]);
				//do rotate angle
				var axis = this.rotate_axis[this.rotate_axis_index];
				var angle = axis.get_vector2(intersect).angle() - axis.get_vector2(this.intersect).angle()
				//console.log(this.rotate_axis_index, angle);

				this.intersect = intersect;
			}
		}
	},

	_set_mouse_position : function(mouse, event){
    	var p = element_position(this.renderer.domElement);
		var x = event.pageX - p.x;
		var y = event.pageY - p.y; 
		mouse.x = (x / this.renderer.domElement.offsetWidth) * 2 - 1;
		mouse.y = -(y / this.renderer.domElement.offsetHeight) * 2 + 1;
	},

	on_mouse_down : function(event){
		if (this.cube.is_active()) return;
		var mouse = new THREE.Vector2();
		this._set_mouse_position(mouse, event);
		var raycaster = new THREE.Raycaster();
		raycaster.setFromCamera(mouse, this.camera);
		var intersects = raycaster.intersectObjects(this.cube.scene.children);
		if (intersects.length > 0){
			this.is_in_drag_rotation = true;
			this.intersects = this.rotate_axis.map((axis,i)=>raycaster.ray.intersectPlane(this.rotate_axis_plane[i]));
			this.rotate_axis_index = -1;
			//console.log(intersect.object.facet.name, intersect.object.facet.cubie.name);
			//console.log(raycaster.ray, intersect.point);
		}else{
			this.is_in_drag_rotation = false;
		}
		this.controls.enabled = !this.is_in_drag_rotation;
	}

}