var sphere_points = [];
var sphere_normals = [];
var sphere_faces = [];
var sphere_edges = [];

var sphere_points_buffer;
var sphere_normals_buffer;
var sphere_faces_buffer;
var sphere_edges_buffer;

var SPHERE_LATS=20;
var SPHERE_LONS=30;

function superInit(gl, e1, e2, nlat, nlon) {
    nlat = nlat | SPHERE_LATS;
    nlon = nlon | SPHERE_LONS;
    superBuild(nlat, nlon,e1,e2);
    superUploadData(gl);
}

// Generate points using polar coordinates
function superBuild(nlat, nlon,e1,e2) 
{
    // phi will be latitude
    // theta will be longitude
 
    var d_phi = (Math.PI / (nlat+1)) * 0.5;
    var d_theta = (2*Math.PI / nlon) * 0.5;
    var r = 0.5;
    
    // Generate north polar cap
    var north = vec3(0,r,0);
    sphere_points.push(north);
    sphere_normals.push(vec3(0,1,0));
    
    // Generate middle
    for(var i=0, phi=Math.PI/2; phi>=-(Math.PI/2); i++, phi-=d_phi) {
        for(var j=0, theta=-Math.PI; theta<=Math.PI; j++, theta+=d_theta) {
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
            sphere_points.push(pt);
            var n = vec3(pt);
            sphere_normals.push(normalize(n));
        }
    }
    
    // Generate norh south cap
    var south = vec3(0,-r,0);
    sphere_points.push(south);
    sphere_normals.push(vec3(0,-1,0));
    
    // Generate the faces
    
    // north pole faces
    for(var i=0; i<nlon-1; i++) {
        sphere_faces.push(0);
        sphere_faces.push(i+2);
        sphere_faces.push(i+1);
    }
    sphere_faces.push(0);
    sphere_faces.push(1);
    sphere_faces.push(nlon);
    
    // general middle faces
    var offset=1;
    
    for(var i=0; i<nlat-1; i++) {
        for(var j=0; j<nlon-1; j++) {
            var p = offset+i*nlon+j;
            sphere_faces.push(p);
            sphere_faces.push(p+nlon+1);
            sphere_faces.push(p+nlon);
            
            sphere_faces.push(p);
            sphere_faces.push(p+1);
            sphere_faces.push(p+nlon+1);
        }
        var p = offset+i*nlon+nlon-1;
        sphere_faces.push(p);
        sphere_faces.push(p+1);
        sphere_faces.push(p+nlon);

        sphere_faces.push(p);
        sphere_faces.push(p-nlon+1);
        sphere_faces.push(p+1);
    }
    
    // south pole faces
    var offset = 1 + (nlat-1) * nlon;
    for(var j=0; j<nlon-1; j++) {
        sphere_faces.push(offset+nlon);
        sphere_faces.push(offset+j);
        sphere_faces.push(offset+j+1);
    }
    sphere_faces.push(offset+nlon);
    sphere_faces.push(offset+nlon-1);
    sphere_faces.push(offset);
 
    // Build the edges
    for(var i=0; i<nlon; i++) {
        sphere_edges.push(0);   // North pole 
        sphere_edges.push(i+1);
    }

    for(var i=0; i<nlat; i++, p++) {
        for(var j=0; j<nlon;j++, p++) {
            var p = 1 + i*nlon + j;
            sphere_edges.push(p);   // horizontal line (same latitude)
            if(j!=nlon-1) 
                sphere_edges.push(p+1);
            else sphere_edges.push(p+1-nlon);
            
            if(i!=nlat-1) {
                sphere_edges.push(p);   // vertical line (same longitude)
                sphere_edges.push(p+nlon);
            }
            else {
                sphere_edges.push(p);
                sphere_edges.push(sphere_points.length-1);
            }
        }
    }
    
}

function superUploadData(gl)
{
    sphere_points_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphere_points_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(sphere_points), gl.STATIC_DRAW);
    
    sphere_normals_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphere_normals_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(sphere_normals), gl.STATIC_DRAW);
    
    sphere_faces_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphere_faces_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(sphere_faces), gl.STATIC_DRAW);
    
    sphere_edges_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphere_edges_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(sphere_edges), gl.STATIC_DRAW);
}

function superWireFrame(gl, program)
{    
    gl.useProgram(program);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, sphere_points_buffer);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, sphere_normals_buffer);
    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphere_edges_buffer);
    gl.drawElements(gl.LINES, sphere_edges.length, gl.UNSIGNED_SHORT, 0);
}

function superFilled(gl, program)
{
    gl.useProgram(program);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, sphere_points_buffer);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, sphere_normals_buffer);
    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphere_faces_buffer);
    gl.drawElements(gl.TRIANGLES, sphere_faces.length, gl.UNSIGNED_SHORT, 0);
}

function sphereDraw(gl, program, filled=false) {
	if(filled) superFilled(gl, program);
	else superWireFrame(gl, program);
}