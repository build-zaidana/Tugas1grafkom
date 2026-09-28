# Tugas Reproduksi Gambar — WebGL2 Murni

Reproduksi digital gambar pemandangan (gunung, matahari, burung, rumah, pohon, jalan, sawah)
menggunakan **WebGL2 tanpa library**. Gambar referensi ada di `assets/referensi.png` dan
ditampilkan di halaman sebagai `<img>` + link.

Buka `index.html` langsung di browser (tidak perlu server).

## Struktur file
| File | Isi |
|---|---|
| `matrix3.js` | Matriks 3x3: `translation`, `rotation`, `scaling`, `projection`, `multiply`, `trs` (T·R·S) |
| `main.js` | Shader, primitif grafis, deklarasi objek, fungsi gambar, animasi, kontrol |
| `index.html` / `style.css` | Halaman, canvas, gambar referensi, HUD, tombol |

## Primitif grafis (main.js bagian 2)
| Fungsi | Dipakai untuk |
|---|---|
| `geomRect` | jendela, pintu |
| `geomPolygon` (triangle fan) | gunung, sawah, jalan, atap, dinding, batang pohon |
| `geomCircle` | matahari, tajuk pohon, kepala & mata stickman, bayangan |
| `roundedRectPoints` | langit |
| `geomThickLine` | semua garis tepi hitam, sinar matahari, rumput, garis jalan, tubuh & tungkai stickman |
| `bezierQuad` (kurva) | sayap burung, senyum stickman |

Semua primitif menghasilkan segitiga → digambar dengan `gl.TRIANGLES`.
Garis tebal dibuat manual (quad per segmen) karena `gl.lineWidth` > 1 tidak didukung di kebanyakan browser.

## Transformasi
Setiap objek punya geometri di **local space**, lalu di-render dengan
`u_matrix = PROJECTION · T · R · S`.

**Pemandangan (statis)** — tetap memakai transformasi untuk menyusun gambar:
- Sinar matahari: **1 mesh** yang di-**rotasi** ke 5 sudut (`RAY_ANGLES_DEG`).
- Burung: **1 mesh kurva** yang di-translasi, rotasi, dan skala berbeda (`BIRDS`).
- Rumput: **1 mesh "V"** yang di-translasi ke 14 posisi dengan variasi rotasi.
- Matahari & tajuk pohon: di-translasi dari local space ke posisinya.

**Stickman (bentuk statis, dikendalikan pengguna)** — bagian 6 di `main.js`.
Bentuknya tidak dianimasikan; yang berubah hanya transformasinya:

| Konsep | Implementasi |
|---|---|
| Translasi | posisi `player.x/y` berubah selama tombol arah ditahan |
| Skala perspektif | `perspectiveScale(y)`: makin ke atas (jauh) makin kecil (interpolasi linear) |
| Cermin | skala-x = `facing` (1 / -1) sehingga menghadap kiri/kanan |
| Kedalaman | pohon, rumah, stickman diurutkan berdasarkan Y → bisa lewat di belakang rumah |

Model matrix stickman: `T(x, y) · S(skala × facing, skala)`.
Parameter (kecepatan, batas area, skala jauh/dekat) ada di objek `STICK` di awal `main.js`.

## Kontrol
`←→↑↓` / `WASD` gerak · `R` reset posisi · `O` overlay referensi (membandingkan kemiripan).
Tombol di bawah canvas juga bisa ditahan untuk menggerakkan stickman.

## Contoh modifikasi cepat (persiapan challenge)
- Stickman lebih cepat: `STICK.speed`.
- Stickman tidak mengecil: samakan `STICK.scaleFar` dan `STICK.scaleNear`.
- Stickman berwarna: ganti `COLOR.ink` di `drawStickman` dengan warna lain.
- Stickman diputar: ganti model matrix dengan `Mat3.trs(x, y, sudut, skala * facing, skala)`.
- Tambah burung: tambahkan objek ke array `BIRDS`.
- Ganti warna: ubah `COLOR` (mis. `roof: hex("#1e6fd9")`).
- Ubah arah/jumlah sinar: `RAY_ANGLES_DEG`.
- Tambah rumput: tambahkan koordinat ke `GRASS_POSITIONS`.
