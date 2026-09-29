import {
  Mat3
} from "./matrix3.js";

// Setup WebGL
const canvas =
  document.getElementById(
    "glCanvas"
  );

const gl =
  canvas.getContext(
    "webgl2"
  );

if (!gl) {
  throw new Error(
    "WebGL2 tidak tersedia."
  );
}

// Shader
const vertexShaderSource = `#version 300 es

in vec2 a_position;

uniform mat3 u_matrix;

void main() {
  vec3 p =
    u_matrix *
    vec3(
      a_position,
      1.0
    );

  gl_Position =
    vec4(
      p.xy,
      0.0,
      1.0
    );
}
`;

const fragmentShaderSource = `#version 300 es

precision highp float;

uniform vec4 u_color;

out vec4 outColor;

void main() {
  outColor =
    u_color;
}
`;

// Fungsi compile shader
function createShader(
  gl,
  type,
  source
) {
  const shader =
    gl.createShader(type);

  gl.shaderSource(
    shader,
    source
  );

  gl.compileShader(
    shader
  );

  const success =
    gl.getShaderParameter(
      shader,
      gl.COMPILE_STATUS
    );

  if (!success) {
    const info =
      gl.getShaderInfoLog(
        shader
      );

    gl.deleteShader(
      shader
    );

    throw new Error(
      "Shader compile error:\n" +
      info
    );
  }

  return shader;
}

// Fungsi link program
function createProgram(
  gl,
  vertexShader,
  fragmentShader
) {
  const program =
    gl.createProgram();

  gl.attachShader(
    program,
    vertexShader
  );

  gl.attachShader(
    program,
    fragmentShader
  );

  gl.linkProgram(
    program
  );

  const success =
    gl.getProgramParameter(
      program,
      gl.LINK_STATUS
    );

  if (!success) {
    const info =
      gl.getProgramInfoLog(
        program
      );

    gl.deleteProgram(
      program
    );

    throw new Error(
      "Program link error:\n" +
      info
    );
  }

  return program;
}

const program = createProgram(
    gl,
  createShader(gl,gl.VERTEX_SHADER, vertexShaderSource),
  createShader(gl,gl.FRAGMENT_SHADER, fragmentShaderSource)
);

// Lokasi atribut dan uniform
const aPosition = gl.getAttribLocation(program, "a_position");
const uMatrix = gl.getUniformLocation(program, "u_matrix");
const uColor = gl.getUniformLocation(program, "u_color");

// Latar canvas
gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0.97, 0.97, 0.96, 1);
gl.clear(gl.COLOR_BUFFER_BIT);

// Alat bantu koordinat
const refImg = document.querySelector(".ref");
refImg.addEventListener("click", (e) => {
  const x = Math.round(e.offsetX * refImg.naturalWidth / refImg.clientWidth);
  const y = Math.round(e.offsetY * refImg.naturalHeight / refImg.clientHeight);
  console.log(`${x}, ${y}`);
});

// Fungsi lingkaran
function circlePoints(cx, cy, r, segments) {
  const points = [cx, cy];

  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    points.push(
      cx + Math.cos(a) * r,
      cy + Math.sin(a) * r
    );
  }

  return new Float32Array(points);
}

// Deklarasi objek
const PROJECTION = Mat3.projection(canvas.width, canvas.height);

const outline = 5;

const langit = new Float32Array([
  17, 20,
  1118, 20,
  1118, 315,
  17, 315
]);
const matahari = circlePoints(500, 300, 100, 50);
const matahariOutline = circlePoints(500, 300, 100+outline, 50);
const rumput = new Float32Array([
  17, 315,
  1118, 315,
  1118,730,
  17, 730
]);

const gunungKiriOutline = new Float32Array([
  26-2*outline, 315+outline/2,
  300,145-outline,
  500+2*outline, 315+outline/2
]);
const gunungKiri = new Float32Array([
  26, 315,
  300,145,
  500, 315
]);
const gunungKanan = new Float32Array([
  504, 315,
  746, 128,
  1109,315
]);
const gunungKananOutline = new Float32Array([
  504 - 2*outline, 315+outline/2,
  746 , 128 - outline,
  1109 + 2*outline,315 + outline/2
]);
const jalan = new Float32Array([
  513, 335,
  707 , 730,
  867, 730
]);
const jalanOutline = new Float32Array([
  500, 315,
  707-outline , 730,
  867+outline, 730
]);
const shapeRumput = new Float32Array([
  -20, -36,
   0,   0,
   18, -30
]);
const rumputOuter = new Float32Array([
  -16, 0,
   0, 28,
   16, 0
]);
const rumputInner = new Float32Array([
  -13, 0,
   0, 22,
   13, 0
]);
const batangPohon = new Float32Array([
  150, 471,
  165, 471,
  165, 619,
  128, 625
]);
const batangPohonOutline = new Float32Array([
  145, 471,
  170, 471,
  170, 619,
  123, 625
]);

const daunPohon = circlePoints(0, 0, 50, 60);
const daunPohonOutline = circlePoints(0, 0, 50+outline, 60);
const RumahOutline = new Float32Array([
  388, 542,
  542, 547,
  460, 428,
  297, 420,
  228, 528,
  240, 518,
  239, 615,
  395, 640,
  526, 638,
  528, 542
]);
const atapRumahR = new Float32Array([
  395, 542,
  459, 434,
  533, 542
]);
const atapRumahL = new Float32Array([
  390, 541,
  454, 433,
  300, 425,
  238, 524
]);
const tembokRumahD = new Float32Array([
  400, 635,
  398, 546,
  523, 546,
  521, 633,
]);
const tembokRumahS = new Float32Array([
  244, 610,
  244, 530,
  394, 545,
  395, 634,
]);
const pintuRumahOutline = new Float32Array([
  468, 634,
  471, 563,
  502, 562,
  502, 634,
]);
const pintuRumah = new Float32Array([
  468+5, 634,
  471+5, 563+5,
  502-5, 562+5,
  502-5, 634,
]);
const jendelaDOutline = new Float32Array([
  418, 611,
  415, 563,
  451, 563,
  453, 609,

]);
const jendelaD = new Float32Array([
  418+outline, 611-outline,
  415+outline, 563+outline,
  451-outline, 563+outline,
  453-outline, 609-outline,

]);
const jendelaSOutline = new Float32Array([
  -14, -20,
  -14, 24,
  15, 26,
  16, -17
]);
const jendelaS = new Float32Array([
  -14+outline, -20+outline,
  -14+outline, 24-outline,
  15-outline, 26-outline,
  16-outline, -17+4
]);
const batangLuar = new Float32Array([
  150, 471,
  165, 471,
  165, 523,
  143, 523
]);
const batangLuarOutline = new Float32Array([
  145, 471,
  170, 471,
  170, 523,
  137, 523
]);
const dashJalan = new Float32Array([
  -2, 0,
   2, 0,
  30, 40,
  26, 40
]);
const shapeBurung = new Float32Array([
  -34,  8,
  -24, -2,
  -12, -12,
    0,   4,
   14, -14,
   26,  -2,
   38,  10
]);
const garisMatahari = new Float32Array([
  -2,  0,
   2,  0,
   2, -50,
  -2, -50
]);

// Fungsi membuat mesh
function createMesh(vertices) {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  gl.enableVertexAttribArray(aPosition);
  gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

  return { vao: vao, count: vertices.length / 2 };
}

// Fungsi gambar
function drawMesh(mesh, color) {
  gl.bindVertexArray(mesh.vao);
  gl.uniformMatrix3fv(uMatrix, false, PROJECTION);
  gl.uniform4fv(uColor, color);
  gl.drawArrays(gl.TRIANGLE_FAN, 0, mesh.count);
}

function editableMesh(
  mesh,
  color,
  model = Mat3.identity(),
  mode = gl.TRIANGLE_FAN
) {
  gl.bindVertexArray(mesh.vao);

  const matrix =
    Mat3.multiply(
      PROJECTION,
      model
    );

  gl.uniformMatrix3fv(
    uMatrix,
    false,
    matrix
  );

  gl.uniform4fv(
    uColor,
    color
  );

  gl.drawArrays(
    mode,
    0,
    mesh.count
  );
}

gl.useProgram(program);

// Posisi objek
const leafPositions = [
  [150, 450],
  [180, 430],
  [135, 405],
  [124, 454],
  [191, 460],
  [192,420],
]

const grassPositions = [
  [697,425],
  [899,395],
  [812,435],
  [893,472],
  [771,550],
  [919,537],
  [969,433],
  [769,505],
  [1049,446],
  [955, 680],
  [880, 652],
  [947, 596],
  [1010, 599],
]

const JendelaPosition = [
  [273, 569],
  [314, 573],
  [356, 578],
]

const DashPosition = [
  [566, 413],
  [608, 470],
  [659, 540],
  [700, 604],
  [751, 681],
]
const GarisMatahariData = [
  [405, 205, -0.65],
  [455, 180, -0.30],
  [500, 170,  0],
  [545, 180,  0.30],
  [595, 205,  0.65],
];

// Pembuatan mesh
const meshLangit = createMesh(langit);
const meshMatahariOutline = createMesh(matahariOutline);
const meshMatahari = createMesh(matahari);
const meshRumput = createMesh(rumput);
const meshGunungKiriOutline = createMesh(gunungKiriOutline);
const meshGunungKananOutline = createMesh(gunungKananOutline);
const meshGunungKiri = createMesh(gunungKiri)
const meshGunungKanan = createMesh(gunungKanan);
const meshJalanOutline = createMesh(jalanOutline);
const meshJalan = createMesh(jalan);
const meshShapeRumput = createMesh(shapeRumput);
const meshRumputOuter = createMesh(rumputOuter);
const meshRumputInner = createMesh(rumputInner);
const meshRumahOutline = createMesh(RumahOutline);
const meshAtapRumahR = createMesh(atapRumahR);
const meshAtapRumahL = createMesh(atapRumahL);
const meshTembokRumahD = createMesh(tembokRumahD);
const meshTembokRumahS = createMesh(tembokRumahS);
const meshPintuRumahOutline = createMesh(pintuRumahOutline);
const meshPintuRumah = createMesh(pintuRumah);
const meshJendelaDOutline = createMesh(jendelaDOutline);
const meshJendelaD = createMesh(jendelaD);
const meshJendelaSOutline = createMesh(jendelaSOutline);
const meshJendelaS = createMesh(jendelaS);
const meshBatangPohon = createMesh(batangPohon);
const meshdaunPohon = createMesh(daunPohon);
const meshdaunPohonOutline = createMesh(daunPohonOutline);
const meshBatangPohonOutline = createMesh(batangPohonOutline);
const meshBatangLuar = createMesh(batangLuar);
const meshBatangLuarOutline = createMesh(batangLuarOutline);
const meshDashJalan = createMesh(dashJalan)
const meshBurung = createMesh(shapeBurung);
const meshGarisMatahari = createMesh(garisMatahari);

// Animasi
const DURASI_HARI = 20000;

const meshGelap = createMesh(new Float32Array([
  17, 20,
  1118, 20,
  1118, 730,
  17, 730
]));

gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

// Warna per waktu
const WARNA_LANGIT = [
  [0.00, [0.99, 0.70, 0.50, 1]],  // fajar
  [0.08, [0.678, 0.878, 0.961, 1]],  // pagi
  [0.40, [0.678, 0.878, 0.961, 1]],  // siang
  [0.48, [0.98, 0.59, 0.39, 1]],  // sore
  [0.58, [0.30, 0.25, 0.45, 1]],  // senja
  [0.68, [0.10, 0.13, 0.30, 1]],  // malam
  [0.92, [0.10, 0.13, 0.30, 1]],  // malam
  [1.00, [0.99, 0.70, 0.50, 1]]  // fajar
];

const WARNA_MATAHARI = [
  [0.00, [1.00, 0.45, 0.20, 1]],  // terbit
  [0.10, [0.984, 0.831, 0, 1]],  // kuning
  [0.40, [0.984, 0.831, 0, 1]],
  [0.50, [1.00, 0.45, 0.20, 1]],  // terbenam
  [1.00, [1.00, 0.45, 0.20, 1]]
];

const WARNA_GELAP = [
  [0.00, [0.02, 0.03, 0.15, 0.35]],
  [0.08, [0.02, 0.03, 0.15, 0.00]],  // siang
  [0.40, [0.02, 0.03, 0.15, 0.00]],
  [0.48, [0.02, 0.03, 0.15, 0.15]],
  [0.58, [0.02, 0.03, 0.15, 0.40]],
  [0.68, [0.02, 0.03, 0.15, 0.60]],  // malam
  [0.92, [0.02, 0.03, 0.15, 0.60]],
  [1.00, [0.02, 0.03, 0.15, 0.35]]
];

// Fungsi pencampur warna
function warnaPada(progres, daftar) {
  for (let i = 1; i < daftar.length; i++) {
    const [waktuA, warnaA] = daftar[i - 1];
    const [waktuB, warnaB] = daftar[i];

    if (progres <= waktuB) {
      const t = (progres - waktuA) / (waktuB - waktuA);
      return warnaA.map((nilai, k) => nilai + (warnaB[k] - nilai) * t);
    }
  }
  return daftar[daftar.length - 1][1];
}

// Fungsi gambar pemandangan
function gambarPemandangan() {
  drawMesh(meshRumput, [0.843, 0.914, 0.706, 1]);
  drawMesh(meshGunungKiriOutline, [0, 0, 0, 1]);
  drawMesh(meshGunungKananOutline, [0, 0, 0, 1]);
  drawMesh(meshGunungKiri, [0.557, 0.471, 0.431, 1]);
  drawMesh(meshGunungKanan, [0.557, 0.471, 0.431, 1]);
  drawMesh(meshJalanOutline, [0, 0, 0, 1]);
  drawMesh(meshJalan, [0.792, 0.855, 0.8, 1]);

  drawMesh(meshRumahOutline, [0, 0, 0, 1]);
  drawMesh(meshAtapRumahR, [0.831, 0.231, 0.212, 1]);
  drawMesh(meshAtapRumahL, [0.831, 0.231, 0.212, 1]);
  drawMesh(meshTembokRumahD, [1, 1, 1, 1]);
  drawMesh(meshTembokRumahS, [1, 1, 1, 1]);
  drawMesh(meshPintuRumahOutline, [0, 0, 0, 1]);
  drawMesh(meshPintuRumah, [0.996, 0.988, 0.792, 1]);
  drawMesh(meshJendelaDOutline, [0, 0, 0, 1]);
  drawMesh(meshJendelaD, [0.996, 0.988, 0.792, 1]);

  for (const [x, y] of JendelaPosition) {
    editableMesh(meshJendelaSOutline, [0, 0, 0, 1], Mat3.translation(x, y));
    editableMesh(meshJendelaS, [0.996, 0.988, 0.792, 1], Mat3.translation(x, y));
  }

  for (const [x, y] of grassPositions) {
    editableMesh(meshRumputOuter, [0, 0, 0, 1], Mat3.translation(x, y), gl.TRIANGLES);
    editableMesh(meshRumputInner, [0.843, 0.914, 0.706, 1], Mat3.translation(x, y), gl.TRIANGLES);
  }

  drawMesh(meshBatangPohonOutline, [0, 0, 0, 1]);
  drawMesh(meshBatangPohon, [0.137, 0.275, 0.094, 1]);

  for (const [x, y] of leafPositions) {
    editableMesh(meshdaunPohonOutline, [0, 0, 0, 1], Mat3.translation(x, y));
  }
  for (const [x, y] of leafPositions) {
    editableMesh(meshdaunPohon, [0.42, 0.855, 0.271, 1], Mat3.translation(x, y));
  }

  for (const [x, y] of DashPosition) {
    editableMesh(meshDashJalan, [0, 0, 0, 1], Mat3.translation(x, y));
  }

  drawMesh(meshBatangLuarOutline, [0, 0, 0, 1]);
  drawMesh(meshBatangLuar, [0.137, 0.275, 0.094, 1]);
}

// Fungsi animasi
function render(waktu) {
  const progres = (waktu % DURASI_HARI) / DURASI_HARI;

  const matahariY = 430 - 190 * Math.sin(progres * Math.PI * 2);

  const modelMatahari = Mat3.translation(0, matahariY - 300);

  gl.clear(gl.COLOR_BUFFER_BIT);

  // Langit
  drawMesh(meshLangit, warnaPada(progres, WARNA_LANGIT));

  // Matahari
  editableMesh(meshMatahariOutline, [0, 0, 0, 1], modelMatahari);
  editableMesh(meshMatahari, warnaPada(progres, WARNA_MATAHARI), modelMatahari);

  // Sinar matahari
  if (matahariY < 400) {
    for (const [x, y, sudut] of GarisMatahariData) {
      const model = Mat3.multiply(
        modelMatahari,
        Mat3.multiply(Mat3.translation(x, y), Mat3.rotation(sudut))
      );
      editableMesh(meshGarisMatahari, [0, 0, 0, 1], model);
    }
  }

  // Burung
  editableMesh(meshBurung, [0, 0, 0, 1], Mat3.translation(913, 87), gl.LINE_STRIP);
  editableMesh(meshBurung, [0, 0, 0, 1], Mat3.translation(1020, 170), gl.LINE_STRIP);

  // Pemandangan
  gambarPemandangan();

  // Selubung gelap
  drawMesh(meshGelap, warnaPada(progres, WARNA_GELAP));

  requestAnimationFrame(render);
}

requestAnimationFrame(render);

// Alat bantu perbandingan
const overlay = document.getElementById("overlay");
const opacitySlider = document.getElementById("overlayOpacity");
const opacityLabel = document.getElementById("overlayValue");
const diffCheckbox = document.getElementById("overlayDiff");

function setOverlayOpacity(percent) {
  overlay.style.opacity = percent / 100;
  opacitySlider.value = percent;
  opacityLabel.textContent = percent + "%";
}

opacitySlider.addEventListener("input", () => {
  setOverlayOpacity(Number(opacitySlider.value));
});

diffCheckbox.addEventListener("change", () => {
  overlay.classList.toggle("diff", diffCheckbox.checked);
});

window.addEventListener("keydown", (e) => {
  if (e.key === "o" || e.key === "O") {
    setOverlayOpacity(Number(opacitySlider.value) > 0 ? 0 : 50);
  }
});

const posX = document.querySelector(".posX");
const posY = document.querySelector(".posY");

canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();

  const x =
    (event.clientX - rect.left) *
    (canvas.width / rect.width);

  const y =
    (event.clientY - rect.top) *
    (canvas.height / rect.height);

  posX.textContent = Math.round(x);
  posY.textContent = Math.round(y);

  console.log({
    x: Math.round(x),
    y: Math.round(y)
  });
});
