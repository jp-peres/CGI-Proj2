var superQuad_points = [];
var superQuad_normals = [];
var superQuad_faces = [];
var superQuad_edges = [];

var superQuad_points_buffer;
var superQuad_normals_buffer;
var superQuad_faces_buffer;
var superQuad_edges_buffer;

var SUPERQUAD_LATS=20;
var SUPERQUAD_LONGS=30;

function superQuadInit(gl, e1, e2) {
    //nlat = nlat | SUPERQUAD_LATS;
    //nlon = nlon | SUPERQUAD_LONGS;
    superQuadBuild(e1, e2);
    superQuadUploadData(gl);
}

function supQuadExpress(r,phi,theta,e1,e2){
    var auxPt = vec3();
    var expXe1 = Math.exp(Math.abs(Math.cos(phi)),e1);
    var expXe2 = Math.exp(Math.abs(Math.cos(theta)),e2);
    var expYe1 = Math.exp(Math.abs(Math.sin(phi)),e1);
    var expZe1 = Math.exp(Math.abs(Math.cos(phi)),e1);
    var expZe2 = Math.exp(Math.abs(Math.sin(theta)),e2);
    
    if(Math.cos(phi) < 0){
        expXe1 *= -1;
        expZe1 *= -1;
    }
    if(Math.cos(theta) <0){
        expXe2 *= -1;
    }
    if(Math.sin(phi) <0){
        expYe1 *= -1;
    }
    if(Math.sin(theta)){
        expZe2 *= -1;
    }
    var x = r*expXe1*expXe2;
    var y = r*expYe1;
    var z = r*expZe1*expZe2;
    
    auxPt[0] = x;
    auxPt[1] = y;
    auxPt[2] = z;
    
    return auxPt;
}

// Generate points using polar coordinates
function superQuadBuild(e1, e2) 
{
    // phi will be latitude
    // theta will be longitude
 
    var d_phi = Math.PI / (SUPERQUAD_LATS+1);
    var d_theta = 2*Math.PI / SUPERQUAD_LONGS;
    var r = 0.5;
    
    // Generate north polar cap
    var north = vec3(0,r,0);
    superQuad_points.push(north);
    superQuad_normals.push(vec3(0,1,0));
    
    // Generate middle
    for(var i=0, phi=Math.PI/2-d_phi; i<SUPERQUAD_LATS; i++, phi-=d_phi) {
        for(var j=0, theta=0; j<SUPERQUAD_LONGS; j++, theta+=d_theta) {
            var pt = supQuadExpress(r,phi,theta,e1,e2);
            superQuad_points.push(pt);
            var n = vec3(pt);
            superQuad_normals.push(normalize(n));
        }
    }
    
    // Generate norh south cap
    var south = vec3(0,-r,0);
    superQuad_points.push(south);
    superQuad_normals.push(vec3(0,-1,0));
    
    // Generate the faces
    
    // north pole faces
    for(var i=0; i<SUPERQUAD_LONGS-1; i++) {
        superQuad_faces.push(0);
        superQuad_faces.push(i+2);
        superQuad_faces.push(i+1);
    }
    superQuad_faces.push(0);
    superQuad_faces.push(1);
    superQuad_faces.push(SUPERQUAD_LONGS);
    
    // general middle faces
    var offset=1;
    
    for(var i=0; i<SUPERQUAD_LATS-1; i++) {
        for(var j=0; j<SUPERQUAD_LONGS-1; j++) {
            var p = offset+i*SUPERQUAD_LONGS+j;
            superQuad_faces.push(p);
            superQuad_faces.push(p+SUPERQUAD_LONGS+1);
            superQuad_faces.push(p+SUPERQUAD_LONGS);
            
            superQuad_faces.push(p);
            superQuad_faces.push(p+1);
            superQuad_faces.push(p+SUPERQUAD_LONGS+1);
        }
        var p = offset+i*SUPERQUAD_LONGS+SUPERQUAD_LONGS-1;
        superQuad_faces.push(p);
        superQuad_faces.push(p+1);
        superQuad_faces.push(p+SUPERQUAD_LONGS);

        superQuad_faces.push(p);
        superQuad_faces.push(p-SUPERQUAD_LONGS+1);
        superQuad_faces.push(p+1);
    }
    
    // south pole faces
    var offset = 1 + (SUPERQUAD_LATS-1) * SUPERQUAD_LONGS;
    for(var j=0; j<SUPERQUAD_LONGS-1; j++) {
        superQuad_faces.push(offset+SUPERQUAD_LONGS);
        superQuad_faces.push(offset+j);
        superQuad_faces.push(offset+j+1);
    }
    superQuad_faces.push(offset+SUPERQUAD_LONGS);
    superQuad_faces.push(offset+SUPERQUAD_LONGS-1);
    superQuad_faces.push(offset);
 
    // Build the edges
    for(var i=0; i<SUPERQUAD_LONGS; i++) {
        superQuad_edges.push(0);   // North pole 
        superQuad_edges.push(i+1);
    }

    for(var i=0; i<SUPERQUAD_LATS; i++, p++) {
        for(var j=0; j<SUPERQUAD_LONGS;j++, p++) {
            var p = 1 + i*SUPERQUAD_LONGS + j;
            superQuad_edges.push(p);   // horizontal line (same latitude)
            if(j!=SUPERQUAD_LONGS-1) 
                superQuad_edges.push(p+1);
            else superQuad_edges.push(p+1-SUPERQUAD_LONGS);
            
            if(i!=SUPERQUAD_LATS-1) {
                superQuad_edges.push(p);   // vertical line (same longitude)
                superQuad_edges.push(p+SUPERQUAD_LONGS);
            }
            else {
                superQuad_edges.push(p);
                superQuad_edges.push(superQuad_points.length-1);
            }
        }
    }
    
}

function superQuadUploadData(gl)
{
    superQuad_points_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, superQuad_points_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(superQuad_points), gl.STATIC_DRAW);
    
    superQuad_normals_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, superQuad_normals_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(superQuad_normals), gl.STATIC_DRAW);
    
    superQuad_faces_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, superQuad_faces_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(superQuad_faces), gl.STATIC_DRAW);
    
    superQuad_edges_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, superQuad_edges_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(superQuad_edges), gl.STATIC_DRAW);
}

function superQuadDrawWireFrame(gl, program)
{    
    gl.useProgram(program);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, superQuad_points_buffer);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, superQuad_normals_buffer);
    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, superQuad_edges_buffer);
    gl.drawElements(gl.LINES, superQuad_edges.length, gl.UNSIGNED_SHORT, 0);
}

function superQuadDrawFilled(gl, program)
{
    gl.useProgram(program);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, superQuad_points_buffer);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, superQuad_normals_buffer);
    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, superQuad_faces_buffer);
    gl.drawElements(gl.TRIANGLES, superQuad_faces.length, gl.UNSIGNED_SHORT, 0);
}

function superQuadDraw(gl, program, filled=false) {
	if(filled) superQuadDrawFilled(gl, program);
	else superQuadDrawWireFrame(gl, program);
}