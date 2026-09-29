import {
  Mat3
} from "./matrix3.js";

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

// Mengubah teks shader menjadi program GPU
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


// Menggabungkan vertex + fragment shader menjadi satu program
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


// Alamat variabel shader, dipakai untuk mengirim data dari JavaScript
const aPosition = gl.getAttribLocation(program, "a_position");
const uMatrix = gl.getUniformLocation(program, "u_matrix");
const uColor = gl.getUniformLocation(program, "u_color");

//isi canvas dengan warna kertas 
gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0.97, 0.97, 0.96, 1);
gl.clear(gl.COLOR_BUFFER_BIT);


// ALAT BANTU SEMENTARA: klik gambar referensi → koordinat piksel muncul di Console
const refImg = document.querySelector(".ref");
refImg.addEventListener("click", (e) => {
  // Gambar tampil diperkecil di halaman, jadi posisi klik dikonversi ke ukuran asli
  const x = Math.round(e.offsetX * refImg.naturalWidth / refImg.clientWidth);
  const y = Math.round(e.offsetY * refImg.naturalHeight / refImg.clientHeight);
  console.log(`${x}, ${y}`);
});

// Membuat titik-titik lingkaran untuk gl.TRIANGLE_FAN
// cx, cy = pusat; r = jari-jari; segments = jumlah potongan
function circlePoints(cx, cy, r, segments) {
  const points = [cx, cy]; // titik pertama = pusat kipas

  for (let i = 0; i <= segments; i++) {           // <= agar titik terakhir menutup lingkaran
    const a = (i / segments) * Math.PI * 2;        // sudut titik ke-i (radian)
    points.push(
      cx + Math.cos(a) * r,
      cy + Math.sin(a) * r
    );
  }

  return new Float32Array(points);
}


const PROJECTION = Mat3.projection(canvas.width, canvas.height);

const outline = 5;

const langit = new Float32Array([
  17, 20,      // A
  1118, 20,    // B
  1118, 315,   // C
  17, 315      // D
]);
const matahari = circlePoints(500, 300, 100, 50);
const matahariOutline = circlePoints(500, 300, 100+outline, 50);
const rumput = new Float32Array([
  17, 315,      // A
  1118, 315,    // B
  1118,730,     // C
  17, 730       // D
]);

const gunungKiriOutline = new Float32Array([
  26-2*outline, 315+outline/2,      // A
  300,145-outline,                  // B
  500+2*outline, 315+outline/2      // C
]);
const gunungKiri = new Float32Array([
  26, 315,      // A
  300,145,      // B
  500, 315      // C
]);
const gunungKanan = new Float32Array([
  504, 315,     // A
  746, 128,     // B
  1109,315      // C
]);
const gunungKananOutline = new Float32Array([
  504 - 2*outline, 315+outline/2,     // A
  746 , 128 - outline,                // B
  1109 + 2*outline,315 + outline/2    // C
]);
const jalan = new Float32Array([
  513, 335,     // A
  707 , 730,    // B
  867, 730      // C
]);
const jalanOutline = new Float32Array([
  500, 315,     // A
  707-outline , 730,    // B
  867+outline, 730      // C
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
  150, 471, // kiri atas
  165, 471,   // kanan atas
  165, 619, // kanan bawah
  128, 625    // kiri bawah
]);
const batangPohonOutline = new Float32Array([
  145, 471, // kiri atas
  170, 471,   // kanan atas
  170, 619, // kanan bawah
  123, 625    // kiri bawah
]);

const daunPohon = circlePoints(0, 0, 50, 60);
const daunPohonOutline = circlePoints(0, 0, 50+outline, 60);
const RumahOutline = new Float32Array([
  388, 542,     // A
  542, 547,     // B
  460, 428,     // C
  297, 420,     //D
  228, 528,      //E
  240, 518,
  239, 615,
  395, 640,
  526, 638,
  528, 542 
]);
const atapRumahR = new Float32Array([
  395, 542,     // A
  459, 434,     // B
  533, 542      // C
]);
const atapRumahL = new Float32Array([
  390, 541,     // A
  454, 433,     // C
  300, 425,     //D
  238, 524      //E
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
  150, 471, // kiri atas
  165, 471,   // kanan atas
  165, 523, // kanan bawah
  143, 523    // kiri bawah
]);
const batangLuarOutline = new Float32Array([
  145, 471, // kiri atas
  170, 471,   // kanan atas
  170, 523, // kanan bawah
  137, 523    // kiri bawah
]);
const dashJalan = new Float32Array([
  -2, 0,      // kiri atas
   2, 0,      // kanan atas
  30, 40,     // kanan bawah   (28 ke kanan, 40 ke bawah = kemiringan jalan)
  26, 40      // kiri bawah
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

// Gambar satu objek dengan warna tertentu
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

// =====================================================================
// ANIMASI: matahari naik-turun + warna langit berganti (pagi → malam → pagi)
// Hanya dua hal yang bergerak: posisi matahari dan warna.
// =====================================================================

// Lama satu hari penuh (milidetik). Ubah angka ini untuk mempercepat / memperlambat.
const DURASI_HARI = 20000;

// Selubung gelap: persegi menutupi seluruh gambar, makin gelap saat malam
const meshGelap = createMesh(new Float32Array([
  17, 20,
  1118, 20,
  1118, 730,
  17, 730
]));

// Agar warna dengan alpha (transparan) bisa dicampur dengan gambar di belakangnya
gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

// ---------- Daftar warna per waktu ----------
// Format: [progres hari, [R, G, B, A]]
// progres 0 = fajar, 0.25 = siang, 0.5 = sore, 0.75 = tengah malam, 1 = fajar lagi

const WARNA_LANGIT = [
  [0.00, [0.99, 0.70, 0.50, 1]],     // fajar (oranye)
  [0.08, [0.678, 0.878, 0.961, 1]],  // pagi (biru muda)
  [0.40, [0.678, 0.878, 0.961, 1]],  // siang
  [0.48, [0.98, 0.59, 0.39, 1]],     // sore (oranye)
  [0.58, [0.30, 0.25, 0.45, 1]],     // senja (ungu)
  [0.68, [0.10, 0.13, 0.30, 1]],     // malam (biru tua)
  [0.92, [0.10, 0.13, 0.30, 1]],     // malam
  [1.00, [0.99, 0.70, 0.50, 1]]      // fajar lagi
];

const WARNA_MATAHARI = [
  [0.00, [1.00, 0.45, 0.20, 1]],     // baru terbit (oranye)
  [0.10, [0.984, 0.831, 0, 1]],      // kuning
  [0.40, [0.984, 0.831, 0, 1]],
  [0.50, [1.00, 0.45, 0.20, 1]],     // mau terbenam (oranye)
  [1.00, [1.00, 0.45, 0.20, 1]]
];

// Warna hitam-biru transparan yang ditumpuk di atas semuanya (nilai terakhir = kegelapan)
const WARNA_GELAP = [
  [0.00, [0.02, 0.03, 0.15, 0.35]],
  [0.08, [0.02, 0.03, 0.15, 0.00]],  // siang: tidak gelap
  [0.40, [0.02, 0.03, 0.15, 0.00]],
  [0.48, [0.02, 0.03, 0.15, 0.15]],
  [0.58, [0.02, 0.03, 0.15, 0.40]],
  [0.68, [0.02, 0.03, 0.15, 0.60]],  // malam: paling gelap
  [0.92, [0.02, 0.03, 0.15, 0.60]],
  [1.00, [0.02, 0.03, 0.15, 0.35]]
];

// Mencari warna di antara dua titik warna terdekat (campuran halus)
function warnaPada(progres, daftar) {
  for (let i = 1; i < daftar.length; i++) {
    const [waktuA, warnaA] = daftar[i - 1];
    const [waktuB, warnaB] = daftar[i];

    if (progres <= waktuB) {
      const t = (progres - waktuA) / (waktuB - waktuA);   // 0..1 di antara kedua titik
      return warnaA.map((nilai, k) => nilai + (warnaB[k] - nilai) * t);
    }
  }
  return daftar[daftar.length - 1][1];
}

// ---------- Pemandangan yang tidak bergerak ----------
function gambarPemandangan() {
  drawMesh(meshRumput, [0.843, 0.914, 0.706, 1]);        // ijo rumput
  drawMesh(meshGunungKiriOutline, [0, 0, 0, 1]);         // hitam
  drawMesh(meshGunungKananOutline, [0, 0, 0, 1]);        // hitam
  drawMesh(meshGunungKiri, [0.557, 0.471, 0.431, 1]);    // coklat
  drawMesh(meshGunungKanan, [0.557, 0.471, 0.431, 1]);   // coklat
  drawMesh(meshJalanOutline, [0, 0, 0, 1]);              // hitam
  drawMesh(meshJalan, [0.792, 0.855, 0.8, 1]);           // ijo jalan

  drawMesh(meshRumahOutline, [0, 0, 0, 1]);              // hitam
  drawMesh(meshAtapRumahR, [0.831, 0.231, 0.212, 1]);    // merah atap
  drawMesh(meshAtapRumahL, [0.831, 0.231, 0.212, 1]);    // merah atap
  drawMesh(meshTembokRumahD, [1, 1, 1, 1]);              // putih
  drawMesh(meshTembokRumahS, [1, 1, 1, 1]);              // putih
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

// ---------- Render loop: dipanggil ulang ~60 kali per detik ----------
function render(waktu) {
  // progres = posisi dalam satu hari (0 sampai 1, lalu mengulang dari 0)
  const progres = (waktu % DURASI_HARI) / DURASI_HARI;

  // Posisi matahari: naik-turun mengikuti gelombang sin
  //   y = 430 → di bawah horizon (tersembunyi), y = 240 → puncak siang
  const matahariY = 430 - 190 * Math.sin(progres * Math.PI * 2);

  // Bentuk matahari digambar di y = 300, jadi cukup digeser (translasi) sisanya
  const modelMatahari = Mat3.translation(0, matahariY - 300);

  gl.clear(gl.COLOR_BUFFER_BIT);

  // 1. Langit (warna berganti)
  drawMesh(meshLangit, warnaPada(progres, WARNA_LANGIT));

  // 2. Matahari: tepi hitam dulu, lalu isi kuning di atasnya
  editableMesh(meshMatahariOutline, [0, 0, 0, 1], modelMatahari);
  editableMesh(meshMatahari, warnaPada(progres, WARNA_MATAHARI), modelMatahari);

  // 3. Sinar matahari ikut bergeser bersama matahari (hanya saat matahari di atas horizon)
  if (matahariY < 400) {
    for (const [x, y, sudut] of GarisMatahariData) {
      const model = Mat3.multiply(
        modelMatahari,                                        // geser ke posisi matahari
        Mat3.multiply(Mat3.translation(x, y), Mat3.rotation(sudut))
      );
      editableMesh(meshGarisMatahari, [0, 0, 0, 1], model);
    }
  }

  // 4. Burung
  editableMesh(meshBurung, [0, 0, 0, 1], Mat3.translation(913, 87), gl.LINE_STRIP);
  editableMesh(meshBurung, [0, 0, 0, 1], Mat3.translation(1020, 170), gl.LINE_STRIP);

  // 5. Gunung, sawah, jalan, rumah, pohon (menutupi matahari yang sedang terbenam)
  gambarPemandangan();

  // 6. Selubung gelap di paling atas: makin malam makin pekat
  drawMesh(meshGelap, warnaPada(progres, WARNA_GELAP));

  requestAnimationFrame(render);
}

requestAnimationFrame(render);

// ---------- ALAT BANTU COMPARE: overlay referensi di atas canvas ----------
const overlay = document.getElementById("overlay");
const opacitySlider = document.getElementById("overlayOpacity");
const opacityLabel = document.getElementById("overlayValue");
const diffCheckbox = document.getElementById("overlayDiff");

// Atur transparansi overlay (0 = tak terlihat, 100 = menutupi penuh)
function setOverlayOpacity(percent) {
  overlay.style.opacity = percent / 100;
  opacitySlider.value = percent;
  opacityLabel.textContent = percent + "%";
}

// Slider digeser → ubah transparansi
opacitySlider.addEventListener("input", () => {
  setOverlayOpacity(Number(opacitySlider.value));
});

// Checkbox → nyalakan/matikan mode difference
diffCheckbox.addEventListener("change", () => {
  overlay.classList.toggle("diff", diffCheckbox.checked);
});

// Tombol O → overlay on/off cepat (0% ↔ 50%)
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
