/**
 ** @author Ligang Wang, http://github.com/ligangwang/
 **/
var TeleporterModeCompression = 0;
var TeleporterModeSlice = 1;
var TeleporterOut = 0;
var TeleporterSplit = 1;
var TeleporterIn = 2;
var Teleporter = function(scene, facet, distance, out_bound, in_bound, axis, out_direction, in_direction, manual_rotate=false){
	this.mode = TeleporterModeSlice;
	this.scene = scene;
	this.facet = facet;
	this.axis = axis;
	this.out_bound = out_bound; 
	this.in_bound = in_bound;	
	this.distance = distance;		
	if (out_direction > 0){
		this.position = Math.round(facet.geometry.vertices.map(x=>axis.get(x)).reduce((a,b)=>a>b?a:b, -10000));
	}else{
		this.position = Math.round(facet.geometry.vertices.map(x=>axis.get(x)).reduce((a,b)=>a>b?b:a, 10000));
	}
	this.facet_clone = null;
	this.facet_in_clone = null;
	this.length = 200;
	this.in_bound_value = this.axis.get(this.in_bound);
	this.out_bound_value = this.axis.get(this.out_bound);
	//this.distance = Math.abs(this.out_bound_value - origin) + Math.abs(target - this.in_bound_value);
	//console.log(this.distance);
	this.out_direction = out_direction;
	this.in_direction = in_direction;
	this.cut_plane_to_out = new THREE.Plane(axis.get_vector3(-out_direction), this.out_bound_value * this.out_direction);//new THREE.Plane(new THREE.Vector3(0, 0,-1), 900);
	this.cut_plane_to_in  = new THREE.Plane(axis.get_vector3(out_direction), -this.out_bound_value * this.out_direction);
	this.in_plane  = new THREE.Plane(axis.get_vector3(in_direction), this.in_bound_value);//new THREE.Plane(new THREE.Vector3(0, 0, 1), 1500);
	this.manual_rotate = manual_rotate;

	this.teleport = new THREE.Matrix4();
	var in_bound = this.in_bound.clone();
	in_bound.sub(this.out_bound);
	this.teleport.makeTranslation(in_bound.x, in_bound.y, in_bound.z);
	this.status = TeleporterOut;
	//console.log("init ", this.facet.name, this.facet.cubie.name);
}

Teleporter.prototype = {
	is_all_moved_out : function(){
		//not exists vertice behind out bound value
		return !this.facet.geometry.vertices.some(v=>(this.out_direction>0&&this.axis.get(v) < this.out_bound_value) || 
				(this.out_direction < 0 && this.axis.get(v) > this.out_bound_value))
	},

	exists_moved_out : function(){
		return this.facet.geometry.vertices.some(v=>(this.out_direction>0 && this.axis.get(v) > this.out_bound_value) ||
				(this.out_direction < 0 && this.axis.get(v) < this.out_bound_value));
	},

	transform : function(){
		var out_translation = new THREE.Matrix4();
		var in_translation = new THREE.Matrix4();
		return function(total, delta){
			var move_distance = delta * this.distance

			//console.log("new position: ", this.facet.name, this.facet.cubie.name, new_position, out_cut_len, this.distance);
			this.axis.make_translation(out_translation, move_distance * this.out_direction);
			this.axis.make_translation( in_translation, move_distance * this.in_direction);
			if (this.status == TeleporterIn)
				this.facet.apply_matrix(in_translation);
			else
				this.facet.apply_matrix(out_translation);
			var exists_moved_out = this.exists_moved_out();
			var is_all_moved_out = this.is_all_moved_out();
			//console.log("out bound value", this.out_bound_value);
			if(this.status == TeleporterOut && exists_moved_out){
				//console.log("cut plane: ", this.out_plane, this.out_cut_plane);
				var in_geometry  = sliceGeometry(this.facet.geometry.clone(), this.cut_plane_to_in);
				var out_geometry = sliceGeometry(this.facet.geometry.clone(), this.cut_plane_to_out);
				//console.log("out_cut: ", in_geometry);
				this.teleport_geometry_to_in_side(in_geometry);
				//in_geometry.vertices.forEach(x=>this.axis.add(x, this.in_bound_value-this.out_bound_value));
				this.facet.update_split_geometries(this.scene,  out_geometry, in_geometry);
				this.status = TeleporterSplit;
			}

			if (is_all_moved_out || ((!this.manual_rotate) && total == 1 && exists_moved_out)){
				if (this.status !== TeleporterIn){
					//all moving out
					//console.log("all moved out: ",this.status, this.facet.name, this.facet.cubie.name);
					//this.facet.geometry.vertices.forEach(v=>this.axis.add(v, this.in_bound_value-this.out_bound_value));
					this.teleport_geometry_to_in_side(this.facet.geometry);
					this.facet.remove_split_geometries(this.scene);	
					this.status = TeleporterIn;
				}
			}
		}
	}(),

	teleport_geometry_to_in_side: function(geometry){
		geometry.applyMatrix(this.teleport);
		if (this.out_direction != this.in_direction){
			geometry.vertices.forEach(v=>this.axis.add(v, -2 * (this.axis.get(v) - this.in_bound_value)));
		}
	}
}

var Translater = function(objects, translation){
	this.objects = objects;
	this.translation = translation;
}

Translater.prototype = {
	transform: function(){
		var m = new THREE.Matrix4();		
		return function(total, delta){
			m.makeTranslation(this.translation.x * delta, this.translation.y * delta, this.translation.z * delta);
			for (var obj of this.objects){
				obj.apply_matrix(m);
			}
		}
	}(),
}

var Rotater = function(objects, origin, axis, angle){
	this.objects = objects;
	this.origin = origin;
	this.axis = axis;
	this.angle = angle;
}

Rotater.prototype = {
	transform: function(){
		var m = new THREE.Matrix4();		
		return function(total, delta){
			if (this.origin.x != 0 || this.origin.y != 0 || this.origin.z != 0){
				m = Transform(this.origin, this.axis, this.angle * delta);
			}else{
				m.makeRotationAxis(this.axis, this.angle * delta);
			}
			for (var obj of this.objects){
				obj.apply_matrix(m);
			}
		}
	}(),
}
