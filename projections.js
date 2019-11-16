/*
 *
 * Trabalho realizado por:
 * 
 * Sara Trafaria Nº 41693
 * João Peres Nº 48320
 *
 */

/*
 * Webgl vars
 */
var gl;
var canvas;
var program;
var instances = [];
var nInstances = 0;


/*
 * User interface variables
 */
// Var used to change dashed to filled border when changing to superquadric
var mainBox;
// Vars used to change bculling and zbuffer text values
var zBuffVal, bcullingVal;
// Slider vars
var gammaSlider, thetaSlider, lSlider, alphaSlider, dSlider, e1Slider, e2Slider;
// Container paragraphs (to hide sliders)
var gammaContainer, thetaContainer, lContainer, alphaContainer, superOps;
// Vars used to change from each projection tab
var currentUsedTab;
var currentUsedTabOps;
// BackFace culling and zBuffer flags
var zBufferEnabled, faceCullingEnabled;
// filledOn = filledDraw,  !filledOn = wireFrameDraw
var filledOn;
// Area in percentage that the viewport occupies in the window
var viewportAreaPercent = 0.45;


/*
 * Projections vars
 */
// mView
var mView = mat4();
// mProjection
var mProjection;
// Array with all the draw primitives (cube, sphere, bunny, etc)
var primitives = [];
// Index of the selected primitive at the moment
var currentPrimitiveIndex = 0;
// Total number of object primitives 
var nrOfPrimitives = 6;
// Uniform location vars
var uProj, uModel, uView;
// Auxiliary var for zoomFactor
var countScale = 1;


window.onresize = function () {
    generateViewPort();
}

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    // Generate all event listeners
    generateEventListeners();
    // Initializes all objects
    initializeObjects();
    // Fills the array of draw primitives
    fillArrayPrimitives();
    // Generates the initial viewport
    generateViewPort();
    // Sets the initial state of the program
    initialProgramState();

    gl.clearColor(0.38, 0.38, 0.38, 1.0);
    // Load shaders and initialize attribute buffers
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    uModel = gl.getUniformLocation(program, "mModel");
    uProj = gl.getUniformLocation(program, "mProjection");
    uView = gl.getUniformLocation(program, "mView");

    render();
}

// Generates viewport according to windowsize and applies the current zoomFactor
// Used for resize eventlistener and zoom eventlistener.
function generateViewPort() {
    var height = window.innerHeight;
    var width = window.innerWidth;
    var zoomFactor = 1 * countScale;
    var s = Math.min(width, height * viewportAreaPercent);
    var aRatio = width / height;
    if (s == width) {
        mProjection = ortho(-2 / zoomFactor, 2 / zoomFactor, (-2 * viewportAreaPercent * aRatio) / zoomFactor, (2 * viewportAreaPercent * aRatio) / zoomFactor, -10, 10);
    }
    else {
        mProjection = ortho((-2 * aRatio) / zoomFactor, (2 * aRatio) / zoomFactor, (-2 * viewportAreaPercent) / zoomFactor, (2 * viewportAreaPercent) / zoomFactor, -10, 10);
    }
    canvas.width = document.body.clientWidth;
    canvas.height = height * viewportAreaPercent;
    gl.viewport(0, 0, width, height * viewportAreaPercent);
}

// Sets initial program state to Axonometric tab, and sets the initial projection as dimetric projection
// of the cube object with zbuffer off and backface culling off
function initialProgramState() {
    document.getElementById("bt2").click();
    document.getElementById("axoRadio2").click();
    faceCullingEnabled = false;
    zBufferEnabled = false;
    filledOn = false;
    instances.push({ t: mat4(), p:  primitives[currentPrimitiveIndex] });
    nInstances++;
}

function generateEventListeners() {
    // Get all html elements that will be needed
    gammaContainer = document.getElementById("gammaContainer");
    thetaContainer = document.getElementById("thetaContainer");
    alphaContainer = document.getElementById("alphaContainer");
    lContainer = document.getElementById("lContainer");
    gammaSlider = document.getElementById("gammaSlider");
    thetaSlider = document.getElementById("thetaSlider");
    lSlider = document.getElementById("lSlider");
    dSlider = document.getElementById("dSlider");
    alphaSlider = document.getElementById("alphaSlider");
    superOps = document.getElementById("superOps");
    e1Slider = document.getElementById("e1Slider");
    e2Slider = document.getElementById("e2Slider");
    mainBox = document.getElementById("mainBox");
    zbuffVal = document.getElementById("zbuffVal");
    bcullingVal = document.getElementById("bcullingVal");

    // Generate all event listeners needed
    addEventListener("keypress", keyPressed);
    canvas.addEventListener("wheel", mouseWheel);
    document.getElementById("ortRadio1").addEventListener("click", radioClicked);
    document.getElementById("ortRadio2").addEventListener("click", radioClicked);
    document.getElementById("ortRadio3").addEventListener("click", radioClicked);
    document.getElementById("axoRadio1").addEventListener("click", radioClicked);
    document.getElementById("axoRadio2").addEventListener("click", radioClicked);
    document.getElementById("axoRadio3").addEventListener("click", radioClicked);
    document.getElementById("axoRadio4").addEventListener("click", radioClicked);
    document.getElementById("oblRadio1").addEventListener("click", radioClicked);
    document.getElementById("oblRadio2").addEventListener("click", radioClicked);
    document.getElementById("oblRadio3").addEventListener("click", radioClicked);
    thetaSlider.addEventListener("input", gammaThetaChanged);
    gammaSlider.addEventListener("input", gammaThetaChanged);
    alphaSlider.addEventListener("input", alphaLChanged);
    lSlider.addEventListener("input", alphaLChanged);
    dSlider.addEventListener("input", dChanged);
    e1Slider.addEventListener("input", updateQuadric);
    e2Slider.addEventListener("input", updateQuadric);
}

// Initializes all objects
function initializeObjects() {
    cubeInit(gl);
    sphereInit(gl);
    bunnyInit(gl);
    torusInit(gl);
    cylinderInit(gl);
    superInit(gl, e1Slider.value, e2Slider.value);
}

// Eventlistener for superquadric 
// reinitializes superquadric object with new values
function updateQuadric() {
    superInit(gl, e1Slider.value, e2Slider.value);
}

// Fills the array of drawing primitives with
// each draw function of each object
function fillArrayPrimitives() {
    primitives.push(cubeDraw);
    primitives.push(sphereDraw);
    primitives.push(cylinderDraw);
    primitives.push(torusDraw);
    primitives.push(bunnyDraw);
    primitives.push(superDraw);
}

// Eventlistener for all radio buttons
function radioClicked(evt) {
    switch (evt.target.value) {
        case "principal":
        case "rightside":
        case "plant":
            ortogonalViews(evt.target.value);
            break;
        case "isometric":
        case "dimetric":
        case "trimetric":
        case "freeA":
            axonometricViews(evt.target.value);
            break;
        case "cavalier":
        case "cabinet":
        case "freeO":
            obliqueViews(evt.target.value);
            break;
        case "perspective":
            perspectiveView();
            break;
    }
}

//
// Ortogonal projection function
//
function ortogonalViews(op) {
    var auxView = mat4();
    auxView[2][2] = 0;
    switch (op) {
        case "principal":
            break;
        case "rightside":
            auxView = mult(auxView, rotateY(-90));
            break;
        case "plant":
            auxView = mult(auxView, rotateX(90));
            break;
    }
    mView = auxView;
}

//
// Axonometric projection related functions
//
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
            let angleA = 54 + (16 / 60);
            let angleB = 23 + (16 / 60);
            setmViewAxonometric(angleA, angleB);
            break;
        case "freeA":
            gammaContainer.style.display = "table";
            thetaContainer.style.display = "table";
            gammaThetaChanged();
            break;
    }
}

// Auxiliary function to convert radians to degrees
function degrees(radianVal) {
    return radianVal * 180 / Math.PI;
}

// Calculates theta with given A and B angles
function getTheta(angleA, angleB) {
    let radianA = radians(angleA);
    let radianB = radians(angleB);
    let num = (Math.atan(Math.sqrt(Math.tan(radianA) / Math.tan(radianB))) - (Math.PI / 2));
    let theta = degrees(num);
    return theta;
}

// Calculates game with given A and B angles
function getGamma(angleA, angleB) {
    let radianA = radians(angleA);
    let radianB = radians(angleB);
    let aux = Math.asin(Math.sqrt(Math.tan(radianA) * Math.tan(radianB)));
    let gamma = degrees(aux);
    return gamma;
}

// Calculates axonometric projection with angle A and B
function setmViewAxonometric(angleA, angleB) {
    let auxView = mat4();
    let theta = getTheta(angleA, angleB);
    let gamma = getGamma(angleA, angleB);
    mView = mult(auxView, mult(rotateX(gamma), rotateY(theta)));
}

// Eventlistener for gamma and theta sliders
// Calculates axonometric projection with given theta and gamma from sliders
function gammaThetaChanged() {
    let auxView = mat4();
    let currGamma = Number(gammaSlider.value);
    let currTheta = Number(thetaSlider.value);
    mView = mult(auxView, mult(rotateX(currGamma), rotateY(currTheta)));
}

//
// Oblique projection related function
//
function obliqueViews(op) {
    // Hides sliders if not free op
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
        case "freeO":
            alphaContainer.style.display = "table";
            lContainer.style.display = "table";
            alphaLChanged();
            break;
    }
}

// Calculates oblique projection
function mObl(l, alpha) {
    let auxView = mat4();

    auxView[0][2] = -l * Math.cos(radians(alpha));
    auxView[1][2] = -l * Math.sin(radians(alpha));

    return auxView;
}

// Eventlistener for oblique slider
// Calculates oblique projection with given l and alpha from sliders 
function alphaLChanged() {
    var currL = Number(lSlider.value);
    var currAlpha = Number(alphaSlider.value);
    mView = mObl(currL, currAlpha);
}

//
// Perspective projection related function
//
function perspectiveView() {
    let d = Number(dSlider.value);
    let auxView = mat4();
    auxView[3][2] = -1 / d;
    mView = auxView;
}

// Eventlistener for perspective slider
// Calculates perspective view with given d slider
function dChanged() {
    perspectiveView();
}

//
// Function to hide old tab contents and show the new selected tab contents 
//
function showProjectionTab(evt, op) {
    let i;
    let isChecked = false;
    if (currentUsedTab == null || currentUsedTab.id == evt.currentTarget.id){
        evt.currentTarget.className = evt.currentTarget.className.replace(" active","");
        evt.currentTarget.className += " active";
        currentTabOps = document.getElementById(op);
        currentTabOps.style.display = "block";
        currentUsedTab = evt.currentTarget;
    }
    else {
        currentUsedTab.className = currentUsedTab.className.replace(" active","");
        currentUsedTab = evt.currentTarget;
        currentUsedTab.className += " active";
        currentTabOps.style.display = "none";
        currentTabOps = document.getElementById(op);
        currentTabOps.style.display = "block";
        if (currentTabOps.id != "Perspective"){
            for ( i = 0; i < currentTabOps.children.length; i++)
            {
                if (currentTabOps.children[i].checked) {
                    currentTabOps.children[i].click();
                    isChecked = true;
                    break;
                }
            }
            // if no radio button yet selected pick the first one
            if (!isChecked) {
                currentTabOps.children[0].checked = true;
                currentTabOps.children[0].click();
            }
        }
    }
}

// Eventlistener for mousewheel
function mouseWheel(ev) {
    zoomIn(ev.deltaY);
}
// Applies zoomin or zoomout (using generateViewPort since it uses the zoomFactor by default)
function zoomIn(ev) {
    let scaleStep = 0.1;
    if (ev < 0 && countScale - scaleStep > 0.1) {
        countScale -= scaleStep;
    }
    else if (ev > 0) {
        countScale += scaleStep;
    }
    generateViewPort();
}

// Keys eventListener
function keyPressed(ev) {
    switch (ev.key) {
        case "z":
            zBufferChanged();
            break;
        case "b":
            backFaceCullingChanged();
            break;
        case "w":
            filledOn = false;
            break;
        case "f":
            filledOn = true;
            break;
        case "a":
            changeCurrentPrimitive(ev.key);
            break;
        case "d":
            changeCurrentPrimitive(ev.key);
            break;
        case "+":
            zoomIn(0.01);
            break;
        case "-":
            zoomIn(-0.01);
            break;
    }
}

// Changes object primitive 
// (if superquadric is selected displays its ops otherwise hides those ops)
function changeCurrentPrimitive(key) {
    if (key == "a")
        currentPrimitiveIndex = currentPrimitiveIndex - 1 < 0 ? nrOfPrimitives - 1 : currentPrimitiveIndex - 1;
    else
        currentPrimitiveIndex = ((currentPrimitiveIndex + 1) % nrOfPrimitives);
    instances[nInstances - 1].p = primitives[currentPrimitiveIndex];
    // Displays the superquadric sliders or hides them
    if (currentPrimitiveIndex == nrOfPrimitives - 1) {
        superOps.style.display = "block";
        mainBox.style.borderBottom = "2px dashed lightseagreen";
    }
    else {
        superOps.style.display = "none";
        mainBox.style.borderBottom = "2px solid lightseagreen";
    }
}

// Enables or disables zBuffer
function zBufferChanged() {
    zBufferEnabled = !zBufferEnabled;
    if (zBufferEnabled) {
        gl.enable(gl.DEPTH_TEST);
        zbuffVal.innerHTML = " ON";
        zbuffVal.style.color = "limeGreen";
    }
    else {
        gl.disable(gl.DEPTH_TEST);
        zbuffVal.innerHTML = " OFF";
        zbuffVal.style.color = "red";
    }
}

// Enables or disables backFaceCulling
function backFaceCullingChanged() {
    faceCullingEnabled = !faceCullingEnabled;
    if (faceCullingEnabled) {
        gl.enable(gl.CULL_FACE);
        bcullingVal.innerHTML = " ON";
        bcullingVal.style.color = "limeGreen";
    }
    else {
        gl.disable(gl.CULL_FACE);
        bcullingVal.innerHTML = " OFF";
        bcullingVal.style.color = "red";
    }
}

// Render function
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT || gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(uView, false, flatten(mView));
    gl.uniformMatrix4fv(uProj, false, flatten(mProjection));
    for (var i = 0; i < nInstances; i++) {
        gl.uniformMatrix4fv(uModel, false, flatten(instances[i].t));
        instances[i].p(gl, program, filledOn);
    }
    requestAnimationFrame(render);
}
