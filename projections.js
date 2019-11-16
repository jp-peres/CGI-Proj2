/*
 *
 * Trabalho realizado por:
 * 
 * Sara Trafaria Nº 41693
 * João Peres Nº 48320
 *
 */

// Webgl vars
var gl;
var canvas;
var program;

// Old program vars
var instances = [];
var nInstances = 0;

// Show auto text vars
const AUTOSTART_YAXIS = -0.5;
var wireFrameText, zBufferText, bcullingText;
var currTime = 0.0;
var timeoutVar;
const TIMEOUTINTERVAL = 2000;

// Var used to change dashed to filled border when changing to superquadric
var mainBox;
// Slider vars
var gammaSlider, thetaSlider, lSlider, alphaSlider, dSlider, e1Slider, e2Slider;
// Radio button vars
var ortRadio1, ortRadio2, ortRadio3, axoRadio1, axoRadio2, axoRadio3, axoRadio4, oblRadio1, oblRadio2, oblRadio3, perspective;
// Container paragraphs (to hide sliders)
var gammaContainer, thetaContainer, lContainer, alphaContainer, superOps, wrap;
// Current selected primitive
var currentSelectedPrimitive;
// Uniform location vars
var uProj, uModel, uView;
// BackFace culling and zBuffer flags
var zBufferEnabled, faceCullingEnabled;

// mView var
var mView = mat4();
// mProjection var
var mProjection;
// Array with all the draw primitives wired and filled (cube, sphere, bunny, etc)
var primitives = [];
// Index of the selected primitive at the moment
var currentPrimitiveIndex = 0;
// Total number of object primitives
var nrOfPrimitives = 6;
// Wireframe on = true or Filled = false
var wiredOn;

// Auxiliary var for zoomScale
var countScale = 1;
// Area in percentage that the viewport occupies in the window
var viewportAreaPercent = 0.45;


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

    gl.clearColor(0.38, 0.38, 0.38, 1.0);
    // Load shaders and initialize attribute buffers
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    uModel = gl.getUniformLocation(program, "mModel");

    uProj = gl.getUniformLocation(program, "mProjection");

    uView = gl.getUniformLocation(program, "mView");

    render();
}

function initialProgramState() {
    document.getElementById("bt2").click();
    document.getElementById("axoRadio2").click();
    faceCullingEnabled = false;
    bcullingText.innerHTML = "Bculling: OFF";
    zBufferEnabled = false;
    zBufferText.innerHTML = "ZBuffer: OFF";
    wiredOn = true;
    currentSelectedPrimitive = primitives[currentPrimitiveIndex].w;
    instances.push({ t: mat4(), p: currentSelectedPrimitive });
    nInstances++;
}

function generateEventListeners() {

    // Get html elements 
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
    projTab = document.getElementById("projTab");
    gammaContainer = document.getElementById("gammaContainer");
    thetaContainer = document.getElementById("thetaContainer");
    alphaContainer = document.getElementById("alphaContainer");
    lContainer = document.getElementById("lContainer");
    gammaSlider = document.getElementById("gammaSlider");
    thetaSlider = document.getElementById("thetaSlider");
    wrap = document.getElementById("wrap");
    lSlider = document.getElementById("lSlider");
    dSlider = document.getElementById("dSlider");
    alphaSlider = document.getElementById("alphaSlider");
    superOps = document.getElementById("superOps");
    e1Slider = document.getElementById("e1Slider");
    e2Slider = document.getElementById("e2Slider");
    mainBox = document.getElementById("mainBox");
    wireFrameText = document.getElementById("wireFrameText");
    zBufferText = document.getElementById("zBufferText");
    bcullingText = document.getElementById("bcullingText");    

    // Generate all event listeners
    addEventListener("keypress", keyPressed);
    thetaSlider.addEventListener("input", gammaThetaChanged);
    gammaSlider.addEventListener("input", gammaThetaChanged);
    alphaSlider.addEventListener("input", alphaLChanged);
    lSlider.addEventListener("input", alphaLChanged);
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
    dSlider.addEventListener("input", dChanged);
    canvas.addEventListener("wheel", mouseWheel);
    e1Slider.addEventListener("input", updateQuadric);
    e2Slider.addEventListener("input", updateQuadric);
}

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

function initializeObjects() {
    cubeInit(gl);
    sphereInit(gl);
    bunnyInit(gl);
    torusInit(gl);
    cylinderInit(gl);
    superInit(gl, e1Slider.value, e2Slider.value);
}

function updateQuadric() {
    superInit(gl, e1Slider.value, e2Slider.value);
}

// TODO: to be refactored
function fillArrayPrimitives() {
    primitives.push({ w: cubeDrawWireFrame, f: cubeDrawFilled });
    primitives.push({ w: sphereDrawWireFrame, f: sphereDrawFilled });
    primitives.push({ w: cylinderDrawWireFrame, f: cylinderDrawFilled });
    primitives.push({ w: torusDrawWireFrame, f: torusDrawFilled });
    primitives.push({ w: bunnyDrawWireFrame, f: bunnyDrawFilled });
    primitives.push({ w: superWireFrame, f: superFilled })
}

// Eventlistener func for all radio buttons
function radioClicked(evt) {
    switch (evt.target.value) {
        //Ortogonal
        case "principal":
        case "rightside":
        case "plant":
            ortogonalViews(evt.target.value);
            break;
        //Axonometric
        case "isometric":
        case "dimetric":
        case "trimetric":
        case "freeA":
            axonometricViews(evt.target.value);
            break;
        //Oblique:
        case "cavalier":
        case "cabinet":
        case "freeO":
            obliqueViews(evt.target.value);
            break;
        //Perspective:
        case "perspective":
            perspectiveView();
            break;
    }
}

//
// Ortogonal projection func
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
    zoomPerspective();
}

//
// Axonometric projection related funcs
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
    zoomPerspective();
}

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
    zoomPerspective();
}

//
// Oblique projection related funcs
//
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
        case "freeO":
            alphaContainer.style.display = "table";
            lContainer.style.display = "table";
            alphaLChanged();
            break;
    }
    zoomPerspective();
}

function alphaLChanged() {
    var currL = Number(lSlider.value);
    var currAlpha = Number(alphaSlider.value);
    mView = mObl(currL, currAlpha);
    zoomPerspective();
}

function mObl(l, alpha) {
    var auxView = mat4();

    auxView[0][2] = -l * Math.cos(radians(alpha));
    auxView[1][2] = -l * Math.sin(radians(alpha));

    return auxView;
}

//
// Perspective projection related funcs
//
function perspectiveView() {
    var d = Number(dSlider.value);
    var auxView = mat4();
    if (d == 1) {
        auxView[3][2] = -1;
    }
    else {
        auxView[3][2] = -1 / d;
    }
    mView = auxView;
    zoomPerspective();
}

function dChanged() {
    perspectiveView();
}

// TODO: Will refactor this function
// Function to hide tab contents and show selected tab content 
function showTab(evt, op) {
    var i, tabcontent, tablinks;

    tabcontent = document.getElementsByClassName("tabops");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    var currentTabOps = document.getElementById(op);
    currentTabOps.style.display = "block";
    evt.currentTarget.className += " active";
    var isChecked = false;
    if (currentTabOps.id != "Perspective") {
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
}

function mouseWheel(ev) {
    zoomIn(ev.deltaY);
}

function zoomIn(ev) {
    var scaleStep = 0.1;
    if (ev < 0 && countScale - scaleStep > 0.1) {
        countScale -= scaleStep;
    }
    else if (ev > 0) {
        countScale += scaleStep;
    }
    zoomPerspective();
}

function zoomPerspective() {
    generateViewPort();
}

//Functions to hide texts
function hideText(){
    wireFrameText.style.opacity = 0.0;
    
}

function keyPressed(ev) {
    switch (ev.key) {
        case "z":
            zBufferEnabled = !zBufferEnabled;
            if (zBufferEnabled) {
                gl.enable(gl.DEPTH_TEST);
                zBufferText.innerHTML = "ZBuffer: ON";
                zBufferText.style.color = "limeGreen";
            }
            else {
                gl.disable(gl.DEPTH_TEST);
                zBufferText.innerHTML = "ZBuffer: OFF";
                zBufferText.style.color = "red";
            }
            break;
        case "b":
            faceCullingEnabled = !faceCullingEnabled;
            if (faceCullingEnabled) {
                gl.enable(gl.CULL_FACE);
                bcullingText.innerHTML = "Bculling: ON";
                bcullingText.style.color = "limeGreen";
            }
            else {
                gl.disable(gl.CULL_FACE);
                bcullingText.innerHTML = "Bculling: OFF";
                bcullingText.style.color = "red";
            }
            break;
        case "w":
            wiredOn = true;
            instances[nInstances - 1].p = primitives[currentPrimitiveIndex].w;
            wireFrameText.innerHTML = "Wire Frame: ON";
            wireFrameText.style.color = "limeGreen";
            wireFrameText.style.opacity=1.0;
            timeoutVar = setTimeout(hideText,TIMEOUTINTERVAL);
            break;
        case "f":
            wiredOn = false;
            instances[nInstances - 1].p = primitives[currentPrimitiveIndex].f;
            wireFrameText.innerHTML = "Filled: ON";
            wireFrameText.style.color = "limeGreen";
            wireFrameText.style.opacity=1.0;
            timeoutVar = setTimeout(hideText,TIMEOUTINTERVAL);
            break;
        case "a":
            currentPrimitiveIndex = currentPrimitiveIndex - 1 < 0 ? nrOfPrimitives - 1 : currentPrimitiveIndex - 1;
            instances[nInstances - 1].p = wiredOn ? primitives[currentPrimitiveIndex].w : primitives[currentPrimitiveIndex].f;
            if (currentPrimitiveIndex == nrOfPrimitives - 1) {
                superOps.style.display = "block";
                mainBox.style.borderBottom = "2px dashed lightseagreen";
            }
            else {
                superOps.style.display = "none";
                mainBox.style.borderBottom = "2px solid lightseagreen";
            }
            break;
        case "d":
            currentPrimitiveIndex = ((currentPrimitiveIndex + 1) % nrOfPrimitives);
            instances[nInstances - 1].p = wiredOn ? primitives[currentPrimitiveIndex].w : primitives[currentPrimitiveIndex].f;
            if (currentPrimitiveIndex == nrOfPrimitives - 1) {
                superOps.style.display = "block";
                mainBox.style.borderBottom = "2px dashed lightseagreen";
            }
            else {
                superOps.style.display = "none";
                mainBox.style.borderBottom = "2px solid lightseagreen";
            }
            break;
        case "+":
            zoomIn(0.01);
            break;
        case "-":
            zoomIn(-0.01);
            break;
    }
}

function render() {
    currTime += 1;
    gl.clear(gl.COLOR_BUFFER_BIT || gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(uView, false, flatten(mView));
    gl.uniformMatrix4fv(uProj, false, flatten(mProjection));
    for (var i = 0; i < nInstances; i++) {
        gl.uniformMatrix4fv(uModel, false, flatten(instances[i].t));
        instances[i].p(gl, program);
    }
    requestAnimationFrame(render);
}
