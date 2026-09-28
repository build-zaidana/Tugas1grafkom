// =====================================================================
// matrix3.js — Helper matriks 3x3 (koordinat homogen 2D)
// Format column-major (sesuai uniform mat3 di GLSL), konvensi column-vector:
//   p' = M * p   →   urutan komposisi dibaca dari KANAN ke KIRI.
// =====================================================================

const Mat3 = {
  // Matriks identitas (tidak mengubah apa pun)
  identity() {
    return new Float32Array([
      1, 0, 0,
      0, 1, 0,
      0, 0, 1
    ]);
  },

  // Translasi: menggeser sejauh (tx, ty)
  translation(tx, ty) {
    return new Float32Array([
      1,  0,  0,
      0,  1,  0,
      tx, ty, 1
    ]);
  },

  // Rotasi sebesar rad (radian) terhadap titik asal (0,0).
  // Karena world space kita memakai sumbu Y ke bawah, sudut positif = searah jarum jam.
  rotation(rad) {
    const c = Math.cos(rad);
    const s = Math.sin(rad);

    return new Float32Array([
       c, s, 0,
      -s, c, 0,
       0, 0, 1
    ]);
  },

  // Skala sebesar (sx, sy) terhadap titik asal (0,0)
  scaling(sx, sy) {
    return new Float32Array([
      sx, 0,  0,
      0,  sy, 0,
      0,  0,  1
    ]);
  },

  // Proyeksi: world space piksel (0..width, 0..height, Y ke bawah) → clip space (-1..1, Y ke atas)
  //   x_clip = x * 2/width  - 1
  //   y_clip = y * -2/height + 1
  projection(width, height) {
    return new Float32Array([
      2 / width, 0,           0,
      0,         -2 / height, 0,
      -1,        1,           1
    ]);
  },

  // Menghasilkan A × B (column-major, column-vector convention)
  multiply(a, b) {
    const a00 = a[0], a01 = a[1], a02 = a[2];
    const a10 = a[3], a11 = a[4], a12 = a[5];
    const a20 = a[6], a21 = a[7], a22 = a[8];

    const b00 = b[0], b01 = b[1], b02 = b[2];
    const b10 = b[3], b11 = b[4], b12 = b[5];
    const b20 = b[6], b21 = b[7], b22 = b[8];

    return new Float32Array([
      b00 * a00 + b01 * a10 + b02 * a20,
      b00 * a01 + b01 * a11 + b02 * a21,
      b00 * a02 + b01 * a12 + b02 * a22,

      b10 * a00 + b11 * a10 + b12 * a20,
      b10 * a01 + b11 * a11 + b12 * a21,
      b10 * a02 + b11 * a12 + b12 * a22,

      b20 * a00 + b21 * a10 + b22 * a20,
      b20 * a01 + b21 * a11 + b22 * a21,
      b20 * a02 + b21 * a12 + b22 * a22
    ]);
  },

  // Model matrix standar: M = T(tx,ty) · R(rad) · S(sx,sy)
  // Artinya titik lokal di-SKALA dulu → di-ROTASI → lalu di-TRANSLASI.
  trs(tx, ty, rad = 0, sx = 1, sy = sx) {
    return Mat3.multiply(
      Mat3.multiply(Mat3.translation(tx, ty), Mat3.rotation(rad)),
      Mat3.scaling(sx, sy)
    );
  }
};
