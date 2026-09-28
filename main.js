// =====================================================================
// main.js — Reproduksi gambar "Pemandangan Gunung" dengan WebGL2 murni
//
// Alur program:
//   1. Setup WebGL2 context + shader
//   2. Fungsi pembentuk PRIMITIF GRAFIS (persegi, poligon, lingkaran,
//      garis tebal, kurva Bezier) → menghasilkan array segitiga
//   3. Semua geometri diunggah SEKALI ke GPU (VAO/VBO) saat inisialisasi
//   4. Setiap frame: hitung model matrix (translasi/rotasi/skala) tiap objek
//      lalu gambar berurutan dari belakang ke depan (painter's algorithm)
//   5. Pemandangan statis; hanya STICKMAN yang bergerak (dikendalikan keyboard)
//
// World space: 1140 x 760 piksel, titik (0,0) di kiri-atas, sumbu Y ke bawah
// (sama seperti koordinat gambar referensi) → dikonversi ke clip space
// oleh matriks proyeksi.
// =====================================================================

// ---------- Konstanta ukuran world ----------
const WORLD_W = 1140;
const WORLD_H = 760;

// ---------- Palet warna (RGBA 0..1), diambil dari gambar referensi ----------
function hex(h, a = 1) {
  const n = parseInt(h.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, a];
}

const COLOR = {
  paper:    hex("#f7f7f5"),
  sky:      hex("#ade0f5"),
  mountain: hex("#8b7570"),
  sun:      hex("#fbd400"),
  field:    hex("#bde2a2"),
  road:     hex("#bdd6cc"),
  trunk:    hex("#1e5a2c"),
  leaf:     hex("#35bf35"),
  roof:     hex("#e0252a"),
  wall:     hex("#ffffff"),
  window:   hex("#fff1b0"),
  ink:      hex("#111111"),   // warna garis "spidol" hitam
  white:    hex("#ffffff"),
  shadow:   hex("#000000", 0.18)
};

// ---------- Parameter stickman (mudah diubah saat demo) ----------
const STICK = {
  speed: 200,           // kecepatan gerak (piksel/detik pada skala 1)
  // batas area tanah — stickman tidak bisa keluar dari sini
  minX: 30, maxX: 1110, minY: 350, maxY: 735,
  // skala perspektif: makin ke atas (jauh) makin kecil
  scaleFar: 0.45, scaleNear: 1.15
};

// =====================================================================
// 1. SETUP WEBGL2
// =====================================================================
const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl2", { antialias: true });

if (!gl) {
  throw new Error("WebGL2 tidak tersedia di browser ini.");
}

// Vertex shader: posisi lokal (vec2) dikali matriks gabungan (proyeksi · model)
const vertexShaderSource = `#version 300 es
in vec2 a_position;
uniform mat3 u_matrix;

void main() {
  vec3 p = u_matrix * vec3(a_position, 1.0);
  gl_Position = vec4(p.xy, 0.0, 1.0);
}
`;

// Fragment shader: satu warna solid per objek
const fragmentShaderSource = `#version 300 es
precision highp float;
uniform vec4 u_color;
out vec4 outColor;

void main() {
  outColor = u_color;
}
`;

// Helper compile shader
function createShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error("Shader compile error:\n" + info);
  }
  return shader;
}

// Helper link program
function createProgram(vs, fs) {
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error("Program link error:\n" + info);
  }
  return program;
}

const program = createProgram(
  createShader(gl.VERTEX_SHADER, vertexShaderSource),
  createShader(gl.FRAGMENT_SHADER, fragmentShaderSource)
);

const aPosition = gl.getAttribLocation(program, "a_position");
const uMatrix = gl.getUniformLocation(program, "u_matrix");
const uColor = gl.getUniformLocation(program, "u_color");

// Matriks proyeksi world (piksel) → clip space, dihitung sekali
const PROJECTION = Mat3.projection(WORLD_W, WORLD_H);

// =====================================================================
// 2. PRIMITIF GRAFIS
// Semua fungsi mengembalikan array angka [x0,y0, x1,y1, ...] berisi
// SEGITIGA (gl.TRIANGLES), sehingga satu mode gambar dipakai untuk semua.
// =====================================================================

// Persegi panjang (2 segitiga)
function geomRect(x, y, w, h) {
  return [
    x, y,     x + w, y,     x + w, y + h,
    x, y,     x + w, y + h, x, y + h
  ];
}

// Poligon konveks → triangle fan (titik 0 sebagai pusat kipas)
function geomPolygon(points) {
  const out = [];
  for (let i = 1; i < points.length - 1; i++) {
    out.push(
      points[0][0], points[0][1],
      points[i][0], points[i][1],
      points[i + 1][0], points[i + 1][1]
    );
  }
  return out;
}

// Titik-titik keliling lingkaran (dipakai lingkaran & sudut membulat)
function arcPoints(cx, cy, r, startRad, endRad, segments) {
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const a = startRad + (endRad - startRad) * (i / segments);
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return pts;
}

// Lingkaran penuh: setiap irisan = 1 segitiga (pusat, titik i, titik i+1)
function geomCircle(cx, cy, r, segments = 48) {
  const out = [];
  const ring = arcPoints(cx, cy, r, 0, Math.PI * 2, segments);
  for (let i = 0; i < segments; i++) {
    out.push(cx, cy, ring[i][0], ring[i][1], ring[i + 1][0], ring[i + 1][1]);
  }
  return out;
}

// Persegi panjang dengan sudut membulat (gabungan 4 busur + poligon)
function roundedRectPoints(x, y, w, h, r) {
  const q = Math.PI / 2;
  return [
    ...arcPoints(x + w - r, y + r,     r, -q,     0,     6),
    ...arcPoints(x + w - r, y + h - r, r, 0,      q,     6),
    ...arcPoints(x + r,     y + h - r, r, q,      2 * q, 6),
    ...arcPoints(x + r,     y + r,     r, 2 * q,  3 * q, 6)
  ];
}

// GARIS TEBAL. WebGL tidak menjamin gl.lineWidth > 1, jadi setiap segmen
// garis dibangun sebagai persegi panjang (2 segitiga) yang tegak lurus
// arah garis, ditambah lingkaran kecil di tiap titik agar sambungan halus
// (efek goresan spidol).
function geomThickLine(points, width, closed = false) {
  const out = [];
  const half = width / 2;
  const n = closed ? points.length : points.length - 1;

  for (let i = 0; i < n; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[(i + 1) % points.length];
    const len = Math.hypot(x1 - x0, y1 - y0) || 1;
    // vektor normal (tegak lurus segmen) sepanjang setengah lebar garis
    const nx = (-(y1 - y0) / len) * half;
    const ny = ((x1 - x0) / len) * half;

    out.push(
      x0 + nx, y0 + ny,  x0 - nx, y0 - ny,  x1 + nx, y1 + ny,
      x0 - nx, y0 - ny,  x1 - nx, y1 - ny,  x1 + nx, y1 + ny
    );
  }
  // sambungan membulat di setiap titik
  for (const [x, y] of points) {
    out.push(...geomCircle(x, y, half, 10));
  }
  return out;
}

// KURVA Bezier kuadratik: B(t) = (1-t)²P0 + 2(1-t)t P1 + t² P2
function bezierQuad(p0, p1, p2, segments = 16) {
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const u = 1 - t;
    pts.push([
      u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
      u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]
    ]);
  }
  return pts;
}

// Interpolasi linear (dipakai garis putus-putus jalan & skala perspektif stickman)
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function lerpPoint(p, q, t) {
  return [lerp(p[0], q[0], t), lerp(p[1], q[1], t)];
}

// =====================================================================
// 3. MESH (VAO + VBO) — geometri diunggah ke GPU satu kali
// =====================================================================
function createMesh(vertices) {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  gl.enableVertexAttribArray(aPosition);
  gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

  gl.bindVertexArray(null);
  return { vao, count: vertices.length / 2 };
}

// Menggambar satu mesh dengan warna & model matrix tertentu
// u_matrix = PROJECTION · model
function drawMesh(mesh, color, model = Mat3.identity()) {
  gl.uniformMatrix3fv(uMatrix, false, Mat3.multiply(PROJECTION, model));
  gl.uniform4fv(uColor, color);
  gl.bindVertexArray(mesh.vao);
  gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
}

// Clipping area gambar (gl.scissor) dalam koordinat world.
// Dipakai agar bagian bawah matahari tidak keluar dari area langit.
function setClip(x, y, w, h) {
  const sx = canvas.width / WORLD_W;
  const sy = canvas.height / WORLD_H;
  gl.enable(gl.SCISSOR_TEST);
  gl.scissor(
    Math.round(x * sx),
    Math.round(canvas.height - (y + h) * sy), // scissor memakai Y dari bawah
    Math.round(w * sx),
    Math.round(h * sy)
  );
}
function clearClip() {
  gl.disable(gl.SCISSOR_TEST);
}

// =====================================================================
// 4. DEKLARASI OBJEK (geometri statis di local space masing-masing)
// Koordinat diambil dari pengamatan gambar referensi (ukuran 1140x760).
// =====================================================================
const INK = 4; // tebal garis tepi hitam

// --- Langit ---
const SKY = { x: 12, y: 18, w: 1103, h: 287 };

// --- Gunung (segitiga) ---
const MOUNTAIN_LEFT = [[35, 315], [295, 145], [506, 306]];
const MOUNTAIN_RIGHT = [[502, 306], [745, 135], [1068, 318]];

// --- Matahari ---
const SUN = { x: 505, y: 250, r: 80 };
const RAY_ANGLES_DEG = [142, 117, 92, 66, 40]; // arah sinar (derajat, 0° = kanan, CCW ke atas)

// --- Sawah/tanah ---
const FIELD_LEFT = [[14, 335], [498, 333], [668, 740], [14, 740]];
const FIELD_RIGHT = [[578, 336], [1118, 346], [1118, 740], [886, 740]];

// --- Jalan (trapesium menuju titik hilang) ---
const ROAD_TOP_L = [510, 316];
const ROAD_TOP_R = [517, 316];
const ROAD_BOT_L = [715, 742];
const ROAD_BOT_R = [870, 742];
const ROAD_CENTER_TOP = [513, 316];
const ROAD_CENTER_BOT = [792, 742];
const DASH_POSITIONS = [0.30, 0.42, 0.55, 0.70, 0.86]; // posisi garis putus-putus (0..1)

// --- Pohon ---
const TREE_PIVOT = [158, 500]; // pivot rotasi goyangan daun (pangkal tajuk)
const CANOPY_CIRCLES = [       // [cx, cy, r] dalam world space
  [125, 420, 36], [190, 412, 34], [120, 468, 30],
  [198, 468, 30], [160, 486, 30], [158, 432, 42], [156, 396, 26]
];

// --- Rumput "V" (posisi pangkal rumput) ---
const GRASS_POSITIONS = [
  [692, 425], [886, 390], [805, 452], [968, 432], [1046, 442],
  [884, 468], [765, 500], [1000, 500], [912, 535], [832, 572],
  [946, 592], [1012, 590], [872, 640], [952, 675]
];

// Wadah semua mesh
const M = {};

function initMeshes() {
  // Langit: persegi sudut membulat
  M.sky = createMesh(geomPolygon(roundedRectPoints(SKY.x, SKY.y, SKY.w, SKY.h, 14)));

  // Gunung: isi segitiga + garis tepi hitam + "halo" putih ala stiker
  M.mountainHalo = createMesh([
    ...geomThickLine(MOUNTAIN_LEFT, 22, true),
    ...geomThickLine(MOUNTAIN_RIGHT, 22, true)
  ]);
  M.mountainFill = createMesh([
    ...geomPolygon(MOUNTAIN_LEFT),
    ...geomPolygon(MOUNTAIN_RIGHT)
  ]);
  M.mountainInk = createMesh([
    ...geomThickLine(MOUNTAIN_LEFT, INK, true),
    ...geomThickLine(MOUNTAIN_RIGHT, INK, true)
  ]);

  // Matahari: lingkaran di local space (pusat = 0,0), outline = lingkaran lebih besar
  M.sunInk = createMesh(geomCircle(0, 0, SUN.r + INK, 64));
  M.sunFill = createMesh(geomCircle(0, 0, SUN.r, 64));
  // Satu sinar: garis horizontal di local space, nanti di-rotasi per sudut
  M.ray = createMesh(geomThickLine([[108, 0], [160, 0]], 5));

  // Burung: dua kurva Bezier (sayap kiri & kanan), pusat di (0,0)
  M.bird = createMesh([
    ...geomThickLine(bezierQuad([-38, 6], [-22, -20], [0, 6]), 4),
    ...geomThickLine(bezierQuad([0, 6], [20, -22], [40, 10]), 4)
  ]);

  // Sawah kiri & kanan
  M.fields = createMesh([...geomPolygon(FIELD_LEFT), ...geomPolygon(FIELD_RIGHT)]);

  // Jalan: isi + dua garis tepi + garis putus-putus di tengah
  M.roadFill = createMesh(geomPolygon([ROAD_TOP_L, ROAD_TOP_R, ROAD_BOT_R, ROAD_BOT_L]));
  const dashes = [];
  for (const s of DASH_POSITIONS) {
    const a = lerpPoint(ROAD_CENTER_TOP, ROAD_CENTER_BOT, s);
    const b = lerpPoint(ROAD_CENTER_TOP, ROAD_CENTER_BOT, s + 0.05 + s * 0.02);
    dashes.push(...geomThickLine([a, b], 3.5));
  }
  M.roadInk = createMesh([
    ...geomThickLine([ROAD_TOP_L, ROAD_BOT_L], INK),
    ...geomThickLine([ROAD_TOP_R, ROAD_BOT_R], INK),
    ...dashes
  ]);

  // Pohon: batang (trapesium) + tajuk (gabungan lingkaran)
  const trunk = [[140, 470], [168, 470], [166, 625], [128, 625]];
  M.trunkFill = createMesh(geomPolygon(trunk));
  M.trunkInk = createMesh(geomThickLine(trunk, INK, true));
  // Tajuk dibuat relatif terhadap pivot, supaya bisa dirotasi di sekitar pivot
  const canopyInk = [];
  const canopyFill = [];
  for (const [cx, cy, r] of CANOPY_CIRCLES) {
    const lx = cx - TREE_PIVOT[0];
    const ly = cy - TREE_PIVOT[1];
    canopyInk.push(...geomCircle(lx, ly, r + INK, 36)); // lingkaran hitam sedikit lebih besar
    canopyFill.push(...geomCircle(lx, ly, r, 36));       // lalu hijau di atasnya → outline gabungan
  }
  M.canopyInk = createMesh(canopyInk);
  M.canopyFill = createMesh(canopyFill);

  // Rumah
  const roofPanel = [[235, 527], [300, 422], [456, 422], [393, 532]];
  const roofGable = [[456, 422], [542, 546], [393, 534]];
  const wallFront = [[240, 528], [393, 532], [393, 634], [240, 618]];
  const wallSide = [[393, 534], [526, 544], [526, 634], [393, 634]];
  const windows = [
    [262, 548, 28, 42], [302, 550, 28, 42], [343, 553, 28, 42], // jendela dinding depan
    [418, 563, 30, 42]                                           // jendela dinding samping
  ];
  const door = [470, 562, 30, 72];

  M.wallFill = createMesh([...geomPolygon(wallFront), ...geomPolygon(wallSide)]);
  M.roofFill = createMesh([...geomPolygon(roofPanel), ...geomPolygon(roofGable)]);
  const winGeom = [];
  const winInk = [];
  for (const [x, y, w, h] of [...windows, door]) {
    winGeom.push(...geomRect(x, y, w, h));
    winInk.push(...geomThickLine([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], 3, true));
  }
  M.windowFill = createMesh(winGeom);
  M.houseInk = createMesh([
    ...geomThickLine(wallFront, INK, true),
    ...geomThickLine(wallSide, INK, true),
    ...geomThickLine(roofPanel, INK, true),
    ...geomThickLine(roofGable, INK, true),
    ...winInk
  ]);

  // Rumput "V" (bentuk centang), pangkal di (0,0) sebagai pivot rotasi
  M.grass = createMesh(geomThickLine([[-9, -26], [0, 0], [15, -22]], 3.5));

  // Stickman — bentuk STATIS (pose tetap), dibuat sekali di local space.
  // Titik (0,0) = telapak kaki; sumbu Y ke bawah, jadi tubuh berada di Y negatif.
  const hip = [0, -46];
  const neck = [0, -92];
  const shoulder = [0, -84];
  const headY = -110;
  const headR = 15;
  M.stickInk = createMesh([
    ...geomThickLine([hip, neck], 5),                           // badan
    ...geomThickLine([[-14, 0], hip, [14, 0]], 5),              // dua kaki
    ...geomThickLine([[-20, -52], shoulder, [20, -52]], 4),     // dua tangan
    ...geomCircle(0, headY, headR + 4, 32)                      // garis tepi kepala
  ]);
  M.stickHeadFill = createMesh(geomCircle(0, headY, headR, 32));
  M.stickFace = createMesh([
    ...geomCircle(6, headY - 3, 2.4, 10),                       // mata (menghadap kanan)
    ...geomThickLine(bezierQuad([2, headY + 5], [7, headY + 9], [11, headY + 3], 8), 2) // senyum
  ]);
  M.shadow = createMesh(geomCircle(0, 0, 24, 32));              // bayangan (di-skala pipih)
}

// =====================================================================
// 5. FUNGSI GAMBAR PER OBJEK
// Semua objek pemandangan STATIS — hanya stickman yang bergerak.
// =====================================================================

// Langit
function drawSky() {
  drawMesh(M.sky, COLOR.sky);
}

// Matahari: lingkaran ditranslasi ke posisinya;
// sinar: satu mesh yang sama di-ROTASI ke 5 sudut berbeda
function drawSun() {
  setClip(SKY.x, SKY.y, SKY.w, SKY.h - 2); // bagian bawah matahari tertutup (hanya area langit)

  drawMesh(M.sunInk, COLOR.ink, Mat3.translation(SUN.x, SUN.y));
  drawMesh(M.sunFill, COLOR.sun, Mat3.translation(SUN.x, SUN.y));

  for (const deg of RAY_ANGLES_DEG) {
    // sumbu Y world mengarah ke bawah → sudut "ke atas" bernilai negatif
    const angle = -deg * Math.PI / 180;
    drawMesh(M.ray, COLOR.ink, Mat3.trs(SUN.x, SUN.y, angle));
  }

  clearClip();
}

// Burung: satu mesh kurva digambar 2x dengan translasi + rotasi + skala berbeda
const BIRDS = [
  { x: 915, y: 82, rot: 0.10, size: 1.0 },
  { x: 1015, y: 160, rot: 0.15, size: 1.1 }
];
function drawBirds() {
  for (const b of BIRDS) {
    drawMesh(M.bird, COLOR.ink, Mat3.trs(b.x, b.y, b.rot, b.size));
  }
}

// Gunung (halo putih → isi coklat → garis hitam)
function drawMountainHalo() {
  drawMesh(M.mountainHalo, COLOR.white);
}
function drawMountains() {
  drawMesh(M.mountainFill, COLOR.mountain);
  drawMesh(M.mountainInk, COLOR.ink);
}

// Sawah + jalan
function drawGround() {
  drawMesh(M.fields, COLOR.field);
  drawMesh(M.roadFill, COLOR.road);
  drawMesh(M.roadInk, COLOR.ink);
}

// Rumput: satu mesh "V" di-translasi ke banyak posisi,
// dengan sedikit variasi rotasi agar tidak terlihat seragam
function drawGrass() {
  GRASS_POSITIONS.forEach(([x, y], i) => {
    const angle = ((i * 37) % 7 - 3) * 0.05; // variasi -0.15 .. 0.15 rad (tetap / tidak acak)
    drawMesh(M.grass, COLOR.ink, Mat3.trs(x, y, angle));
  });
}

// Pohon: batang + tajuk (tajuk disusun relatif terhadap TREE_PIVOT)
function drawTree() {
  drawMesh(M.trunkFill, COLOR.trunk);
  drawMesh(M.trunkInk, COLOR.ink);

  const model = Mat3.translation(TREE_PIVOT[0], TREE_PIVOT[1]);
  drawMesh(M.canopyInk, COLOR.ink, model);
  drawMesh(M.canopyFill, COLOR.leaf, model);
}

// Rumah
function drawHouse() {
  drawMesh(M.wallFill, COLOR.wall);
  drawMesh(M.roofFill, COLOR.roof);
  drawMesh(M.windowFill, COLOR.window);
  drawMesh(M.houseInk, COLOR.ink);
}

// =====================================================================
// 6. STICKMAN — bentuk statis yang dikendalikan pengguna (keyboard/tombol)
// Tidak ada animasi pose; yang berubah hanya TRANSFORMASI-nya:
//   translasi (posisi), skala (perspektif), dan skala-x negatif (arah hadap).
// =====================================================================
const START = { x: 620, y: 690 };

const player = {
  x: START.x,        // posisi telapak kaki di world space
  y: START.y,
  facing: 1          // 1 = menghadap kanan, -1 = kiri (dicerminkan dengan skala-x negatif)
};

// Skala perspektif: makin jauh (Y kecil) makin kecil — interpolasi linear
function perspectiveScale(y) {
  const k = (y - STICK.minY) / (STICK.maxY - STICK.minY);
  return lerp(STICK.scaleFar, STICK.scaleNear, k);
}

// Update posisi berdasarkan tombol yang sedang ditekan (dt = selisih waktu frame)
function updatePlayer(dt) {
  let dx = 0;
  let dy = 0;
  if (keys.has("left")) dx -= 1;
  if (keys.has("right")) dx += 1;
  if (keys.has("up")) dy -= 1;
  if (keys.has("down")) dy += 1;

  if (dx === 0 && dy === 0) return;

  const len = Math.hypot(dx, dy);                                  // normalisasi arah diagonal
  const step = STICK.speed * perspectiveScale(player.y) * dt;      // saat jauh, geraknya lebih pelan
  player.x += (dx / len) * step;
  player.y += (dy / len) * step * 0.6;                             // maju/mundur lebih lambat (kesan kedalaman)

  // batasi agar tetap di area tanah
  player.x = Math.min(STICK.maxX, Math.max(STICK.minX, player.x));
  player.y = Math.min(STICK.maxY, Math.max(STICK.minY, player.y));

  if (dx !== 0) player.facing = Math.sign(dx);
}

function drawStickman() {
  const scale = perspectiveScale(player.y);

  // Bayangan: lingkaran yang di-skala pipih (sy kecil)
  drawMesh(M.shadow, COLOR.shadow, Mat3.trs(player.x, player.y, 0, scale, scale * 0.28));

  // Model matrix: T(posisi) · S(skala perspektif × arah hadap, skala perspektif)
  const model = Mat3.multiply(
    Mat3.translation(player.x, player.y),
    Mat3.scaling(scale * player.facing, scale)
  );
  drawMesh(M.stickInk, COLOR.ink, model);
  drawMesh(M.stickHeadFill, COLOR.white, model);
  drawMesh(M.stickFace, COLOR.ink, model);
}

// =====================================================================
// 7. RENDER LOOP
// =====================================================================
const state = {
  last: 0,
  fpsAcc: 0,
  fpsFrames: 0
};

const hudPos = document.getElementById("hudPos");
const hudScale = document.getElementById("hudScale");
const hudFacing = document.getElementById("hudFacing");
const hudFps = document.getElementById("hudFps");

// Objek yang bisa "menutupi" stickman: diurutkan berdasarkan Y pangkalnya
// (painter's algorithm) → stickman bisa berjalan di belakang rumah/pohon.
const DEPTH_OBJECTS = [
  { baseY: 625, draw: drawTree },
  { baseY: 634, draw: drawHouse }
];

function render(now) {
  const dt = state.last ? Math.min(0.05, (now - state.last) / 1000) : 0;
  state.last = now;

  updatePlayer(dt);

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(...COLOR.paper);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(program);
  gl.enable(gl.BLEND); // untuk bayangan semi-transparan
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  // Latar (selalu di belakang)
  drawSky();
  drawMountainHalo();
  drawSun();
  drawBirds();
  drawMountains();
  drawGround();
  drawGrass();

  // Objek berlapis: urutkan pohon, rumah, dan stickman berdasarkan Y
  const layers = [
    ...DEPTH_OBJECTS,
    { baseY: player.y, draw: drawStickman }
  ].sort((a, b) => a.baseY - b.baseY);
  for (const obj of layers) obj.draw();

  // HUD
  state.fpsAcc += dt;
  state.fpsFrames++;
  if (state.fpsAcc >= 0.5) {
    hudFps.textContent = Math.round(state.fpsFrames / state.fpsAcc);
    state.fpsAcc = 0;
    state.fpsFrames = 0;
  }
  hudPos.textContent = `(${Math.round(player.x)}, ${Math.round(player.y)})`;
  hudScale.textContent = perspectiveScale(player.y).toFixed(2);
  hudFacing.textContent = player.facing > 0 ? "Kanan" : "Kiri";

  requestAnimationFrame(render);
}

// =====================================================================
// 8. KONTROL (keyboard + tombol di layar)
// =====================================================================
const keys = new Set(); // arah yang sedang ditekan: "left" | "right" | "up" | "down"
const overlay = document.getElementById("overlay");

const KEY_DIR = {
  ArrowLeft: "left", a: "left", A: "left",
  ArrowRight: "right", d: "right", D: "right",
  ArrowUp: "up", w: "up", W: "up",
  ArrowDown: "down", s: "down", S: "down"
};

const actions = {
  reset() {
    player.x = START.x;
    player.y = START.y;
    player.facing = 1;
  },
  overlay() { overlay.classList.toggle("show"); }
};

window.addEventListener("keydown", (e) => {
  if (KEY_DIR[e.key]) {
    e.preventDefault();
    keys.add(KEY_DIR[e.key]);
  } else if (e.key === "r" || e.key === "R") {
    actions.reset();
  } else if (e.key === "o" || e.key === "O") {
    actions.overlay();
  }
});

window.addEventListener("keyup", (e) => {
  if (KEY_DIR[e.key]) keys.delete(KEY_DIR[e.key]);
});

// jika jendela kehilangan fokus, lepaskan semua tombol agar stickman tidak jalan terus
window.addEventListener("blur", () => keys.clear());

// Tombol arah di layar: tahan untuk berjalan
document.querySelectorAll("[data-dir]").forEach((btn) => {
  const dir = btn.dataset.dir;
  btn.addEventListener("pointerdown", () => keys.add(dir));
  ["pointerup", "pointerleave", "pointercancel"].forEach((ev) =>
    btn.addEventListener(ev, () => keys.delete(dir))
  );
});

document.querySelectorAll("[data-action]").forEach((btn) => {
  btn.addEventListener("click", () => actions[btn.dataset.action]());
});

// ---------- Mulai ----------
initMeshes();
requestAnimationFrame(render);
