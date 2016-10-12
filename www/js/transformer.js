/**
 ** @author Ligang Wang, http://github.com/ligangwang/
 **/
var TeleporterModeCompression = 0;
var TeleporterModeSlice = 1;
var TeleporterOut = 0;
var TeleporterSplit = 1;
var TeleporterIn = 2;
class Teleporter{
	constructor(scene, facet, distance, outBound, inBound, axis, outDirection, inDirection, manualRotate=false){
		this.mode = TeleporterModeSlice;
		this.scene = scene;
		this.facet = facet;
		this.axis = axis;
		this.outBound = outBound;
		this.inBound  = inBound;
		this.distance = distance;
		this.length = 200;
		this.inBoundValue  = this.axis.get(this.inBound);
		this.outBoundValue = this.axis.get(this.outBound);
		//this.distance = Math.abs(this.outBoundValue - origin) + Math.abs(target - this.inBoundValue);
		//console.log(this.distance);
		this.outDirection  = outDirection;
		this.inDirection   = inDirection;
		this.cutPlaneToOut = new THREE.Plane(axis.getVector3(-outDirection), this.outBoundValue * this.outDirection);//new THREE.Plane(new THREE.Vector3(0, 0,-1), 900);
		this.cutPlaneToIn  = new THREE.Plane(axis.getVector3(outDirection), -this.outBoundValue * this.outDirection);
		this.inSidePlane   = new THREE.Plane(axis.getVector3(inDirection), this.inBoundValue);//new THREE.Plane(new THREE.Vector3(0, 0, 1), 1500);
		this.manualRotate  = manualRotate;

		this.teleport = new THREE.Matrix4();
		var inBound = this.inBound.clone();
		inBound.sub(this.outBound);
		this.teleport.makeTranslation(inBound.x, inBound.y, inBound.z);
		this.status = TeleporterOut;
		//console.log("init ", this.facet.name, this.facet.cubie.name);
		this.outTranslation = new THREE.Matrix4();
		this.inTranslation = new THREE.Matrix4();
	}

	isAllMovedOut(){
		//not exists vertice behind out bound value
		return !this.facet.geometry.vertices.some(v=>(this.outDirection>0&&this.axis.get(v) < this.outBoundValue) ||
				(this.outDirection < 0 && this.axis.get(v) > this.outBoundValue))
	}

	existsMovedOut(){
		return this.facet.geometry.vertices.some(v=>(this.outDirection>0 && this.axis.get(v) > this.outBoundValue) ||
				(this.outDirection < 0 && this.axis.get(v) < this.outBoundValue));
	}

	transform(total, delta){
		var moveDistance = delta * this.distance

		//console.log("new position: ", this.facet.name, this.facet.cubie.name, new_position, out_cut_len, this.distance);
		this.axis.makeTranslation( this.outTranslation, moveDistance * this.outDirection);
		this.axis.makeTranslation( this.inTranslation, moveDistance * this.inDirection);
		if (this.status == TeleporterIn)
			this.facet.applyMatrix(this.inTranslation);
		else
			this.facet.applyMatrix(this.outTranslation);

		var existsMovedOut = this.existsMovedOut();
		var isAllMovedOut = this.isAllMovedOut();
		//console.log("out bound value", this.outBoundValue);
		if(this.status == TeleporterOut && existsMovedOut) this.status = TeleporterSplit;
		if(this.status == TeleporterSplit){
			//console.log("cut plane: ", this.out_plane, this.out_cut_plane);
			var inGeometry  = sliceGeometry(this.facet.geometry.clone(), this.cutPlaneToIn);
			var outGeometry = sliceGeometry(this.facet.geometry.clone(), this.cutPlaneToOut);
			//console.log("out_cut: ", inGeometry);
			this.teleportGeometryToInSide(inGeometry);
			//inGeometry.vertices.forEach(x=>this.axis.add(x, this.inBoundValue-this.outBoundValue));
			this.facet.updateSplitGeometries(this.scene,  outGeometry, inGeometry);
		}

		if (isAllMovedOut || ((!this.manualRotate) && total == 1 && existsMovedOut)){
			if (this.status !== TeleporterIn){
				//all moving out
				//console.log("all moved out: ",this.status, this.facet.name, this.facet.cubie.name);
				//this.facet.geometry.vertices.forEach(v=>this.axis.add(v, this.inBoundValue-this.outBoundValue));
				this.teleportGeometryToInSide(this.facet.geometry);
				this.facet.removeSplitGeometries(this.scene);
				this.status = TeleporterIn;
			}
		}
	}

	teleportGeometryToInSide(geometry){
		geometry.applyMatrix(this.teleport);
		if (this.outDirection != this.inDirection){
			geometry.vertices.forEach(v=>this.axis.add(v, -2 * (this.axis.get(v) - this.inBoundValue)));
		}
	}
}

class Translater{
	constructor(objects, translation){
		this.objects = objects;
		this.translation = translation;
		this.m = new THREE.Matrix4();
		this.total_translate = 0;
		//console.log("to translate: ", translation.z);
	}

	transform(total, delta){
		this.total_translate += this.translation.z * delta;
		//console.log("translating: ", delta, this.total_translate);
		this.m.makeTranslation(this.translation.x * delta, this.translation.y * delta, this.translation.z * delta);
		for (var obj of this.objects){
			obj.applyMatrix(this.m);
		}
	}
}

class Rotater{
	constructor(objects, origin, axis, angle){
		this.objects = objects;
		this.origin = origin;
		this.axis = axis;
		this.angle = angle;
		this.m = new THREE.Matrix4();
	}

	transform(total, delta){
		if (this.origin.x != 0 || this.origin.y != 0 || this.origin.z != 0){
			this.m = Transform(this.origin, this.axis, this.angle * delta);
		}else{
			this.m.makeRotationAxis(this.axis, this.angle * delta);
		}
		for (var obj of this.objects){
			obj.applyMatrix(this.m);
		}
	}
}
