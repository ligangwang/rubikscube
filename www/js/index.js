/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    }
};

app.initialize();


var cubeElement = document.getElementById("cube");
var cubeConsole = new CubeConsole(SINGMASTER_SOLVED_STATE, cubeElement);
cubeConsole.render();
//cubeConsole.input_char("O");
document.addEventListener( 'keypress', onDocumentKeyPress, false );
document.addEventListener( 'keydown', onDocumentKeyDown, false );
cubeConsole.renderer.domElement.addEventListener('mousedown', onMouseDown, false);
cubeConsole.renderer.domElement.addEventListener('mousemove', onMouseMove, false);
cubeConsole.renderer.domElement.addEventListener('mouseup', onMouseUp, false);
cubeConsole.renderer.domElement.addEventListener('touchstart', onTouchStart, false);
cubeConsole.renderer.domElement.addEventListener('touchmove', onTouchMove, false);
cubeConsole.renderer.domElement.addEventListener('touchend', onTouchEnd, false);


function onMouseUp(event){
	cubeConsole.interactive.onMouseUp(event);
}

function onMouseMove(event){
	cubeConsole.interactive.onMouseMove(event);
}

function onMouseDown(event){
	cubeConsole.interactive.onMouseDown(event);
}
function onTouchStart(event){
	cubeConsole.interactive.onTouchStart(event);
}

function onTouchMove(event){
	cubeConsole.interactive.onTouchMove(event);
}

function onTouchEnd(event){
	cubeConsole.interactive.onTouchEnd(event);
}

function onDocumentKeyDown( event ) {
	var keyCode = event.keyCode;
	if ( keyCode == 8 ) {
		//event.preventDefault();
		cubeConsole.deleteChar();
		//console.log("deleting");
		//return false;
	}
}

function onDocumentKeyPress ( event ) {
	var keyCode = event.which;
	if ( keyCode == 8 ) {

		//event.preventDefault();
	} else if (document.activeElement.nodeName == "BODY"){
		var ch = String.fromCharCode( keyCode );
		if(ch.toUpperCase()=="V"){
			onBottomUpSolver();
		}else
			cubeConsole.inputChar(ch);
	}
}

function onCommand(op){
	cubeConsole.cube.command(op);
}

function onChangeTransparent(value){
	var opacity = (100-value)/100;
	cubeConsole.cube.setOpacity(opacity);
}

function onBottomUpSolver(){
	cubeConsole.cube.setIsInSolverMode(true);
	var solver = new BottomupSolver(cubeConsole.cube.getState());
	solver.solve().forEach(op=>cubeConsole.cube.command(op));
}

function setInitialPosition(){
	var initState = document.getElementById("initPosition").value;
	if (!isValidCubeState(initState)){
		document.getElementById("initPosition").select();
		document.getElementById("message").innerText = "invalid state !";
		return;
	}else{
		document.getElementById("message").innerText = "";
		cubeConsole.cube.setCubeState(initState);
	}
}
