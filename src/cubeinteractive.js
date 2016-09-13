var CubeInteractive = function(cube, camera, element){
    this.cube = cube;
    this.camera = camera;
    this.element = element;
	this.is_in_drag_rotation = false;
	this.raycaster = new THREE.Raycaster();
	this.mouse = new THREE.Vector2();
	this.rotate_faces = []; 
	[R, L, U, D, F, B].forEach(x=>this.rotate_faces[x.get_op()] = x);
	this.rotate_face_planes = [];
	Object.keys(this.rotate_faces).forEach(x=>{
			this.rotate_face_planes[x]=this.rotate_faces[x].plane(300);
		}
	);
	this.rotate_face_name = null;
	this.controls = new THREE.OrbitControls(this.camera, this.element);
	this.controls.enableDamping = true;
	this.controls.dampingFactor = 0.25;
	this.controls.enableZoom = false;
    this.init_angle = 0;
    this.last_angle = 0;
    this.intersect = null;
}

CubeInteractive.prototype = {
	on_mouse_up : function(event){
		if (this.is_in_drag_rotation && this.rotate_face_name !== null){
			//rotating remaining part
            var op = this.rotate_faces[this.rotate_face_name].get_op();
            if (this.last_angle * this.init_angle < 0){
                //cancel op
                this.cube.rotate_angle(op, -this.init_angle);
            }else{
                if (this.init_angle > 0) op = op + "'";
                this.cube.rotate(op, this.init_angle, null);
            }
		}
		this.is_in_drag_rotation = false;
        this.rotate_face_name = null;
	},

    _get_small_angle : function(angle){
        if (angle > Math.PI) angle = Math.PI * 2 - angle;
        if (angle < -Math.PI) angle = Math.PI * 2 + angle;
        return angle;
    },

	on_mouse_move : function(event){
		if (this.is_in_drag_rotation){
			this._set_mouse_position(this.mouse, event);
			this.raycaster.setFromCamera(this.mouse, this.camera);
			if (this.rotate_face_name === null){
				var max_angle = -1;
				Object.keys(this.intersects).forEach(face_name=>{
					var intersect = this.raycaster.ray.intersectPlane(this.rotate_face_planes[face_name]);
					var face = this.rotate_faces[face_name];
                    var angle = this._get_small_angle(face.get_vector2(intersect).angle() - face.get_vector2(this.intersects[face_name]).angle());
					angle = Math.abs(angle);
					if (angle>max_angle){
						max_angle = angle;
						this.rotate_face_name = face_name;
					}
				});
				this.intersect = this.intersects[this.rotate_face_name];
				console.log("determined: ", this.rotate_face_name, max_angle);
			}else{
				var intersect = this.raycaster.ray.intersectPlane(this.rotate_face_planes[this.rotate_face_name]);
				//do rotate angle
				var rotate_face = this.rotate_faces[this.rotate_face_name];
				var angle = rotate_face.get_vector2(intersect).angle() - rotate_face.get_vector2(this.intersect).angle()
                angle = this._get_small_angle(angle);
				//console.log("rotating ", this.rotate_axis_index, angle, intersect, this.intersect);
				var op = rotate_face.get_op();
				this.cube.rotate_angle(op, angle);
                this.init_angle += angle;
                this.last_angle = angle;
				this.intersect = intersect;
                
			}
		}
	},

	_set_mouse_position : function(mouse, event){
    	var p = element_position(this.element);
		var x = event.pageX - p.x;
		var y = event.pageY - p.y; 
		mouse.x = (x / this.element.offsetWidth) * 2 - 1;
		mouse.y = -(y / this.element.offsetHeight) * 2 + 1;
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

			var facet_name = intersects[0].object.facet.name;
			var cubie_name = intersects[0].object.facet.cubie.name;
			var cubicle_name = this.cube.cube_state.cubie_to_loc_map[cubie_name];
			var facelet_name = this.cube.cube_state.loc_to_cubie_map[cubicle_name].facet_to_loc_map[facet_name];
			
			var rotate_face_names = cubicle_name.split('').filter(x=>x!=facelet_name);
			//console.log(facelet_name, cubicle_name, rotate_face_names, this.rotate_face_planes);
			this.intersects = [];
			rotate_face_names.forEach(x=>this.intersects[x] = raycaster.ray.intersectPlane(this.rotate_face_planes[x]));
			this.rotate_face_name = null;
            this.init_angle = 0;
			
		}else{
			this.is_in_drag_rotation = false;
		}
		this.controls.enabled = !this.is_in_drag_rotation;
	}
}