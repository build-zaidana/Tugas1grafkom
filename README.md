# Tugas 1 Grafika Komputer — Reproduksi Gambar dengan WebGL2

**Kelompok:** Adrian Afzal Zaidana (5025241151) — Muhammad Naufal Hadaya Setiawan (5025241181)

Reproduksi digital gambar pemandangan (gunung, matahari, burung, rumah, pohon, jalan, sawah) memakai
**WebGL2 murni** (tanpa library). Semua bentuk digambar lewat kode dari segitiga (`gl.TRIANGLES` / `TRIANGLE_FAN`).

## Cara menjalankan
File memakai script module (`import`), jadi **buka lewat server lokal**, misalnya extension **Live Server**
di VS Code (klik kanan `index.html` → *Open with Live Server*). Jangan klik dua kali file HTML-nya.

## Animasi: siklus pagi → siang → sore → malam
- Matahari dan bulan bergerak di lintasan elips (`sin`/`cos`), bulan berseberangan dengan matahari.
- Langit berganti warna dan seluruh pemandangan ikut menggelap saat malam (interpolasi warna dengan `smoothstep`).
- Sinar matahari berdenyut dan miring mengikuti posisi matahari, bintang berkelip, jendela rumah menyala saat malam.
- Transformasi yang dipakai: translasi, rotasi, dan skala (matriks 3x3, dikomposisi dengan `chain`).

## Kontrol
| Tombol | Fungsi |
|---|---|
| `Space` | jeda / lanjut |
| `↑` / `↓` | percepat / perlambat |
| `O` atau slider | overlay gambar referensi (untuk membandingkan kemiripan) |
| `index.html?p=0.75` | bekukan di titik siklus tertentu (0 = terbit, 0.25 = siang, 0.5 = terbenam, 0.75 = malam) |

## Struktur file
| File | Isi |
|---|---|
| `main.js` | setup WebGL, shader, data bentuk, fungsi gambar, animasi, render loop |
| `matrix3.js` | matriks 3x3: identity, translation, rotation, scaling, projection, multiply |
| `index.html`, `style.css` | halaman, canvas, gambar referensi, kontrol |
| `assets/referensi.png` | gambar referensi |
