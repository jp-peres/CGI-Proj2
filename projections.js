var gl;
var instances = [];
var nInstances = 0;
var tx, ty, tz;
var rx, ry, rz;
var sx, sy, sz;
var btnSubmit, btnReset, btnRemoveAll;
var ortRadio1, ortRadio2, ortRadio3;
var checkBox, comboBox;
var currentSelectedPrimitive;
var uProj, uModel, uView;
var zBufferEnabled, faceCullingEnabled;
var program;
var mProjectionInit = ortho(-2,2,-2,2,10,-10);
var mProjection;
var canvas;
var primitives = [];
var currentIndex = 0;
var nrOfPrimitives = 5;
var wiredOn;
var aRatio;


window.onresize = function (){
    generateViewPort();
    
}

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    tx = document.getElementById("txSlide");
    ty = document.getElementById("tySlide");
    tz = document.getElementById("tzSlide");
    rx = document.getElementById("rxSlide");
    ry = document.getElementById("rySlide");
    rz = document.getElementById("rzSlide");
    sx = document.getElementById("sxSlide");
    sy = document.getElementById("sySlide");
    sz = document.getElementById("szSlide");
    comboBox = document.getElementById("combobox");
    checkBox = document.getElementById("checkbox");
    btnSubmit = document.getElementById("submit");
    btnReset = document.getElementById("reset");
    btnRemoveAll = document.getElementById("removeAll");
    document.getElementById("bt2").click();
    document.getElementById("axoRadio2").click();
    ortRadio1 = document.getElementById("ortRadio1");
    ortRadio2 = document.getElementById("ortRadio2");
    ortRadio3 = document.getElementById("ortRadio3");
    addEventListener("keypress",keyPressed);

    
    tx.addEventListener("input",inputChange);
    ty.addEventListener("input",inputChange);
    tz.addEventListener("input",inputChange);
    rx.addEventListener("input",inputChange);
    ry.addEventListener("input",inputChange);
    rz.addEventListener("input",inputChange);
    sx.addEventListener("input",inputChange);
    sy.addEventListener("input",inputChange);
    sz.addEventListener("input",inputChange);


    btnSubmit.addEventListener("click",addNewInstance);
    btnReset.addEventListener("click",resetCurrent);
    btnRemoveAll.addEventListener("click",removeAllInstances);
    ortRadio1.addEventListener("click",radioClicked);
    ortRadio2.addEventListener("click",radioClicked);
    ortRadio3.addEventListener("click",radioClicked);

    gl = WebGLUtils.setupWebGL(canvas);
    if(!gl) { alert("WebGL isn't available"); }
    
    initializeObjects();
    fillArrayPrimitives();

    generateViewPort();
    gl.clearColor(0.39, 0.39, 0.39, 1.0);


    faceCullingEnabled = false;
    zBufferEnabled = false;
    wiredOn = true;


    currentSelectedPrimitive = primitives[currentIndex].w;
    instances.push({t:mat4(),p:currentSelectedPrimitive});
    nInstances++;
    // Load shaders and initialize attribute buffers
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    uModel = gl.getUniformLocation(program, "mModel");
    
    uProj = gl.getUniformLocation(program, "mProjection");

    uView = gl.getUniformLocation(program, "mView");

    render();
}

function generateViewPort() {
    var height = window.innerHeight;
    var width = window.innerWidth;
    var s = Math.min(width, height/2);
    aRatio = width / height;
    if (s == width) {
        mProjection = ortho(-2, 2, -1 * aRatio, 1 * aRatio, 10, -10);
    }
    else {
        mProjection = ortho(-2 * aRatio, 2 * aRatio, -1, 1, 10, -10);
    }
    canvas.width = width;
    canvas.height = height / 2;
    gl.viewport(0, 0, width, height / 2);
}

function initializeObjects(){
    cubeInit(gl);
    sphereInit(gl);
    bunnyInit(gl);
    torusInit(gl);
    cylinderInit(gl);
}

function fillArrayPrimitives(){
    primitives.push({w:cubeDrawWireFrame,f:cubeDrawFilled});
    primitives.push({w:sphereDrawWireFrame,f:sphereDrawFilled});
    primitives.push({w:cylinderDrawWireFrame,f:cylinderDrawFilled});
    primitives.push({w:torusDrawWireFrame,f:torusDrawFilled});
    primitives.push({w:bunnyDrawWireFrame,f:bunnyDrawFilled});
}

function radioClicked(evt){
    switch(evt.target.value){
        case "principal":
            var aux = mat4();
            aux[2][2] = 0;
            mProjection = mult(aux,mProjectionInit);
            break;
        case "principal":
            break;
        case "principal":
            break;
    }
}

function showTab(evt,op){
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
    document.getElementById(op).style.display = "block";
    evt.currentTarget.className += " active";
}

function keyPressed(ev){
    switch(ev.key){
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
            instances[nInstances-1].p = primitives[currentIndex].w;
            break;
        case "f":
            wiredOn = false;
            instances[nInstances-1].p = primitives[currentIndex].f;
            break;
        case "a":
            currentIndex = currentIndex-1 < 0 ? nrOfPrimitives-1 : currentIndex-1;        
            instances[nInstances-1].p = wiredOn ? primitives[currentIndex].w : primitives[currentIndex].f;
            break;
        case "d":
            currentIndex = ((currentIndex+1) % nrOfPrimitives);
            instances[nInstances-1].p = wiredOn ? primitives[currentIndex].w : primitives[currentIndex].f;
            break;
        case "+":
            near++;
            mProjection = ortho(-2,2,-2,2,near,far);
            break;
        case "-":
            near--;
            mProjection = ortho(-2,2,-2,2,near,far);
            break;
    }
}

function changePrimitive(){
    switch(comboBox.value){
        case "cube":
            if (checkBox.checked){
                currentSelectedPrimitive = cubeDrawWireFrame;
                break;
            }
            else{
                currentSelectedPrimitive = cubeDrawFilled;
                break;
            }
        case "sphere":
                if (checkBox.checked){
                    currentSelectedPrimitive = sphereDrawWireFrame;
                    break;
                }
                else{
                    currentSelectedPrimitive = sphereDrawFilled;
                    break;
                }
    }
    instances[nInstances-1].p = currentSelectedPrimitive;
}

function inputChange(){
    var currTx = Number(tx.value);
    var currTy = Number(ty.value);
    var currTz = Number(tz.value);
    var currRx = Number(rx.value);
    var currRy = Number(ry.value);
    var currRz = Number(rz.value);
    var currSx = Number(sx.value);
    var currSy = Number(sy.value);
    var currSz = Number(sz.value);
    // TODO: Rotacoes corretas perguntar 
    instances[nInstances-1].t = mult(translate(currTx,currTy,currTz),
                                    mult(rotateZ(currRz),
                                    mult(rotateY(currRy),
                                    mult(rotateX(currRx),
                                    scalem(currSx,currSy,currSz)))));
}

function resetCurrent(){
    resetSliders();
    instances[nInstances-1].t = mat4();
}

function resetSliders(){
    tx.value = 0;
    ty.value = 0;
    tz.value = 0;
    sx.value = 1;
    sy.value = 1;
    sz.value = 1;
    rx.value = 0;
    ry.value = 0;
    rz.value = 0;
}

function removeAllInstances(){
    instances = [];
    nInstances=0;
    instances.push({t:mat4(),p:currentSelectedPrimitive});
    nInstances++;
    resetSliders();
}

function addNewInstance(){
    instances.push({t:mat4(),p:currentSelectedPrimitive});
    nInstances++;
    resetSliders();
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    var at = [0, 0, 0];
    var eye = [1, 1, 1];
    var up = [0, 1, 0];
    mView = lookAt(eye, at, up);
    //mProjection = perspective(10,canvas.width/canvas.height,1,100);
    gl.uniformMatrix4fv(uView, false, flatten(mView));
    gl.uniformMatrix4fv(uProj, false, flatten(mProjection));
    for(var i = 0; i < nInstances; i++){
        gl.uniformMatrix4fv(uModel, false, flatten(instances[i].t));
        instances[i].p(gl,program);
    }
    requestAnimationFrame(render);
}
