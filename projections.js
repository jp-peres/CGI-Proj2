var gl;

// Old program vars
var instances = [];
var nInstances = 0;

// Slider vars
var gammaSlider, thetaSlider, lSlider, alphaSlider, dSlider;
// Radio button vars
var ortRadio1, ortRadio2, ortRadio3, axoRadio1, axoRadio2, axoRadio3, axoRadio4, oblRadio1, oblRadio2, oblRadio3, perspective;
// Container paragraphs (to hide sliders)
var gammaContainer, thetaContainer, lContainer, alphaContainer;
// Current selected primitive
var currentSelectedPrimitive;
// Uniform location vars
var uProj, uModel, uView;
// BackFace culling and zBuffer flags
var zBufferEnabled, faceCullingEnabled;

// mView var
var mView;
// mProjection var
var mProjection;
// Zoom Scale mat
var mZScale;
// Array with all the draw primitives wired and filled (cube, sphere, bunny, etc)
var primitives = [];
// Index of the selected primitive at the moment
var currentPrimitiveIndex = 0;
// Total number of object primitives
var nrOfPrimitives = 5;
// Wireframe on = true or Filled = false
var wiredOn;
var canvas;
var program;

window.onresize = function () {
    generateViewPort();
}

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }
    generateEventListeners();
    initializeObjects();
    fillArrayPrimitives();
    generateViewPort();
    initialProgramState();

    gl.clearColor(0.39, 0.39, 0.39, 1.0);
    // Load shaders and initialize attribute buffers
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    uModel = gl.getUniformLocation(program, "mModel");

    uProj = gl.getUniformLocation(program, "mProjection");

    uView = gl.getUniformLocation(program, "mView");
    
    mZScale = mat4();

    render();
}

function initialProgramState() {
    document.getElementById("bt2").click();
    document.getElementById("axoRadio2").click();
    faceCullingEnabled = false;
    zBufferEnabled = false;
    wiredOn = true;
    currentSelectedPrimitive = primitives[currentPrimitiveIndex].w;
    instances.push({ t: mat4(), p: currentSelectedPrimitive });
    nInstances++;
}

function generateEventListeners() {
    ortRadio1 = document.getElementById("ortRadio1");
    ortRadio2 = document.getElementById("ortRadio2");
    ortRadio3 = document.getElementById("ortRadio3");
    axoRadio1 = document.getElementById("axoRadio1");
    axoRadio2 = document.getElementById("axoRadio2");
    axoRadio3 = document.getElementById("axoRadio3");
    axoRadio4 = document.getElementById("axoRadio4");
    oblRadio1 = document.getElementById("oblRadio1");
    oblRadio2 = document.getElementById("oblRadio2");
    oblRadio3 = document.getElementById("oblRadio3");
    perspective = document.getElementById("bt4");
    gammaContainer = document.getElementById("gammaContainer");
    thetaContainer = document.getElementById("thetaContainer");
    alphaContainer = document.getElementById("alphaContainer");
    lContainer = document.getElementById("lContainer");
    gammaSlider = document.getElementById("gammaSlider");
    thetaSlider = document.getElementById("thetaSlider");
    lSlider = document.getElementById("lSlider");
    alphaSlider = document.getElementById("alphaSlider");
    dSlider = document.getElementById("dSlider");
    addEventListener("keypress", keyPressed);
    thetaSlider.addEventListener("input", gammaThetaChanged);
    gammaSlider.addEventListener("input", gammaThetaChanged);
    alphaSlider.addEventListener("input", alphaLChanged);
    lSlider.addEventListener("input", alphaLChanged);
    dSlider.addEventListener("input", dChanged);
    ortRadio1.addEventListener("click", radioClicked);
    ortRadio2.addEventListener("click", radioClicked);
    ortRadio3.addEventListener("click", radioClicked);
    axoRadio1.addEventListener("click", radioClicked);
    axoRadio2.addEventListener("click", radioClicked);
    axoRadio3.addEventListener("click", radioClicked);
    axoRadio4.addEventListener("click", radioClicked);
    oblRadio1.addEventListener("click", radioClicked);
    oblRadio2.addEventListener("click", radioClicked);
    oblRadio3.addEventListener("click", radioClicked);
    perspective.addEventListener("click",radioClicked);
    canvas.addEventListener("wheel",mouseWheel);
}

function generateViewPort() {
    var height = window.innerHeight;
    var width = window.innerWidth;
    var s = Math.min(width, height / 2);
    var aRatio = width / height;
    if (s == width) {
        mProjection = ortho(-2, 2, -1 * aRatio, 1 * aRatio, -10, 10);
    }
    else {
        mProjection = ortho(-2 * aRatio, 2 * aRatio, -1, 1, -10, 10);
    }
    canvas.width = width;
    canvas.height = height / 2;
    gl.viewport(0, 0, width, height / 2);
}

function initializeObjects() {
    cubeInit(gl);
    sphereInit(gl);
    bunnyInit(gl);
    torusInit(gl);
    cylinderInit(gl);
    //superQuadInit(gl);
}

function fillArrayPrimitives() {
    primitives.push({ w: cubeDrawWireFrame, f: cubeDrawFilled });
    primitives.push({ w: sphereDrawWireFrame, f: sphereDrawFilled });
    primitives.push({ w: cylinderDrawWireFrame, f: cylinderDrawFilled });
    primitives.push({ w: torusDrawWireFrame, f: torusDrawFilled });
    primitives.push({ w: bunnyDrawWireFrame, f: bunnyDrawFilled });
    //primitives.push({ w: superQuadDrawWireFrame, f: superQuadDrawFilled});
}

function radioClicked(evt) {
    switch (evt.target.id) {
        //Ortogonal
        case "ortRadio1": //Principal
        case "ortRadio2": //Right Side
        case "ortRadio3": //Plant
            ortogonalViews(evt.target.value); 
            break; 
        //Axonometric
        case "axoRadio1": //Isometric
        case "axoRadio2": //Dimetric
        case "axoRadio3": //Trimetric
        case "axoRadio4": //Free
            axonometricViews(evt.target.value);
            break;
        //Oblique:
        case "oblRadio1"://Cavalier
        case "oblRadio2"://Cabinet
        case "oblRadio3": //Free --- TODO alpha not working properly?
            obliqueViews(evt.target.value);
            break;
        //Perspective:
        case "bt4":
            mView = perspectiveView(1.5);
            // readjusting with current zoom Not working
            // mView = mult(mView, mZScale);
            break;
    }
}

//Ortogonal:
function ortogonalViews(op) {
    var auxView = mat4();
    auxView[2][2] = 0;
    switch (op) {
        case "principal":
            break;
        case "rightside":
            auxView[0][0] = 0;
            auxView[0][2] = -1;
            break;
        case "plant":
            auxView[1][1] = 0;
            auxView[1][2] = -1;
            break;
    }
    mView = auxView;
    // readjusting with current zoom Not working
    // mView = mult(mView,mZScale);
}

//Axonometric:
function axonometricViews(op) {
    if (op != "freeA") {
        gammaContainer.style.display = "none";
        thetaContainer.style.display = "none";
    }
    switch (op) {
        case "isometric":
            setmViewAxonometric(30, 30);
            break;
        case "dimetric":
            setmViewAxonometric(42, 7);
            break;
        case "trimetric":
            var angleA = 54 + (16 / 60);
            var angleB = 23 + (16 / 60);
            setmViewAxonometric(angleA, angleB);
            break;
        case "freeA":
            gammaContainer.style.display = "table";
            thetaContainer.style.display = "table";
            gammaThetaChanged();
            break;
    }
    // readjusting with current zoom Not working
    // mView = mult(mView, mZScale);
}


//
// Auxialiary axonometric funcs
//
function degrees(radianVal) {
    return radianVal * 180 / Math.PI;
}

function getTheta(angleA, angleB) {
    var radianA = radians(angleA);
    var radianB = radians(angleB);
    var num = (Math.atan(Math.sqrt(Math.tan(radianA) / Math.tan(radianB))) - (Math.PI / 2));
    var theta = degrees(num);
    return theta;
}

function getGamma(angleA, angleB) {
    var radianA = radians(angleA);
    var radianB = radians(angleB);
    var aux = Math.asin(Math.sqrt(Math.tan(radianA) * Math.tan(radianB)));
    var gamma = degrees(aux);
    return gamma;
}

function setmViewAxonometric(angleA, angleB) {
    var auxView = mat4();
    var theta = getTheta(angleA, angleB);
    var gamma = getGamma(angleA, angleB);
    mView = mult(auxView, mult(rotateX(gamma), rotateY(theta)));
}

// EventListener for sliders
function gammaThetaChanged() {
    var auxView = mat4();
    var currGamma = Number(gammaSlider.value);
    var currTheta = Number(thetaSlider.value);
    mView = mult(auxView, mult(rotateX(currGamma), rotateY(currTheta)));
}

//Oblique:
function obliqueViews(op) {
    if (op != "freeO") {
        alphaContainer.style.display = "none";
        lContainer.style.display = "none";
    }
    switch (op) {
        case "cavalier":
            mView = mObl(1, 45);
            break;
        case "cabinet":
            mView = mObl(0.5, 45);
            break;
        case "freeO": // TODO: needs fix on alpha?
            alphaContainer.style.display = "table";
            lContainer.style.display = "table";
            alphaLChanged();
            break;
    }
    // readjusting with current zoom Not working
    // mView = mult(mView, mZScale);
}

function alphaLChanged() {
    var currL = Number(lSlider.value);
    var currAlpha = Number(alphaSlider.value);
    mView = mObl(currL, currAlpha);
}

function mObl(l, alpha) {
    var auxView = mat4();
    
    auxView[0][2] = -l * Math.cos(alpha * Math.PI / 180);
    auxView[1][2] = -l * Math.cos(alpha * Math.PI / 180);
    
    return auxView;
}

function perspectiveView(d){ 
    var auxView = mat4();

    if(d == 1){
        auxView[3][2] = -1;
    }
    else if(d == 0){
        auxView[3][2] = -1;
    }
    else{
        auxView[3][2]= -1/d;
    }
    
    return auxView;
}

function dChanged(){
    var d = Number(dSlider.value);
    mView = perspectiveView(d);
}

function showTab(evt, op) {
    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabops");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    var currentTabOps = document.getElementById(op);
    currentTabOps.style.display = "block";
    evt.currentTarget.className += " active";
    var isChecked = false;
    for (i = 0; i < currentTabOps.children.length; i++) {
        if (currentTabOps.children[i].checked) {
            currentTabOps.children[i].click();
            isChecked = true;
            break;
        }
    }
    if (!isChecked) {
        currentTabOps.children[0].checked = true;
        currentTabOps.children[0].click();
    }
}

function mouseWheel(ev) {
    var currentScale = currentScale + (ev.deltaY / 12500);
    mZScale = scalem(currentScale,currentScale,currentScale);
    mView = mult(mView, mZScale);
}

function keyPressed(ev) {
    switch (ev.key) {
        case "z":
            zBufferEnabled = !zBufferEnabled;
            zBufferEnabled ? gl.enable(gl.DEPTH_TEST) : gl.disable(gl.DEPTH_TEST);
            break;
        case "b":
            faceCullingEnabled = !faceCullingEnabled;
            faceCullingEnabled ? gl.enable(gl.CULL_FACE) : gl.disable(gl.CULL_FACE);
            break;
        case "w":
            wiredOn = true;
            instances[nInstances - 1].p = primitives[currentPrimitiveIndex].w;
            break;
        case "f":
            wiredOn = false;
            instances[nInstances - 1].p = primitives[currentPrimitiveIndex].f;
            break;
        case "a":
            currentPrimitiveIndex = currentPrimitiveIndex - 1 < 0 ? nrOfPrimitives - 1 : currentPrimitiveIndex - 1;
            instances[nInstances - 1].p = wiredOn ? primitives[currentPrimitiveIndex].w : primitives[currentPrimitiveIndex].f;
            break;
        case "d":
            currentPrimitiveIndex = ((currentPrimitiveIndex + 1) % nrOfPrimitives);
            instances[nInstances - 1].p = wiredOn ? primitives[currentPrimitiveIndex].w : primitives[currentPrimitiveIndex].f;
            break;
    }
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT || gl.DEPTH_BUFFER_BIT);
    //mProjection = perspective(10,canvas.width/canvas.height,1,100);
    gl.uniformMatrix4fv(uView, false, flatten(mView));
    gl.uniformMatrix4fv(uProj, false, flatten(mProjection));
    for (var i = 0; i < nInstances; i++) {
        gl.uniformMatrix4fv(uModel, false, flatten(instances[i].t));
        instances[i].p(gl, program);
    }
    requestAnimationFrame(render);
}
