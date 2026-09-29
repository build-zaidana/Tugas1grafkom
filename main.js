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

const posX = document.querySelector(".posX");
const posY = document.querySelector(".posY");

canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();

  // Posisi mouse relatif terhadap canvas, 0 sampai 1
  const x01 = (event.clientX - rect.left) / rect.width;
  const y01 = (event.clientY - rect.top) / rect.height;

  // Ubah ke koordinat WebGL: -1 sampai 1
  const x = x01 * 2 - 1;
  const y = 1 - y01 * 2;

  // console.log({ x, y });

  posX.textContent = x.toFixed(2);
  posY.textContent = y.toFixed(2);
});




const aPosition = gl.getAttribLocation(program, "a_position");
const uMatrix = gl.getUniformLocation(program, "u_matrix");
const uColor = gl.getUniformLocation(program, "u_color");

// ---------- Uji Tahap 1: isi canvas dengan warna kertas ----------
gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0.97, 0.97, 0.96, 1);
gl.clear(gl.COLOR_BUFFER_BIT);
