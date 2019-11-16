/*
 *
 * Trabalho realizado por:
 * 
 * Sara Trafaria Nº 41693
 * João Peres Nº 48320
 *
 */

var superQ_points = [];
var superQ_normals = [];
var superQ_faces = [];
var superQ_edges = [];

var superQ_points_buffer;
var superQ_normals_buffer;
var superQ_faces_buffer;
var superQ_edges_buffer;

var SUPER_LATS=20;
var SUPER_LONS=30;

function superInit(gl, e1, e2, nlat, nlon) {
    nlat = nlat | SUPER_LATS;
    nlon = nlon | SUPER_LONS;
    superBuild(nlat, nlon,e1,e2);
    superUploadData(gl);
}

// Generate points using polar coordinates
function superBuild(nlat, nlon,e1,e2) 
{
    superQ_points = [];
    superQ_normals = [];
    superQ_faces = [];
    superQ_edges = [];
    // phi will be latitude
    // theta will be longitude
 
    var d_phi = (Math.PI / (nlat+1));
    var d_theta = (2*Math.PI / nlon);
    var r = 0.5;
    
    // Generate north polar cap
    var north = vec3(0,r,0);
    superQ_points.push(north);
    superQ_normals.push(vec3(0,1,0));
    
    // Generate middle
    for(var i=0, phi=Math.PI/2 - d_phi;  i<nlat; i++, phi-=d_phi) {
        for(var j=0, theta=-Math.PI; j<nlon; j++, theta+=d_theta) {
            var cosphi = Math.cos(phi);
            var sinphi = Math.sin(phi);
            var costheta = Math.cos(theta);
            var sintheta = Math.sin(theta);

            var x = r*
                	(Math.sign(cosphi)*Math.pow(Math.abs(cosphi),e1))*
                        (Math.sign(costheta)*Math.pow(Math.abs(costheta),e2));
            var y = r*
                    (Math.sign(sinphi)*Math.pow(Math.abs(sinphi),e1));
            var z = r*
                    (Math.sign(cosphi)*Math.pow(Math.abs(cosphi),e1))*
                        (Math.sign(sintheta)*Math.pow(Math.abs(sintheta),e2));
            var pt = vec3(x,y,z);
            superQ_points.push(pt);
            var n = vec3(pt);
            superQ_normals.push(normalize(n));
        }
    }
    
    // Generate norh south cap
    var south = vec3(0,-r,0);
    superQ_points.push(south);
    superQ_normals.push(vec3(0,-1,0));
    
    // Generate the faces
    
    // north pole faces
    for(var i=0; i<nlon-1; i++) {
        superQ_faces.push(0);
        superQ_faces.push(i+2);
        superQ_faces.push(i+1);
    }
    superQ_faces.push(0);
    superQ_faces.push(1);
    superQ_faces.push(nlon);
    
    // general middle faces
    var offset=1;
    
    for(var i=0; i<nlat-1; i++) {
        for(var j=0; j<nlon-1; j++) {
            var p = offset+i*nlon+j;
            superQ_faces.push(p);
            superQ_faces.push(p+nlon+1);
            superQ_faces.push(p+nlon);
            
            superQ_faces.push(p);
            superQ_faces.push(p+1);
            superQ_faces.push(p+nlon+1);
        }
        var p = offset+i*nlon+nlon-1;
        superQ_faces.push(p);
        superQ_faces.push(p+1);
        superQ_faces.push(p+nlon);

        superQ_faces.push(p);
        superQ_faces.push(p-nlon+1);
        superQ_faces.push(p+1);
    }
    
    // south pole faces
    var offset = 1 + (nlat-1) * nlon;
    for(var j=0; j<nlon-1; j++) {
        superQ_faces.push(offset+nlon);
        superQ_faces.push(offset+j);
        superQ_faces.push(offset+j+1);
    }
    superQ_faces.push(offset+nlon);
    superQ_faces.push(offset+nlon-1);
    superQ_faces.push(offset);
 
    // Build the edges
    for(var i=0; i<nlon; i++) {
        superQ_edges.push(0);   // North pole 
        superQ_edges.push(i+1);
    }

    for(var i=0; i<nlat; i++, p++) {
        for(var j=0; j<nlon;j++, p++) {
            var p = 1 + i*nlon + j;
            superQ_edges.push(p);   // horizontal line (same latitude)
            if(j!=nlon-1) 
                superQ_edges.push(p+1);
            else superQ_edges.push(p+1-nlon);
            
            if(i!=nlat-1) {
                superQ_edges.push(p);   // vertical line (same longitude)
                superQ_edges.push(p+nlon);
            }
            else {
                superQ_edges.push(p);
                superQ_edges.push(superQ_points.length-1);
            }
        }
    }
    
}

function superUploadData(gl)
{
    superQ_points_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, superQ_points_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(superQ_points), gl.STATIC_DRAW);
    
    superQ_normals_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, superQ_normals_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(superQ_normals), gl.STATIC_DRAW);
    
    superQ_faces_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, superQ_faces_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(superQ_faces), gl.STATIC_DRAW);
    
    superQ_edges_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, superQ_edges_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(superQ_edges), gl.STATIC_DRAW);
}

function superWireFrame(gl, program)
{    
    gl.useProgram(program);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, superQ_points_buffer);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, superQ_normals_buffer);
    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, superQ_edges_buffer);
    gl.drawElements(gl.LINES, superQ_edges.length, gl.UNSIGNED_SHORT, 0);
}

function superFilled(gl, program)
{
    gl.useProgram(program);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, superQ_points_buffer);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, superQ_normals_buffer);
    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, superQ_faces_buffer);
    gl.drawElements(gl.TRIANGLES, superQ_faces.length, gl.UNSIGNED_SHORT, 0);
}

function superDraw(gl, program, filled=false) {
	if(filled) superFilled(gl, program);
	else superWireFrame(gl, program);
}