// =============================
// 🔒 Seguridad de acceso
// =============================
const idUsuario = localStorage.getItem("id_usuario");
const rolUsuario = localStorage.getItem("rol");
const nombreDocente = localStorage.getItem("nombre_docente") || "Sin docente seleccionado";

if (!idUsuario || !rolUsuario) {
  alert("⚠️ Debes iniciar sesión para acceder.");
  window.location.href = "index.html";
} else if (rolUsuario !== "Docente" && rolUsuario !== "Lider") {
  alert("⚠️ No tienes permisos para acceder a esta sección.");
  window.location.href = "index.html";
}

// =============================
// 📋 CARGAR LISTADO DE ASISTENCIA (FILTRADO)
// =============================
let listaAsistencia = [];

function cargarAsistenciaFiltrada() {
  const filtradas = JSON.parse(localStorage.getItem("consultas_filtradas")) || [];
  listaAsistencia = filtradas;
  mostrarAsistencia(listaAsistencia);
}

// =============================
// 📊 MOSTRAR DATOS EN LA TABLA
// =============================
function mostrarAsistencia(asistencias) {
  const tbody = document.querySelector("tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  // Si no hay registros
  if (!asistencias.length) {
    const fila = document.createElement("tr");
    const celda = document.createElement("td");
    celda.colSpan = 11;
    celda.textContent = "⚠️ No hay registros filtrados para mostrar.";
    celda.style.textAlign = "center";
    fila.appendChild(celda);
    tbody.appendChild(fila);
    return;
  }

  // Renderizar filas
  asistencias.forEach((a, index) => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${index + 1}</td>
      <td>${a.nombre_estudiante || "Sin nombre"}</td>
      <td>${a.tipo_documento || "CC"}</td>
      <td>${a.id_estudiante || "—"}</td>
      <td>${a.tema || "—"}</td>
      <td>${a.nombre_programa || "N/A"}</td>
      <td>${a.nombre_modulo || a.modulo || "Sin módulo"}</td>
      <td>${a.lugar_consulta || "—"}</td>
      <td>${a.fecha || "—"}</td>
      <td>${a.hora || "—"}</td>
    `;

    const celdaFirma = fila.insertCell(10);
    const firmaValor = a.firma ? a.firma.trim() : "";

    if (firmaValor && firmaValor !== "No Firmado") {
      if (firmaValor.toLowerCase().includes("firmado por qr")) {
        celdaFirma.textContent = "📱 Firmado por QR";
        celdaFirma.style.color = "#007bff";
        celdaFirma.style.fontWeight = "bold";
        celdaFirma.style.textAlign = "center";

      // Caso 2: Firma en formato imagen Base64
      } else if (firmaValor.startsWith("data:image")) {
        const img = document.createElement("img");
        img.src = firmaValor;
        img.alt = "Firma del estudiante";
        img.style.maxWidth = "100px";
        img.style.maxHeight = "50px";
        img.style.borderRadius = "4px";
        img.style.boxShadow = "0 0 3px rgba(0,0,0,0.3)";
        celdaFirma.appendChild(img);

      // Caso 3: Texto u otro valor desconocido
      } else {
        celdaFirma.textContent = "⚠️ Formato de firma no reconocido";
        celdaFirma.style.color = "orange";
        celdaFirma.style.textAlign = "center";
      }
    } else {
      // Caso sin firma
      celdaFirma.textContent = "❌ No Firmado";
      celdaFirma.style.color = "red";
      celdaFirma.style.fontWeight = "bold";
      celdaFirma.style.textAlign = "center";
    }

    tbody.appendChild(fila);
  });
}


// =============================
// 🧾 Mostrar programa en encabezado
// =============================
const inputPrograma = document.getElementById("programa_academico");
const programaImpreso = document.getElementById("programa_impreso");

if (inputPrograma) {
  inputPrograma.addEventListener("input", () => {
    if (programaImpreso)
      programaImpreso.textContent = inputPrograma.value.trim() ? `Programa: ${inputPrograma.value.trim()}` : "";
  });
}

// =============================
// ✍️ Modal y canvas para firmas
// =============================
let tipoFirmaActual = null;
let canvas, ctx;
let dibujando = false;

let firmaDocenteData = null;
let firmaDecanoData = null;

// Crear modal único
const modal = document.createElement("div");
modal.className = "modal-firma";
modal.style.display = "none";
modal.innerHTML = `
  <div class="modal-contenido">
    <h3 id="tituloModal">Firma</h3>
    <canvas id="canvasFirma" width="400" height="150"></canvas>
    <div class="botones">
      <button id="btnLimpiar">🧹 Limpiar</button>
      <button id="btnGuardar">💾 Guardar</button>
      <button id="btnCerrar">❌ Cerrar</button>
    </div>
  </div>
`;
document.body.appendChild(modal);

canvas = modal.querySelector("#canvasFirma");
ctx = canvas.getContext("2d");
ctx.lineWidth = 2;
ctx.lineCap = "round";
ctx.strokeStyle = "#000";

function iniciarDibujo(e) {
  dibujando = true;
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
}
function dibujar(e) {
  if (!dibujando) return;
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();
}
function detenerDibujo() {
  dibujando = false;
  ctx.closePath();
}
function getPosTouch(e) {
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
}
function iniciarDibujoTouch(e) {
  e.preventDefault();
  const pos = getPosTouch(e);
  dibujando = true;
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
}
function dibujarTouch(e) {
  e.preventDefault();
  if (!dibujando) return;
  const pos = getPosTouch(e);
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
}
function limpiarFirma() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}
function cerrarModal() {
  modal.style.display = "none";
}

// Guardar firma (solo en memoria, no en localStorage)
function guardarFirma() {
  const imagenFirma = canvas.toDataURL("image/png");
  const img = document.createElement("img");
  img.src = imagenFirma;
  img.style.maxWidth = "120px";
  img.style.maxHeight = "60px";
  img.style.display = "block";
  img.style.margin = "auto";

  if (tipoFirmaActual === "docente") {
    firmaDocenteData = imagenFirma;
    document.getElementById("firmaDocente").innerHTML = "";
    document.getElementById("firmaDocente").appendChild(img);
    const p = document.createElement("p");
    p.textContent = "Firma del Docente";
    p.style.fontSize = "9px";
    document.getElementById("firmaDocente").appendChild(p);
  } else {
    firmaDecanoData = imagenFirma;
    document.getElementById("firmaDecano").innerHTML = "";
    document.getElementById("firmaDecano").appendChild(img);
    const p = document.createElement("p");
    p.textContent = "Firma del Líder o Decano";
    p.style.fontSize = "9px";
    document.getElementById("firmaDecano").appendChild(p);
  }

  cerrarModal();
}

// Eventos canvas
canvas.addEventListener("mousedown", iniciarDibujo);
canvas.addEventListener("mousemove", dibujar);
canvas.addEventListener("mouseup", detenerDibujo);
canvas.addEventListener("mouseleave", detenerDibujo);

canvas.addEventListener("touchstart", iniciarDibujoTouch);
canvas.addEventListener("touchmove", dibujarTouch);
canvas.addEventListener("touchend", detenerDibujo);

// Botones modal
modal.querySelector("#btnLimpiar").addEventListener("click", limpiarFirma);
modal.querySelector("#btnGuardar").addEventListener("click", guardarFirma);
modal.querySelector("#btnCerrar").addEventListener("click", cerrarModal);
modal.addEventListener("click", e => { if (e.target === modal) cerrarModal(); });

// Función global para abrir modal
window.abrirModalFirma = function(tipo) {
  tipoFirmaActual = tipo;
  modal.querySelector("#tituloModal").textContent =
    tipo === "docente" ? "Firma del Docente" : "Firma del Líder o Decano";
  limpiarFirma();
  modal.style.display = "flex";
};

// =============================
// Repetir firmas en la impresión
// =============================
window.addEventListener("beforeprint", () => {
  if (firmaDocenteData) {
    document.querySelectorAll("#firmaDocente").forEach(el => {
      el.innerHTML = `<img src="${firmaDocenteData}" style="max-width:120px;max-height:60px;display:block;margin:auto;"><p>Firma del Docente</p>`;
    });
  }
  if (firmaDecanoData) {
    document.querySelectorAll("#firmaDecano").forEach(el => {
      el.innerHTML = `<img src="${firmaDecanoData}" style="max-width:120px;max-height:60px;display:block;margin:auto;"><p>Firma del Líder o Decano</p>`;
    });
  }
});

// =============================
// Mostrar nombre docente y cargar tabla
// =============================
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("nombre_docente").textContent = nombreDocente;
  cargarAsistenciaFiltrada();
});


// =============================
// 📝 Repetir observaciones al imprimir
// =============================
window.addEventListener("beforeprint", () => {
  const observacionTextarea = document.querySelector(".columna-derecha textarea");
  const textoObservacion = observacionTextarea ? observacionTextarea.value.trim() : "";

  if (textoObservacion) {
    document.querySelectorAll(".columna-derecha").forEach(col => {
      col.innerHTML = `
        <h4>OBSERVACIONES</h4>
        <div class="texto-obs" style="white-space: pre-wrap; font-size:9px;">${textoObservacion}</div>
      `;
    });
  }
});
// // =============================
// 🖨️ Repetir Programa Académico al imprimir
// =============================
window.addEventListener("beforeprint", () => {
  const inputPrograma = document.getElementById("programa_academico");
  const textoPrograma = inputPrograma ? inputPrograma.value.trim() : "";

  if (textoPrograma) {
    // Buscar todos los lugares donde quieras mostrar el programa al imprimir
    document.querySelectorAll(".bloque-pequeno input#programa_academico").forEach(el => {
      // reemplazar input por texto fijo para impresión
      const parent = el.parentElement;
      parent.innerHTML = `<span style="font-size:9px; font-weight:bold;">Programa: ${textoPrograma}</span>`;
    });
  }
});



