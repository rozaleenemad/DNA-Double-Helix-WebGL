// ============================================
// GLOBAL VARIABLES & STATE
// ============================================
let gl;
let program;
let sphereBuffer;
let sphereIndexBuffer;
let sphereIndexCount = 0;

let rotateX = 0;
let rotateY = 0;
let rotateZ = 0;

let isSpinning = true;
let spinSpeed = 1.0;
let lastTime = 0;
let activeFilter = null;
let zoomLevel = 1.0;

const baseData = {
    'A': {
        name: 'Adenine',
        full: 'Adenine Nucleobase',
        pair: 'T',
        bonds: '2 Hydrogen Bonds',
        formula: 'C₅H₅N₅',
        weight: '135.13 g/mol',
        class: 'Purine (Double-Ring)',
        discovery: 'Albrecht Kossel (1885)',
        desc: 'Adenine is a purine nucleobase composed of fused heterocyclic rings. Within the double helix, it consistently pairs with Thymine via two hydrogen bonds. Beyond its structural role in genetic coding, Adenine serves as a fundamental building block for adenosine triphosphate (ATP), the primary energy currency of cellular metabolism, as well as crucial enzymatic cofactors.'
    },
    'T': {
        name: 'Thymine',
        full: 'Thymine Nucleobase',
        pair: 'A',
        bonds: '2 Hydrogen Bonds',
        formula: 'C₅H₆N₂O₂',
        weight: '126.11 g/mol',
        class: 'Pyrimidine (Single-Ring)',
        discovery: 'Albrecht Kossel & Albert Neumann (1893)',
        desc: 'Thymine is a pyrimidine nucleobase featuring a single-ring structure, uniquely restricted to DNA (replaced by Uracil in RNA synthesis). By pairing with Adenine, it maintains a uniform distance between the antiparallel sugar-phosphate backbones. Its specific chemical architecture provides inherent photostability, minimizing structural mutations induced by solar ultraviolet (UV) radiation.'
    },
    'G': {
        name: 'Guanine',
        full: 'Guanine Nucleobase',
        pair: 'C',
        bonds: '3 Hydrogen Bonds',
        formula: 'C₅H₅N₅O',
        weight: '151.13 g/mol',
        class: 'Purine (Double-Ring)',
        discovery: 'Julius Bodo Unger (1844)',
        desc: 'Guanine is a double-ring purine derivative that pairs exclusively with Cytosine. This complementary pairing forms a highly stable complex stabilized by three intermolecular hydrogen bonds. Genomic regions containing elevated GC-content exhibit greater thermal stability and higher melting temperatures, providing structural integrity to genomes under extreme environmental conditions.'
    },
    'C': {
        name: 'Cytosine',
        full: 'Cytosine Nucleobase',
        pair: 'G',
        bonds: '3 Hydrogen Bonds',
        formula: 'C₄H₅N₃O',
        weight: '111.10 g/mol',
        class: 'Pyrimidine (Single-Ring)',
        discovery: 'Albrecht Kossel & Albert Neumann (1894)',
        desc: 'Cytosine is a single-ring pyrimidine nucleobase. In addition to functioning as a primary information carrier in genetic translation, Cytosine is the exclusive site for DNA methylation. This biochemical modification acts as a fundamental epigenetic mechanism, modulating gene silencing and activation pathways without altering the underlying nucleotide sequence.'
    }
};
// ============================================
// MATRIX MATH FUNCTIONS
// ============================================
function identity() {
    return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

function multiply(a, b) {
    let result = new Array(16);
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            let sum = 0;
            for (let i = 0; i < 4; i++) { sum += a[row + i * 4] * b[i + col * 4]; }
            result[row + col * 4] = sum;
        }
    }
    return result;
}

function scaleMatrix(sx, sy, sz) {
    return [sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1];
}

function translateMatrix(tx, ty, tz) {
    return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, tx, ty, tz, 1];
}

function rotateXMatrix(angle) {
    let c = Math.cos(angle); let s = Math.sin(angle);
    return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1];
}

function rotateYMatrix(angle) {
    let c = Math.cos(angle); let s = Math.sin(angle);
    return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1];
}

function orthographicProjection(left, right, bottom, top, near, far) {
    return [
        2 / (right - left), 0, 0, 0,
        0, 2 / (top - bottom), 0, 0,
        0, 0, -2 / (far - near), 0,
        -(right + left) / (right - left), -(top + bottom) / (top - bottom), -(far + near) / (far - near), 1
    ];
}

// ============================================
// SHADERS WITH BASIC LIGHTING
// ============================================
const vs = `
attribute vec3 position;
attribute vec3 normal;
varying vec3 vNormal;
uniform mat4 matrix;
void main() {
    gl_Position = matrix * vec4(position, 1.0);
    vNormal = normal;
}`;

const fs = `
precision mediump float;
varying vec3 vNormal;
uniform vec3 uColor;
void main() {
    vec3 lightDirection = normalize(vec3(0.5, 1.0, 0.5));
    float light = dot(normalize(vNormal), lightDirection);
    light = max(light, 0.35); 
    gl_FragColor = vec4(uColor * light, 1.0);
}`;

function createShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}

function createProgram() {
    const program = gl.createProgram();
    gl.attachShader(program, createShader(gl.VERTEX_SHADER, vs));
    gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(program);
    return program;
}

// ============================================
// GEOMETRY GENERATION
// ============================================
function createSphere(radius, bands) {
    let vertices = [];
    let indices = [];

    for (let lat = 0; lat <= bands; lat++) {
        let theta = lat * Math.PI / bands;
        let sinTheta = Math.sin(theta);
        let cosTheta = Math.cos(theta);

        for (let lon = 0; lon <= bands; lon++) {
            let phi = lon * 2 * Math.PI / bands;
            let sinPhi = Math.sin(phi);
            let cosPhi = Math.cos(phi);

            let x = cosPhi * sinTheta;
            let y = cosTheta;
            let z = sinPhi * sinTheta;

            vertices.push(x * radius, y * radius, z * radius);
            vertices.push(x, y, z);
        }
    }

    for (let lat = 0; lat < bands; lat++) {
        for (let lon = 0; lon < bands; lon++) {
            let first = (lat * (bands + 1)) + lon;
            let second = first + bands + 1;
            indices.push(first, second, first + 1);
            indices.push(second, second + 1, first + 1);
        }
    }

    sphereIndexCount = indices.length;

    sphereBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    sphereIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
}

function resizeCanvasToDisplaySize() {
    const width = gl.canvas.clientWidth;
    const height = gl.canvas.clientHeight;
    if (gl.canvas.width !== width || gl.canvas.height !== height) {
        gl.canvas.width = width;
        gl.canvas.height = height;
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    }
}

// ============================================
// RENDER LOOP
// ============================================
function display() {
    resizeCanvasToDisplaySize();

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const aspect = gl.canvas.width / gl.canvas.height;

    let projectionMatrix = orthographicProjection(-aspect * zoomLevel, aspect * zoomLevel, -1.0 * zoomLevel, 1.0 * zoomLevel, -1.0, 1.0);
    let worldMatrix = identity();
    worldMatrix = multiply(worldMatrix, rotateXMatrix(rotateX * Math.PI / 180));
    worldMatrix = multiply(worldMatrix, rotateYMatrix(rotateY * Math.PI / 180));

    let viewProjectionMatrix = multiply(projectionMatrix, worldMatrix);

    const matrixLocation = gl.getUniformLocation(program, "matrix");
    const uColorLocation = gl.getUniformLocation(program, "uColor");

    const baseColors = {
        'A': [0.0, 0.83, 1.0],
        'T': [1.0, 0.3, 0.54],
        'G': [0.24, 1.0, 0.6],
        'C': [1.0, 0.72, 0.19]
    };

    const numPoints = 28;

    gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereIndexBuffer);

    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 24, 0);

    const normal = gl.getAttribLocation(program, "normal");
    gl.enableVertexAttribArray(normal);
    gl.vertexAttribPointer(normal, 3, gl.FLOAT, false, 24, 12);

    for (let i = 0; i < numPoints; i++) {
        let y = (i / numPoints) * 1.7 - 0.85;
        let angle = i * 0.45;

        let radius = 0.35;
        let x1 = Math.cos(angle) * radius;
        let z1 = Math.sin(angle) * radius;

        let x2 = Math.cos(angle + Math.PI) * radius;
        let z2 = Math.sin(angle + Math.PI) * radius;

        let currentBase = ['A', 'T', 'G', 'C'][i % 4];
        let pairBase = baseData[currentBase].pair;

        let color1 = baseColors[currentBase];
        if (activeFilter && activeFilter !== currentBase) color1 = [0.1, 0.12, 0.15];

        let color2 = baseColors[pairBase];
        if (activeFilter && activeFilter !== pairBase) color2 = [0.1, 0.12, 0.15];

        let bondColor = [0.25, 0.3, 0.4];
        if (activeFilter && activeFilter !== currentBase && activeFilter !== pairBase) bondColor = [0.06, 0.07, 0.09];

        gl.uniform3fv(uColorLocation, new Float32Array(color1));
        let mat1 = multiply(viewProjectionMatrix, translateMatrix(x1, y, z1));
        mat1 = multiply(mat1, scaleMatrix(0.045, 0.045, 0.045));
        gl.uniformMatrix4fv(matrixLocation, false, new Float32Array(mat1));
        gl.drawElements(gl.TRIANGLES, sphereIndexCount, gl.UNSIGNED_SHORT, 0);

        gl.uniform3fv(uColorLocation, new Float32Array(color2));
        let mat2 = multiply(viewProjectionMatrix, translateMatrix(x2, y, z2));
        mat2 = multiply(mat2, scaleMatrix(0.045, 0.045, 0.045));
        gl.uniformMatrix4fv(matrixLocation, false, new Float32Array(mat2));
        gl.drawElements(gl.TRIANGLES, sphereIndexCount, gl.UNSIGNED_SHORT, 0);

        gl.uniform3fv(uColorLocation, new Float32Array(bondColor));
        let midX = (x1 + x2) / 2;
        let midZ = (z1 + z2) / 2;

        let matBond = multiply(viewProjectionMatrix, translateMatrix(midX, y, midZ));
        matBond = multiply(matBond, rotateYMatrix(-angle));
        matBond = multiply(matBond, scaleMatrix(radius, 0.008, 0.008));

        gl.uniformMatrix4fv(matrixLocation, false, new Float32Array(matBond));
        gl.drawElements(gl.TRIANGLES, sphereIndexCount, gl.UNSIGNED_SHORT, 0);
    }
}

// ============================================
// UI & INTERACTION
// ============================================
function toggleSpin() {
    isSpinning = !isSpinning;
    document.getElementById("btnSpin").classList.toggle("active", isSpinning);
}

function closePanel() {
    activeFilter = null;
    document.querySelectorAll('.leg').forEach(el => el.classList.remove('sel', 'dim'));
    document.getElementById("panel").classList.remove("open");
    display();
}

function filterBase(base) {
    if (activeFilter === base) { closePanel(); return; }
    activeFilter = base;
    
    document.querySelectorAll('.leg').forEach(el => {
        if(el.getAttribute('data-base') === base) {
            el.classList.add('sel'); el.classList.remove('dim');
        } else {
            el.classList.remove('sel'); el.classList.add('dim');
        }
    });

    const data = baseData[base];
    const colors = { 'A': '#00d4ff', 'T': '#ff4d8a', 'G': '#3dff9a', 'C': '#ffb830' };
    const pColor = colors[base];

    document.getElementById("p-chip").style.color = pColor;
    document.getElementById("p-chip").innerText = base;
    document.getElementById("p-name").innerText = data.name;
    document.getElementById("p-name").style.color = pColor;
    document.getElementById("p-full").innerText = data.full;
    document.getElementById("p-divider").style.color = pColor;
    
    document.getElementById("p-desc").innerText = data.desc;
    
    document.getElementById("p-stats").innerHTML = `
        <div class="stat"><div class="stat-val">${data.formula}</div><div class="stat-key">Chemical Formula</div></div>
        <div class="stat"><div class="stat-val">${data.weight}</div><div class="stat-key">Mol. Weight</div></div>
        <div class="stat"><div class="stat-val">${data.class}</div><div class="stat-key">Chemical Class</div></div>
        <div class="stat"><div class="stat-val">${data.discovery}</div><div class="stat-key">Discovered By</div></div>
    `;

    document.getElementById("pb1").innerText = base;
    document.getElementById("pb1").style.color = pColor;
    document.getElementById("pn1").innerText = data.name;
    
    document.getElementById("pb2").innerText = data.pair;
    document.getElementById("pb2").style.color = colors[data.pair];
    document.getElementById("pn2").innerText = baseData[data.pair].name;
    
    document.getElementById("pbonds").innerText = data.bonds;
    document.getElementById("pline").style.setProperty('--c1', pColor);
    document.getElementById("pline").style.setProperty('--c2', colors[data.pair]);

    document.getElementById("panel").classList.add("open");
    display(); 
}

function tick(timestamp) {
    if (!lastTime) lastTime = timestamp;
    let elapsed = timestamp - lastTime;
    lastTime = timestamp;

    if (isSpinning) {
        rotateY += (0.02 * elapsed) * spinSpeed;
        display();
    }
    requestAnimationFrame(tick);
}

// ============================================
// INITIALIZATION
// ============================================
function init() {
    const canvas = document.getElementById("c");

    gl = canvas.getContext("webgl");
    if (!gl) { alert("WebGL not supported!"); return; }

    program = createProgram();
    gl.useProgram(program);

    createSphere(1.0, 24);

    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);

    document.getElementById("spd").oninput = function (e) {
        spinSpeed = parseFloat(e.target.value);
        document.getElementById("spd-lbl").innerText = spinSpeed.toFixed(1) + "× Speed";
    };

    let isDragging = false;
    let lastMouseX, lastMouseY;
    canvas.onmousedown = function (e) { isDragging = true; lastMouseX = e.clientX; lastMouseY = e.clientY; };
    window.onmouseup = function () { isDragging = false; };
    window.onmousemove = function (e) {
        if (!isDragging) return;
        let deltaX = e.clientX - lastMouseX;
        let deltaY = e.clientY - lastMouseY;
        rotateY += deltaX * 0.4;
        rotateX += deltaY * 0.4;
        lastMouseX = e.clientX; lastMouseY = e.clientY;
        if (!isSpinning) display();
    };

    window.addEventListener('resize', display);

    canvas.onwheel = function (e) {
        e.preventDefault();
        if (e.deltaY < 0) {
            zoomLevel -= 0.05;
        } else {
            zoomLevel += 0.05;
        }
        zoomLevel = Math.max(0.3, Math.min(zoomLevel, 2.0));

        display();
    };

    display();
    requestAnimationFrame(tick);
}

window.onload = init;