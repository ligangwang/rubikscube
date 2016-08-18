/**
 ** @author Ligang Wang, http://github.com/ligangwang/
 **/

var Teleporter = function(scene, facet, origin, out_bound, in_bound, target, axis, out_direction, in_direction){
	this.scene = scene;
	this.facet = facet;
	this.origin = origin;       
	this.axis = axis;
	this.out_bound = out_bound; 
	this.in_bound = in_bound;	
	this.target = target;		
	this.position = origin;
	this.facet_clone = null;
	this.length = 200;
	this.in_bound_value = this.axis.get(this.in_bound);
	this.out_bound_value = this.axis.get(this.out_bound);
	this.distance = Math.abs(this.out_bound_value - origin) + Math.abs(target - this.in_bound_value);
	this.out_direction = out_direction;
	this.in_direction = in_direction;
	this._setup();
	this._jump_moving_out_phase = true;
	//console.log("distance", this.distance, this.out_bound_value, this.in_bound_value);
	//console.log(this.out_vertices_adj_index, this.out_vertices_noadj_index, this.in_vertices_adj_index, this.in_vertices_noadj_index)
}

Teleporter.prototype = {
	_setup_index : function(){
		this.out_vertices_adj_index = [];
		this.out_vertices_noadj_index = [];
		this.in_vertices_adj_index = [];
		this.in_vertices_noadj_index = [];
		var mean = 0;
		for(var i = 0, len = this.facet.geometry.vertices.length; i < len; i++){
			mean += this.axis.get(this.facet.geometry.vertices[i]);
		}
		mean /= this.facet.geometry.vertices.length;
		//console.log(this.facet.geometry.vertices);
		for(var i = 0, len = this.facet.geometry.vertices.length; i < len; i++){
			var axis_value = this.axis.get(this.facet.geometry.vertices[i]);
			if ((axis_value - mean) * this.out_direction > 0){
				this.out_vertices_adj_index.push(i);
			}else{
				this.out_vertices_noadj_index.push(i);
			} 
			if((axis_value - mean) * this.in_direction < 0){
				this.in_vertices_adj_index.push(i);
			}else{
				this.in_vertices_noadj_index.push(i);
			}
		}
	},
	
	_setup : function(){
		this._setup_index();
		this.teleport = new THREE.Matrix4();
		var in_bound = this.in_bound.clone();
		in_bound.sub(this.out_bound);
		
		//console.log("teleporting to", in_bound);
		this.teleport.makeTranslation(in_bound.x, in_bound.y, in_bound.z);
	},
	
	_sqeeze : function(){//move in side
		for(var i = 0, len = this.in_vertices_adj_index.length; i < len; i++){
			var in_adj_index = this.in_vertices_adj_index[i];	
			var in_noadj_index = this.in_vertices_noadj_index[i];	
			this.axis.set(this.facet.geometry.vertices[in_adj_index], this.axis.get(this.facet.geometry.vertices[in_noadj_index]));
		}
	},
	
	_reset : function(){//move in side
		var adjust = this.in_direction == 1? -this.length : this.length;
		for(var i = 0, len = this.in_vertices_adj_index.length; i < len; i++){
			var in_adj_index = this.in_vertices_adj_index[i];	
			var in_noadj_index = this.in_vertices_noadj_index[i];
			this.axis.set(this.facet.geometry.vertices[in_adj_index], this.axis.get(this.facet.geometry.vertices[in_noadj_index]) + adjust);
		}
	},

	_create_clone : function(){
		this.facet_clone = this.facet.clone();
		this.facet_clone.add_contents_to_scene(this.scene);
		this.facet.apply_matrix(this.teleport);
	},
	
	_delete_clone : function(){
		//console.log("deleting clone...");
		this.facet_clone.remove_from_scene(this.scene);
		delete this.facet_clone;
		this.facet_clone = null;
		this._reset();
	},
	
	adjust_size : function(facet, vertice_index, adjust_size){
		facet.geometry.dynamic = true;
		for(var index of vertice_index){
			var vertice = facet.geometry.vertices[index];
			this.axis.adjust(vertice, adjust_size);
		}	
		facet.geometry.verticesNeedUpdate = true;
	},
	
	transform : function(){
		var out_translation = new THREE.Matrix4();
		var in_translation = new THREE.Matrix4();
		var mirror_translation = new THREE.Matrix4();
		return function(total, delta){
			var move_distance = delta * this.distance
			var new_position = this.position + move_distance * this.out_direction;
			var out_cut_len = (new_position - this.out_bound_value) * this.out_direction;
			this.axis.make_translation(out_translation, move_distance * this.out_direction);
			this.axis.make_translation( in_translation, move_distance * this.in_direction);
			if (out_cut_len > 0 && out_cut_len < this.length){
				this._jump_moving_out_phase = false;
				var out_adjust_size;
				if (this.facet_clone == null){
					//first cross boundary
					this._create_clone();
					out_adjust_size = Math.min(out_cut_len, move_distance);
					if (this.out_direction != this.in_direction){
						this.axis.make_translation(mirror_translation, 2* (move_distance - out_cut_len) * this.out_direction)
						this.facet.apply_matrix(mirror_translation);
					}
					this._sqeeze();
					
				}else{
					out_adjust_size = move_distance;
				}
				//clone, both moving 
				this.facet.apply_matrix(in_translation);
				this.facet_clone.apply_matrix(out_translation);

				this.adjust_size(this.facet_clone, 	this.out_vertices_adj_index, out_adjust_size * this.out_direction * -1);
				this.adjust_size(this.facet, 		this.in_vertices_adj_index, out_adjust_size * this.in_direction * -1);
			}else{
				if (this.facet_clone != null){
					this._delete_clone();
				}
				if (out_cut_len <=0){
					this.facet.apply_matrix(out_translation);
				}
				else if(out_cut_len >= this.length){
					//moving in
					if (this._jump_moving_out_phase){
						this.facet.apply_matrix(this.teleport);
						if (this.out_direction != this.in_direction){
							var gap = (this.out_bound_value - this.position) * this.out_direction;
							this.axis.make_translation(mirror_translation, 2 * gap * this.out_direction)
							this.facet.apply_matrix(mirror_translation);
						}
						this._jump_moving_out_phase = false;
					}
					this.facet.apply_matrix(in_translation);
				}
			}
			if (total == 1 && this.facet_clone != null){
				this._delete_clone();
			}
			this.position = new_position;
		}
	}(),
	
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
