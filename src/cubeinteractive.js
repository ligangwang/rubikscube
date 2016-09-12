var CubeInteractive = function(cube, camera, element){
    this.cube = cube;
    this.camera = camera;
    this.element = element;
	this.is_in_drag_rotation = false;
	this.raycaster = new THREE.Raycaster();
	this.mouse = new THREE.Vector2();
	this.rotate_axis = [AxisX, AxisY, AxisZ];
	this.rotate_axis_plane = this.rotate_axis.map(x=>x.plane(300));
	this.rotate_axis_index = -1;
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
		if (this.is_in_drag_rotation && this.rotate_axis_index >= 0){
			//rotating remaining part
            var op = this.rotate_axis[this.rotate_axis_index].get_op();
            if (this.last_angle * this.init_angle < 0){
                //cancel op
                this.cube.rotate_angle(op, -this.init_angle);
               
            }else{
                if (this.init_angle > 0) op = op + "'";
                console.log("remaining: ",this.last_angle, this.init_angle, op);
                this.cube.rotate(op, this.init_angle, null);
            }
		}
		this.is_in_drag_rotation = false;
        this.rotate_axis_index = -1;
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
			if (this.rotate_axis_index < 0){
				var max_angle = -1;
				this.rotate_axis.forEach((axis, i)=>{
					var intersect = this.raycaster.ray.intersectPlane(this.rotate_axis_plane[i]);
                    var angle = this._get_small_angle(axis.get_vector2(intersect).angle() - axis.get_vector2(this.intersects[i]).angle());
					angle = Math.abs(angle);
					if (angle>max_angle){
						max_angle = angle;
						this.rotate_axis_index = i;
					}
				});
				this.intersect = this.intersects[this.rotate_axis_index];
				console.log("determined: ", this.rotate_axis_index, max_angle);
			}else{
				var intersect = this.raycaster.ray.intersectPlane(this.rotate_axis_plane[this.rotate_axis_index]);
				//do rotate angle
				var axis = this.rotate_axis[this.rotate_axis_index];
				var angle = axis.get_vector2(intersect).angle() - axis.get_vector2(this.intersect).angle()
                angle = this._get_small_angle(angle);
				//console.log("rotating ", this.rotate_axis_index, angle, intersect, this.intersect);
				var op = this.rotate_axis[this.rotate_axis_index].get_op();
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
			this.intersects = this.rotate_axis.map((axis,i)=>raycaster.ray.intersectPlane(this.rotate_axis_plane[i]));
			this.rotate_axis_index = -1;
            this.init_angle = 0;
			//console.log(intersect.object.facet.name, intersect.object.facet.cubie.name);
			//console.log(raycaster.ray, intersect.point);
		}else{
			this.is_in_drag_rotation = false;
		}
		this.controls.enabled = !this.is_in_drag_rotation;
	}
}