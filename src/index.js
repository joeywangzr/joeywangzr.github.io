/*
TO DO: 
add reset button
controls (zoom pan rotate)
change speed
light/dark mode toggle
make text scale on screen size
if drag then not move
*/

// import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// THREEX.DOMEVENTS.JS

/** @namespace */
var THREEx		= THREEx 		|| {};

// # Constructor
THREEx.DomEvents	= function(camera, domElement)
{
	this._camera	= camera || null;
	this._domElement= domElement || document;
	this._raycaster = new THREE.Raycaster();
	this._selected	= null;
	this._boundObjs	= {};
	// Bind dom event for mouse and touch
	var _this	= this;

	this._$onClick		= function(){ _this._onClick.apply(_this, arguments);		};
	this._$onDblClick	= function(){ _this._onDblClick.apply(_this, arguments);	};
	this._$onMouseMove	= function(){ _this._onMouseMove.apply(_this, arguments);	};
	this._$onMouseDown	= function(){ _this._onMouseDown.apply(_this, arguments);	};
	this._$onMouseUp	= function(){ _this._onMouseUp.apply(_this, arguments);		};
	this._$onTouchMove	= function(){ _this._onTouchMove.apply(_this, arguments);	};
	this._$onTouchStart	= function(){ _this._onTouchStart.apply(_this, arguments);	};
	this._$onTouchEnd	= function(){ _this._onTouchEnd.apply(_this, arguments);	};
	this._$onContextmenu	= function(){ _this._onContextmenu.apply(_this, arguments);	};
	this._domElement.addEventListener( 'click'	, this._$onClick	, false );
	this._domElement.addEventListener( 'dblclick'	, this._$onDblClick	, false );
	this._domElement.addEventListener( 'mousemove'	, this._$onMouseMove	, false );
	this._domElement.addEventListener( 'mousedown'	, this._$onMouseDown	, false );
	this._domElement.addEventListener( 'mouseup'	, this._$onMouseUp	, false );
	this._domElement.addEventListener( 'touchmove'	, this._$onTouchMove	, false );
	this._domElement.addEventListener( 'touchstart'	, this._$onTouchStart	, false );
	this._domElement.addEventListener( 'touchend'	, this._$onTouchEnd	, false );
	this._domElement.addEventListener( 'contextmenu', this._$onContextmenu	, false );
	
}

// # Destructor
THREEx.DomEvents.prototype.destroy	= function()
{
	// unBind dom event for mouse and touch
	this._domElement.removeEventListener( 'click'		, this._$onClick	, false );
	this._domElement.removeEventListener( 'dblclick'	, this._$onDblClick	, false );
	this._domElement.removeEventListener( 'mousemove'	, this._$onMouseMove	, false );
	this._domElement.removeEventListener( 'mousedown'	, this._$onMouseDown	, false );
	this._domElement.removeEventListener( 'mouseup'		, this._$onMouseUp	, false );
	this._domElement.removeEventListener( 'touchmove'	, this._$onTouchMove	, false );
	this._domElement.removeEventListener( 'touchstart'	, this._$onTouchStart	, false );
	this._domElement.removeEventListener( 'touchend'	, this._$onTouchEnd	, false );
	this._domElement.removeEventListener( 'contextmenu'	, this._$onContextmenu	, false );
}

THREEx.DomEvents.eventNames	= [
	"click",
	"dblclick",
	"mouseover",
	"mouseout",
	"mousemove",
	"mousedown",
	"mouseup",
	"contextmenu",
	"touchstart",
	"touchend"
];

THREEx.DomEvents.prototype._getRelativeMouseXY	= function(domEvent){
	var element = domEvent.target || domEvent.srcElement;
	if (element.nodeType === 3) {
		element = element.parentNode; // Safari fix -- see http://www.quirksmode.org/js/events_properties.html
	}
	
	//get the real position of an element relative to the page starting point (0, 0)
	//credits go to brainjam on answering http://stackoverflow.com/questions/5755312/getting-mouse-position-relative-to-content-area-of-an-element
	var elPosition	= { x : 0 , y : 0};
	var tmpElement	= element;
	//store padding
	var style	= getComputedStyle(tmpElement, null);
	elPosition.y += parseInt(style.getPropertyValue("padding-top"), 10);
	elPosition.x += parseInt(style.getPropertyValue("padding-left"), 10);
	//add positions
	do {
		elPosition.x	+= tmpElement.offsetLeft;
		elPosition.y	+= tmpElement.offsetTop;
		style		= getComputedStyle(tmpElement, null);

		elPosition.x	+= parseInt(style.getPropertyValue("border-left-width"), 10);
		elPosition.y	+= parseInt(style.getPropertyValue("border-top-width"), 10);
	} while(tmpElement = tmpElement.offsetParent);
	
	var elDimension	= {
		width	: (element === window) ? window.innerWidth	: element.offsetWidth,
		height	: (element === window) ? window.innerHeight	: element.offsetHeight
	};
	
	return {
		x : +((domEvent.pageX - elPosition.x) / elDimension.width ) * 2 - 1,
		y : -((domEvent.pageY - elPosition.y) / elDimension.height) * 2 + 1
	};
};


/********************************************************************************/
/*		domevent context						*/
/********************************************************************************/

// handle domevent context in object3d instance

THREEx.DomEvents.prototype._objectCtxInit	= function(object3d){
	object3d._3xDomEvent = {};
}
THREEx.DomEvents.prototype._objectCtxDeinit	= function(object3d){
	delete object3d._3xDomEvent;
}
THREEx.DomEvents.prototype._objectCtxIsInit	= function(object3d){
	return object3d._3xDomEvent ? true : false;
}
THREEx.DomEvents.prototype._objectCtxGet		= function(object3d){
	return object3d._3xDomEvent;
}

/********************************************************************************/
/*										*/
/********************************************************************************/

/**
 * Getter/Setter for camera
*/
THREEx.DomEvents.prototype.camera	= function(value)
{
	if( value )	this._camera	= value;
	return this._camera;
}

THREEx.DomEvents.prototype.bind	= function(object3d, eventName, callback, useCapture)
{
	console.assert( THREEx.DomEvents.eventNames.indexOf(eventName) !== -1, "not available events:"+eventName );

	if( !this._objectCtxIsInit(object3d) )	this._objectCtxInit(object3d);
	var objectCtx	= this._objectCtxGet(object3d);	
	if( !objectCtx[eventName+'Handlers'] )	objectCtx[eventName+'Handlers']	= [];

	objectCtx[eventName+'Handlers'].push({
		callback	: callback,
		useCapture	: useCapture
	});
	
	// add this object in this._boundObjs
	if( this._boundObjs[eventName] === undefined ){
		this._boundObjs[eventName]	= [];	
	}
	this._boundObjs[eventName].push(object3d);
}
THREEx.DomEvents.prototype.addEventListener	= THREEx.DomEvents.prototype.bind

THREEx.DomEvents.prototype.unbind	= function(object3d, eventName, callback, useCapture)
{
	console.assert( THREEx.DomEvents.eventNames.indexOf(eventName) !== -1, "not available events:"+eventName );

	if( !this._objectCtxIsInit(object3d) )	this._objectCtxInit(object3d);

	var objectCtx	= this._objectCtxGet(object3d);
	if( !objectCtx[eventName+'Handlers'] )	objectCtx[eventName+'Handlers']	= [];

	var handlers	= objectCtx[eventName+'Handlers'];
	for(var i = 0; i < handlers.length; i++){
		var handler	= handlers[i];
		if( callback != handler.callback )	continue;
		if( useCapture != handler.useCapture )	continue;
		handlers.splice(i, 1)
		break;
	}
	// from this object from this._boundObjs
	var index	= this._boundObjs[eventName].indexOf(object3d);
	console.assert( index !== -1 );
	this._boundObjs[eventName].splice(index, 1);
}
THREEx.DomEvents.prototype.removeEventListener	= THREEx.DomEvents.prototype.unbind

THREEx.DomEvents.prototype._bound	= function(eventName, object3d)
{
	var objectCtx	= this._objectCtxGet(object3d);
	if( !objectCtx )	return false;
	return objectCtx[eventName+'Handlers'] ? true : false;
}

/********************************************************************************/
/*		onMove								*/
/********************************************************************************/

// # handle mousemove kind of events

THREEx.DomEvents.prototype._onMove	= function(eventName, mouseX, mouseY, origDomEvent)
{
//console.log('eventName', eventName, 'boundObjs', this._boundObjs[eventName])
	// get objects bound to this event
	var boundObjs	= this._boundObjs[eventName];
	if( boundObjs === undefined || boundObjs.length === 0 )	return;
	// compute the intersection
	var vector = new THREE.Vector2();

	// update the picking ray with the camera and mouse position
	vector.set( mouseX, mouseY );
	this._raycaster.setFromCamera( vector, this._camera );	

	var intersects = this._raycaster.intersectObjects( boundObjs );

	var oldSelected	= this._selected;
	
	if( intersects.length > 0 ){
		var notifyOver, notifyOut, notifyMove;
		var intersect	= intersects[ 0 ];
		var newSelected	= intersect.object;
		this._selected	= newSelected;
		// if newSelected bound mousemove, notify it
		notifyMove	= this._bound('mousemove', newSelected);

		if( oldSelected != newSelected ){
			// if newSelected bound mouseenter, notify it
			notifyOver	= this._bound('mouseover', newSelected);
			// if there is a oldSelect and oldSelected bound mouseleave, notify it
			notifyOut	= oldSelected && this._bound('mouseout', oldSelected);
		}
	}else{
		// if there is a oldSelect and oldSelected bound mouseleave, notify it
		notifyOut	= oldSelected && this._bound('mouseout', oldSelected);
		this._selected	= null;
	}


	// notify mouseMove - done at the end with a copy of the list to allow callback to remove handlers
	notifyMove && this._notify('mousemove', newSelected, origDomEvent, intersect);
	// notify mouseEnter - done at the end with a copy of the list to allow callback to remove handlers
	notifyOver && this._notify('mouseover', newSelected, origDomEvent, intersect);
	// notify mouseLeave - done at the end with a copy of the list to allow callback to remove handlers
	notifyOut  && this._notify('mouseout' , oldSelected, origDomEvent, intersect);
}


/********************************************************************************/
/*		onEvent								*/
/********************************************************************************/

// # handle click kind of events

THREEx.DomEvents.prototype._onEvent	= function(eventName, mouseX, mouseY, origDomEvent)
{
	//console.log('eventName', eventName, 'boundObjs', this._boundObjs[eventName])
	// get objects bound to this event
	var boundObjs	= this._boundObjs[eventName];
	if( boundObjs === undefined || boundObjs.length === 0 )	return;
	// compute the intersection
	var vector = new THREE.Vector2();

	// update the picking ray with the camera and mouse position
	vector.set( mouseX, mouseY );
	this._raycaster.setFromCamera( vector, this._camera );	

	var intersects = this._raycaster.intersectObjects( boundObjs, true);
	// if there are no intersections, return now
	if( intersects.length === 0 )	return;

	// init some variables
	var intersect	= intersects[0];
	var object3d	= intersect.object;
	var objectCtx	= this._objectCtxGet(object3d);
	var objectParent = object3d.parent;

	while ( typeof(objectCtx) == 'undefined' && objectParent )
	{
	    objectCtx = this._objectCtxGet(objectParent);
	    objectParent = objectParent.parent;
	}
	if( !objectCtx )	return;

	// notify handlers
	this._notify(eventName, object3d, origDomEvent, intersect);
}

THREEx.DomEvents.prototype._notify	= function(eventName, object3d, origDomEvent, intersect)
{
	var objectCtx	= this._objectCtxGet(object3d);
	var handlers	= objectCtx ? objectCtx[eventName+'Handlers'] : null;
	
	// parameter check
	console.assert(arguments.length === 4)

	// do bubbling
	if( !objectCtx || !handlers || handlers.length === 0 ){
		object3d.parent && this._notify(eventName, object3d.parent, origDomEvent, intersect);
		return;
	}
	
	// notify all handlers
	var handlers	= objectCtx[eventName+'Handlers'];
	for(var i = 0; i < handlers.length; i++){
		var handler	= handlers[i];
		var toPropagate	= true;
		handler.callback({
			type		: eventName,
			target		: object3d,
			origDomEvent	: origDomEvent,
			intersect	: intersect,
			stopPropagation	: function(){
				toPropagate	= false;
			}
		});
		if( !toPropagate )	continue;
		// do bubbling
		if( handler.useCapture === false ){
			object3d.parent && this._notify(eventName, object3d.parent, origDomEvent, intersect);
		}
	}
}

/********************************************************************************/
/*		handle mouse events						*/
/********************************************************************************/
// # handle mouse events

THREEx.DomEvents.prototype._onMouseDown	= function(event){ return this._onMouseEvent('mousedown', event);	}
THREEx.DomEvents.prototype._onMouseUp	= function(event){ return this._onMouseEvent('mouseup'	, event);	}


THREEx.DomEvents.prototype._onMouseEvent	= function(eventName, domEvent)
{
	var mouseCoords = this._getRelativeMouseXY(domEvent);
	this._onEvent(eventName, mouseCoords.x, mouseCoords.y, domEvent);
}

THREEx.DomEvents.prototype._onMouseMove	= function(domEvent)
{
	var mouseCoords = this._getRelativeMouseXY(domEvent);
	this._onMove('mousemove', mouseCoords.x, mouseCoords.y, domEvent);
	this._onMove('mouseover', mouseCoords.x, mouseCoords.y, domEvent);
	this._onMove('mouseout' , mouseCoords.x, mouseCoords.y, domEvent);
}

THREEx.DomEvents.prototype._onClick		= function(event)
{
	// TODO handle touch ?
	this._onMouseEvent('click'	, event);
}
THREEx.DomEvents.prototype._onDblClick		= function(event)
{
	// TODO handle touch ?
	this._onMouseEvent('dblclick'	, event);
}

THREEx.DomEvents.prototype._onContextmenu	= function(event)
{
	//TODO don't have a clue about how this should work with touch..
	this._onMouseEvent('contextmenu'	, event);
}

/********************************************************************************/
/*		handle touch events						*/
/********************************************************************************/
// # handle touch events


THREEx.DomEvents.prototype._onTouchStart	= function(event){ return this._onTouchEvent('touchstart', event);	}
THREEx.DomEvents.prototype._onTouchEnd	= function(event){ return this._onTouchEvent('touchend'	, event);	}

THREEx.DomEvents.prototype._onTouchMove	= function(domEvent)
{
	if( domEvent.touches.length != 1 )	return undefined;

	domEvent.preventDefault();

	var mouseX	= +(domEvent.touches[ 0 ].pageX / window.innerWidth ) * 2 - 1;
	var mouseY	= -(domEvent.touches[ 0 ].pageY / window.innerHeight) * 2 + 1;
	this._onMove('mousemove', mouseX, mouseY, domEvent);
	this._onMove('mouseover', mouseX, mouseY, domEvent);
	this._onMove('mouseout' , mouseX, mouseY, domEvent);
}

THREEx.DomEvents.prototype._onTouchEvent	= function(eventName, domEvent)
{
	if( domEvent.touches.length != 1 )	return undefined;

	domEvent.preventDefault();

	var mouseX	= +(domEvent.touches[ 0 ].pageX / window.innerWidth ) * 2 - 1;
	var mouseY	= -(domEvent.touches[ 0 ].pageY / window.innerHeight) * 2 + 1;
	this._onEvent(eventName, mouseX, mouseY, domEvent);	
}

// MY CODE STARTS HERE
var addIco = false;
var displayText = false;
var mouseLeave = true;
var mouseOver = false;
var mouseOverShape = false;
// Check mouse
var mouseDown = false;
document.body.onmousedown = function() { 
  mouseDown = true;
}
document.body.onmouseup = function() {
  mouseDown = false;
}

// Controls
const scene = new THREE.Scene();
// const texture = new THREE.TextureLoader().load('images/sky.jpg');
// scene.background = texture;

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
// const camera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 1, 1000 );
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
}); 

renderer.setClearColor( 0x000000, 0 ); 
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
camera.position.setZ(25);

const controls = new OrbitControls(camera, renderer.domElement);

controls.enableZoom = false;
controls.enablePan = false;

// Textures
const githubTexture = new THREE.TextureLoader().load('images/github_logo.png');
const youtubeTexture = new THREE.TextureLoader().load('images/youtube.png');
const linkedinTexture = new THREE.TextureLoader().load('images/linkedin.png');
const devpostTexture = new THREE.TextureLoader().load('images/devpost.jpg');
const profileTexture = new THREE.TextureLoader().load('images/profile.jpg');
const projectsTexture = new THREE.TextureLoader().load('images/projects.jpg');
const faceTexture = new THREE.TextureLoader().load('images/pfp.jpg');

// Create Octahedron
var geometry = new THREE.OctahedronGeometry( 7.5 , 0 );
const material = new THREE.MeshNormalMaterial( { wireframe: true, wireframeLinewidth: 5 } );
const octa = new THREE.Mesh( geometry, material );

material.transparent = true;
material.opacity = 0.6;

var icoGeometry = new THREE.SphereGeometry( 4 );
const icoMaterial = new THREE.MeshBasicMaterial( { map: faceTexture } );
const ico = new THREE.Mesh( icoGeometry, icoMaterial );

// Add light
// const pointLight = new THREE.PointLight(0xffffff);
// pointLight.position.set(30,30,30);
// const pointLight2 = new THREE.PointLight(0xffffff);
// pointLight2.position.set(-30,-30,-30);
// scene.add(pointLight, pointLight2);

// Create Cubes
var cubeGeometry = new THREE.BoxGeometry( 1.2, 1.2, 1.2 );
const cubeMaterialA = new THREE.MeshBasicMaterial( { map: githubTexture, name: 'github' } );
const cubeMaterialB = new THREE.MeshBasicMaterial( { map: linkedinTexture, name: 'linkedin' } );
const cubeMaterialC = new THREE.MeshBasicMaterial( { map: youtubeTexture, name: 'youtube' } );
const cubeMaterialD = new THREE.MeshBasicMaterial( { map: devpostTexture, name: 'devpost' } );
const cubeMaterialE = new THREE.MeshBasicMaterial( { map: profileTexture, name: 'resume' } );
const cubeMaterialF = new THREE.MeshBasicMaterial( { map: projectsTexture, name: 'projects' } );

const cubeA = new THREE.Mesh( cubeGeometry, cubeMaterialA );
const cubeB = new THREE.Mesh( cubeGeometry, cubeMaterialB );
const cubeC = new THREE.Mesh( cubeGeometry, cubeMaterialC );
const cubeD = new THREE.Mesh( cubeGeometry, cubeMaterialD );
const cubeE = new THREE.Mesh( cubeGeometry, cubeMaterialE );
const cubeF = new THREE.Mesh( cubeGeometry, cubeMaterialF );

cubeA.position.set( 7.5, 0, 0 );
cubeB.position.set( 0, 7.5, 0 );
cubeC.position.set( 0, 0, 7.5 );
cubeD.position.set( 0, 0, -7.5 );
cubeE.position.set( 0, -7.5, 0 );
cubeF.position.set( -7.5, 0, 0 );

// Group together, add to scene
const group = new THREE.Group();
group.add( cubeA, cubeB, cubeC, cubeD, cubeE, cubeF );
const octaShape = new THREE.Group();
octaShape.add(octa)
// const group2 = new THREE.Group();
// group2.add( sphereA, sphereB, sphereC, sphereD, sphereE, sphereF );
scene.add( group, octaShape );

// Check resize
function onWindowResize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth-8, window.innerHeight );
}

// Hover
var mouse = new THREE.Vector2();
var raycaster = new THREE.Raycaster();

// set at random position so it doesn't spam and think its somewhere else

function onMouseMove( event ) {
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

function reset() {
	for (let i = 0; i < group.children.length; i++) {
		if (group.children[i].material) {
			mouseOver = false;
			group.children[i].material.opacity = 1.0;
			document.getElementById("social").innerHTML = '';
		}
	}
}

function hover() {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(group.children);
    for (let i = 0; i < intersects.length; i++) {
        mouseOver = true;
        intersects[i].object.material.transparent = true;
        intersects[i].object.material.opacity = 0.6;
		if (displayText == true) {
        	document.getElementById("social").innerHTML = intersects[i].object.material.name;
		}
		else {
			document.getElementById("social").innerHTML = '';
		}
    }
}

function reset_all() {
	for (let i = 0; i < octaShape.children.length; i++) {
		mouseOverShape = false;
	}
}

function animate() {
    requestAnimationFrame( animate );
    reset();
    hover();
	console.log(mouseLeave);
    // reset_all();
    // hover_all();
    if ((!mouseDown && !mouseOver) || mouseLeave) {
        group.rotation.x += 0.001;
        group.rotation.y += 0.001;
        group.rotation.z += 0.001;
        octaShape.rotation.x += 0.001;
        octaShape.rotation.y += 0.001;
        octaShape.rotation.z += 0.001;
    }
    ico.rotation.x -= 0.01;
    ico.rotation.y -= 0.01;
    ico.rotation.z -= 0.01;

    controls.update();
    renderer.render( scene, camera );
}

// Links
const domEvents = new THREEx.DomEvents(camera, renderer.domElement)
domEvents.addEventListener(cubeA, 'click', event => {
    window.open('https://github.com/joeywangzr');
})
domEvents.addEventListener(cubeB, 'click', event => {
    window.open('https://www.linkedin.com/in/joeywangzr/');
})
domEvents.addEventListener(cubeC, 'click', event => {
    window.open('https://www.youtube.com/channel/UCmzdG-IAfxvSOTScwSE6D9w');
})
domEvents.addEventListener(cubeD, 'click', event => {
    window.open('https://devpost.com/joeywangzr');
})
domEvents.addEventListener(cubeE, 'click', event => {
    window.open('https://www.joeywang.ca/resume.pdf');
})
domEvents.addEventListener(cubeF, 'click', event => {
    document.getElementById('projects-page').scrollIntoView();
})

// Text beside cursor
document.body.onmousemove=moveCursor;
var curTxt=document.createElement('div');
curTxt.id="social";
document.body.appendChild(curTxt);
var curTxtLen=[curTxt.offsetWidth, curTxt.offsetHeight];
function moveCursor(e){
    if(!e){e=window.event;}
    curTxt.style.left=e.clientX-curTxtLen[0]+'px';
    curTxt.style.top=e.clientY-curTxtLen[1]+'px';
}

// setTimeout(remove, 5000)

function remove() {
    document.getElementById("fade").innerHTML = '';
}

function updateTime() {
	raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(octaShape.children);
    for (let i = 0; i < intersects.length; i++) {
		mouseOverShape = true;
	}
	displayText = true;
	mouseLeave = false;
	if (mouseOverShape == true) {
		mouseLeave = false;
		reset_all()
	}
}

function updateMouse() {
	if (mouseLeave == true) {
		mouseLeave = false;
	}
}

window.addEventListener( 'resize', onWindowResize, false );
window.addEventListener( 'mousemove', onMouseMove, false );
document.documentElement.addEventListener('mouseleave', function() {
	// console.log('out'); 
	mouseLeave = true;
})
document.documentElement.addEventListener('mouseenter', function() {
	// console.log('in'); 
	mouseLeave = false;
})

// animateText()
setTimeout(updateTime, 1700)
animate()

document.getElementById("easteregg").onclick = function() {
    if (addIco == false) {
		addIco = true;
		scene.add(ico);
	}
	else {
		addIco = false;
		scene.remove(ico);
	}
}