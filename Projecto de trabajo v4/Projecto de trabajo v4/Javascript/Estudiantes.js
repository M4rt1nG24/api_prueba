// =============================
// ⚙️ Configuración inicial
// =============================
let consultas = [];
const idUsuario = localStorage.getItem("id_usuario");
const rolUsuario = localStorage.getItem("rol");
let nombreUsuario = localStorage.getItem("nombre_usuario");
let signatureInstance = null;

// =============================
// 🔒 Seguridad de acceso
// =============================
if (!idUsuario || !rolUsuario) {
    alert("⚠️ Debes iniciar sesión para acceder.");
    window.location.href = "index.html";
} else if (rolUsuario !== "Estudiante") {
    alert("⚠️ No tienes permisos para acceder a esta sección.");
    window.location.href = "index.html";
} else {
    const nombreDiv = document.getElementById("nombreUsuario");
    if (nombreUsuario) {
        nombreDiv.textContent = `Hola, ${nombreUsuario}`;
    } else {
        fetch(`https://api-prueba-2-r35v.onrender.com/estudiante/${idUsuario}`)
            .then(res => res.json())
            .then(data => {
                if (data.success && data.estudiante) {
                    const nombre = data.estudiante.nombre;
                    localStorage.setItem("nombre_usuario", nombre);
                    nombreDiv.textContent = `Hola, ${nombre}`;
                } else {
                    console.warn("⚠️ No se encontró información del estudiante.");
                }
            })
            .catch(err => console.error("Error al obtener el nombre del estudiante:", err));
    }
}

// =============================
// 📥 Obtener consultas del estudiante
// =============================
function obtener_consultas_por_estudiante(id) {
    fetch(`https://api-prueba-2-r35v.onrender.com/consultas_estudiante/${id}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                consultas = data.consultas;
                actualizarTablaConsultas(consultas);
            } else {
                console.error("Error al cargar consultas:", data.message);
            }
        })
        .catch(error => {
            console.error("Error al conectar con el servidor:", error);
        });
}

// =============================
// 🔍 Filtro de consultas
// =============================
function obtenerConsultasFiltradas() {
    const fecha = document.getElementById("buscarFecha").value;
    const hora = document.getElementById("buscarHora").value;
    const mes = document.getElementById("buscarMes").value;
    const docente = document.getElementById("buscarDocente").value;

    let filtradas = [...consultas];

    if (fecha) filtradas = filtradas.filter(c => c.fecha === fecha);
    if (hora) filtradas = filtradas.filter(c => c.hora === hora);
    if (mes) filtradas = filtradas.filter(c => new Date(c.fecha).getMonth() + 1 == mes);
    if (docente) filtradas = filtradas.filter(c => String(c.id_docente) === docente);

    actualizarTablaConsultas(filtradas);
}

// =============================
// 🧾 Renderizar tabla
// =============================
function actualizarTablaConsultas(lista) {
    const tabla = document.querySelector("#tablaconsultas tbody");
    tabla.innerHTML = "";

    lista.forEach(consulta => {
        const fila = tabla.insertRow();
        fila.insertCell(0).textContent = consulta.id || "";
        fila.insertCell(1).textContent = consulta.nombre_estudiante || "";
        fila.insertCell(2).textContent = consulta.nombre_modulo || "";
        fila.insertCell(3).textContent = consulta.tema || "";
        fila.insertCell(4).textContent = consulta.lugar_consulta || "";
        fila.insertCell(5).textContent = consulta.fecha || "";
        fila.insertCell(6).textContent = consulta.hora || "";
        fila.insertCell(7).textContent = consulta.nombre_docente || "";

        const celdaFirmar = fila || "".insertCell(8);
        if (consulta.firma && consulta.firma !== "No Firmado") {
            const img = document.createElement("img");
            img.src = consulta.firma;
            img.alt = "Firma";
            img.style.maxWidth = "100px";
            img.style.maxHeight = "50px";
            celdaFirmar.appendChild(img);
        } else {
            const boton = document.createElement("button");
            boton.textContent = "✍️ Firmar";
            boton.classList.add("btn-firmar");
            boton.onclick = () => abrirModalFirma(consulta.id);
            celdaFirmar.appendChild(boton);
        }
    });
}


// =============================
// ✍️ Modal de firma digital
// =============================
function abrirModalFirma(id_consulta) {
    const modal = document.getElementById("modalFirma");
    modal.style.display = "flex";
    const root = document.getElementById("rootFirma");
    root.innerHTML = "";

    signatureInstance = Signature(root, {
        value: [],
        width: 400,
        height: 200,
        instructions: "Firma aquí para confirmar la asistencia"
    });

    document.getElementById("btnConfirmarFirma").onclick = () => {
        const canvas = root.querySelector("canvas");
        const firmaDataURL = canvas.toDataURL("image/png");

        fetch(`https://api-prueba-2-r35v.onrender.com/firmar_consulta/${id_consulta}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ firma: firmaDataURL })
        })
            .then(res => res.json())
            .then(data => {
                alert(data.message);
                if (data.success) {
                    obtener_consultas_por_estudiante(idUsuario);
                    cerrarModalFirma();
                }
            })
            .catch(err => {
                console.error("Error al firmar:", err);
                alert("❌ Error al intentar firmar la consulta.");
            });
    };
}

function cerrarModalFirma() {
    document.getElementById("modalFirma").style.display = "none";
    signatureInstance = null;
}

// =============================
// 🚀 Cargar al abrir
// =============================
window.onload = () => {
    if (idUsuario) obtener_consultas_por_estudiante(idUsuario);
};

// =============================
// 📚 Cargar datos iniciales
// =============================
document.addEventListener("DOMContentLoaded", () => {
    cargarModulos();
    cargarDocentesSolicitud();
    cargarDocentes();
    obtener_solicitudes_estudiante(idUsuario);

    const formSolicitud = document.getElementById("formSolicitud");
    formSolicitud.addEventListener("submit", async (e) => {
        e.preventDefault();

        const id_estudiante = localStorage.getItem("id_usuario");
        const id_modulo = document.getElementById("modulo").value;
        const id_docente = document.getElementById("docente").value;
        const tema = document.getElementById("tema").value.trim();
        const fecha = document.getElementById("fecha").value;
        const hora = document.getElementById("hora").value;
        const lugar = document.getElementById("lugar").value.trim();

        if (!id_modulo || !id_docente) {
            alert("⚠️ Debes seleccionar un módulo y un docente.");
            return;
        }

        try {
            const res = await fetch("https://api-prueba-2-r35v.onrender.com/solicitar_consulta", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id_estudiante, id_modulo, id_docente, tema, fecha, hora, lugar })
            });
            const data = await res.json();

            if (data.success) {
                alert("✅ Solicitud registrada con éxito");
                formSolicitud.reset();
                obtener_consultas_por_estudiante(id_estudiante);
                cargarDocentes(); // refrescar filtro si hay nuevo docente
            } else {
                alert("❌ Error al registrar la solicitud");
            }
        } catch (error) {
            console.error("Error al enviar solicitud:", error);
            alert("❌ No se pudo enviar la solicitud.");
        }
    });
});

// =============================
// 📘 Cargar módulos
// =============================
async function cargarModulos() {
    try {
        const res = await fetch("https://api-prueba-2-r35v.onrender.com/modulos");
        const data = await res.json();
        const select = document.getElementById("modulo");
        select.innerHTML = '<option value="">Seleccione un módulo</option>';
        (data.modulos || []).forEach(m => {
            const option = document.createElement("option");
            option.value = m.id;
            option.textContent = m.nombre;
            select.appendChild(option);
        });
    } catch (error) {
        console.error("Error cargando módulos:", error);
    }
}

// =============================
// 👨‍🏫 Cargar docentes (todos) para solicitud
// =============================
async function cargarDocentesSolicitud() {
    try {
        const res = await fetch("https://api-prueba-2-r35v.onrender.com/obtener_docentes");
        const data = await res.json();
        const select = document.getElementById("docente");
        select.innerHTML = '<option value="">Seleccione un docente</option>';
        (data.docentes || []).forEach(d => {
            const option = document.createElement("option");
            option.value = d.id;
            option.textContent = d.nombre;
            select.appendChild(option);
        });
    } catch (error) {
        console.error("Error cargando docentes (solicitud):", error);
    }
}

// =============================
// 📋 OBTENER SOLICITUDES DEL ESTUDIANTE
// =============================
function obtener_solicitudes_estudiante(id_estudiante) {
    fetch(`https://api-prueba-2-r35v.onrender.com/obtener_solicitudes_estudiante/${id_estudiante}`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                actualizarTablaSolicitudes(data.solicitudes);
            } else {
                actualizarTablaSolicitudes([]);
            }
        })
        .catch(err => console.error("Error al obtener solicitudes:", err));
}

// =============================
// 🧾 ACTUALIZAR TABLA HTML
// =============================
function actualizarTablaSolicitudes(solicitudes) {
    const tbody = document.querySelector("#tablaSolicitudes tbody");
    tbody.innerHTML = "";

    if (!solicitudes || solicitudes.length === 0) {
        const fila = tbody.insertRow();
        const celda = fila.insertCell(0);
        celda.colSpan = 10;
        celda.textContent = "⚠️ No hay solicitudes de consulta.";
        celda.style.textAlign = "center";
        return;
    }

    solicitudes.forEach(s => {
        const fila = tbody.insertRow();
        fila.insertCell(0).textContent = s.id;
        fila.insertCell(1).textContent = s.nombre_estudiante;
        fila.insertCell(2).textContent = s.nombre_programa || "N/A";
        fila.insertCell(3).textContent = s.nombre_modulo;
        fila.insertCell(4).textContent = s.tema;
        fila.insertCell(5).textContent = s.fecha;
        fila.insertCell(6).textContent = s.hora;
        fila.insertCell(7).textContent = s.lugar_consulta;
        fila.insertCell(8).textContent = s.estado;
        fila.insertCell(9).textContent = s.nombre_docente;
    });
}



// =============================
// 🎯 Cargar docentes con consultas del estudiante (para filtro)
// =============================
async function cargarDocentes() {
    try {
        const res = await fetch(`https://api-prueba-2-r35v.onrender.com/consultas_estudiante/${idUsuario}`);
        const data = await res.json();

        const filtro = document.getElementById("buscarDocente");
        filtro.innerHTML = '<option value="">Seleccione un docente</option>';

        if (data.success && data.consultas.length > 0) {
            const docentesUnicos = [];
            const idsUsados = new Set();

            data.consultas.forEach(c => {
                if (!idsUsados.has(c.id_docente)) {
                    idsUsados.add(c.id_docente);
                    docentesUnicos.push({ id: c.id_docente, nombre: c.nombre_docente });
                }
            });

            docentesUnicos.forEach(d => {
                const option = document.createElement("option");
                option.value = d.id;
                option.textContent = d.nombre;
                filtro.appendChild(option);
            });
        }
    } catch (error) {
        console.error("Error cargando docentes filtrados:", error);
    }
}

// =============================
// 🚪 Cerrar sesión
// =============================
function cerrarSesion() {
    localStorage.clear();
    window.location.href = "index.html";
}


// =============================
// 📑 Tabs
// =============================
function openTab(evt, tabName) {
    document.querySelectorAll(".tabcontent").forEach(tab => tab.style.display = "none");
    document.querySelectorAll(".tablink").forEach(btn => btn.classList.remove("active"));
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.classList.add("active");
}
