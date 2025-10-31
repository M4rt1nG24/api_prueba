let todasLasConsultas = [];
let idUsuario = localStorage.getItem('id_usuario');
let rolUsuario = localStorage.getItem('rol'); // Se obtiene los datos guardados al iniciar sesión
let nombreUsuario = localStorage.getItem("nombre_usuario");


// =============================
// 🔒 Seguridad de acceso
// =============================

if (!idUsuario || !rolUsuario) {
    window.location.href = "index.html";
} else if (rolUsuario !== "Lider") {
    window.location.href = "index.html";
} else {
    // Mostrar nombre almacenado o traer desde backend
    const nombreDiv = document.getElementById("nombreUsuario");

    if (nombreUsuario) {
        if (nombreDiv) nombreDiv.textContent = `Hola, ${nombreUsuario}`;
    } else {
        fetch(`https://api-prueba-2-zc3q.onrender.com/Lider/${idUsuario}`)
            .then(res => res.json())
            .then(data => {
                if (data.success && data.Lider) {
                    const nombre = data.lider.nombre;
                    localStorage.setItem("nombre_usuario", nombre);
                    if (nombreDiv) nombreDiv.textContent = ` ${nombre}`;
                } else {
                    console.warn("⚠️ No se encontró información del docente.");
                }
            })
            .catch(err => console.error("Error al obtener el nombre del docente:", err));
    }
}



// =============================
// 📥 Al cargar la página
// =============================
document.addEventListener("DOMContentLoaded", () => {
    obtener_consultas_lider();
    obtenerDocentes();
    obtener_programas();
    obtenerEstudiantes();
    registrarUsuario();
    obtener_modulos();
    cargarProgramas();

    // ✅ Corregido: el ID debe coincidir con el del formulario HTML
    document.getElementById("registro_programas").addEventListener("submit", e => {
        e.preventDefault();
        registrar_programa();
    });

    document.getElementById("registro_modulo").addEventListener("submit", e => {
        e.preventDefault();
        registrar_modulo();
    });
});

// =============================
// 📥 Consultas
// =============================
function obtener_consultas_lider() {
    fetch("https://api-prueba-2-zc3q.onrender.com/consultas_lider")
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                todasLasConsultas = data.consultas;
                actualizarTablaConsultas(todasLasConsultas);
            }
        })
        .catch(err => console.error("Error:", err));
}

function obtenerConsultasFiltradas() {
    const fecha = document.getElementById("buscarFecha").value;
    const hora = document.getElementById("buscarHora").value;
    const mes = document.getElementById("buscarMes").value;
    const profesor = document.getElementById("buscarProfesor").value;
    const estudiante = document.getElementById("buscarEstudiante").value;

    let filtradas = [...todasLasConsultas];

    // Filtrado por campos
    if (fecha) filtradas = filtradas.filter(c => c.fecha === fecha);
    if (hora) filtradas = filtradas.filter(c => c.hora === hora);
    if (mes) filtradas = filtradas.filter(c => new Date(c.fecha).getMonth() + 1 === parseInt(mes));
    if (profesor) filtradas = filtradas.filter(c => String(c.id_docente) === profesor);
    if (estudiante) filtradas = filtradas.filter(c => String(c.id_estudiante) === estudiante);

    // 🧠 Guardar nombre del docente seleccionado
    let nombre_docente = "";
    if (profesor) {
        const select = document.getElementById("buscarProfesor");
        const opcionSeleccionada = select.options[select.selectedIndex];
        nombre_docente = opcionSeleccionada.textContent;
        localStorage.setItem("nombre_docente", nombre_docente);
    } else {
        localStorage.removeItem("nombre_docente");
    }

    // 🧾 Guardar consultas filtradas
    localStorage.setItem("consultas_filtradas", JSON.stringify(filtradas));

    // 🔄 Actualizar tabla
    actualizarTablaConsultas(filtradas);
}


function actualizarTablaConsultas(consultas) {
    const tbody = document.querySelector("#tablaConsultas tbody");
    tbody.innerHTML = "";

    if (!consultas || consultas.length === 0) {
        const fila = tbody.insertRow();
        const celda = fila.insertCell(0);
        celda.colSpan = 10;
        celda.textContent = "No hay consultas con esos filtros.";
        celda.style.textAlign = "center";
        return;
    }

    consultas.forEach(c => {
        const fila = tbody.insertRow();
        fila.insertCell(0).textContent = c.id;
        fila.insertCell(1).textContent = c.nombre_docente || "Sin nombre";
        fila.insertCell(2).textContent = c.nombre_estudiante || "Sin nombre";
        fila.insertCell(3).textContent = `${c.modulo} - ${c.nombre_modulo}`;
        fila.insertCell(4).textContent = c.tema || "N/A";
        fila.insertCell(5).textContent = c.nombre_programa || "N/A";
        fila.insertCell(6).textContent = c.fecha;
        fila.insertCell(7).textContent = c.hora;
        fila.insertCell(8).textContent = c.lugar_consulta || "N/A";
          // =============================
    // 🖋️ Validación de firma
    // =============================
    const celdaFirma = fila.insertCell(9);
    const firmaValor = c.firma ? c.firma.trim() : "";

    if (firmaValor && firmaValor !== "No Firmado") {

      // Caso 1: Texto "Firmado por QR"
      if (firmaValor.toLowerCase() === "firmado por qr") {
        celdaFirma.textContent = "📱 Firmado por QR";
        celdaFirma.style.color = "#007bff";
        celdaFirma.style.fontWeight = "bold";
        celdaFirma.title = "Firma verificada mediante código QR";

      // Caso 2: Imagen base64 (firma manual)
      } else if (firmaValor.startsWith("data:image")) {
        const img = document.createElement("img");
        img.src = firmaValor;
        img.alt = "Firma del estudiante";
        img.style.maxWidth = "100px";
        img.style.maxHeight = "50px";
        img.style.borderRadius = "4px";
        img.style.boxShadow = "0 0 3px rgba(0,0,0,0.3)";
        celdaFirma.appendChild(img);

      // Caso 3: Valor desconocido o inválido
      } else {
        celdaFirma.textContent = "⚠️ Formato de firma no reconocido";
        celdaFirma.style.color = "orange";
      }

    } else {
      celdaFirma.textContent = "❌ No Firmado";
      celdaFirma.style.color = "red";
      celdaFirma.style.fontWeight = "bold";
    }
    });
}


// =============================
// 📥 Docentes
// =============================
function obtenerDocentes() {
    fetch("https://api-prueba-2-zc3q.onrender.com/obtener_docentes")
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                actualizarTablaDocentes(data.docentes);
                llenarSelectProfesores(data.docentes);
            }
        })
        .catch(err => console.error("Error:", err));
}


// =============================
// 🔍 Filtrar estudiante por documento
// =============================
function obtenerestudianteFiltrado() {
    const input = document.getElementById("documento_usuario");
    const documento = input.value.trim();

    if (!documento) {
        alert("⚠️ Debes ingresar un número de documento para buscar.");
        return;
    }

    fetch("https://api-prueba-2-zc3q.onrender.com/obtener_estudiantes")
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                // Buscar el estudiante por ID (documento)
                const estudiante = data.estudiantes.find(e => String(e.id) === documento);

                const tbody = document.querySelector("#tablaEstudiantes tbody");
                tbody.innerHTML = "";

                if (estudiante) {
                    const fila = tbody.insertRow();
                    fila.insertCell(0).textContent = estudiante.id;
                    fila.insertCell(1).textContent = estudiante.nombre;
                    fila.insertCell(2).textContent = estudiante.nombre_programa;
                } else {
                    const fila = tbody.insertRow();
                    const celda = fila.insertCell(0);
                    celda.colSpan = 3;
                    celda.textContent = "❌ No se encontró ningún estudiante con ese documento.";
                    celda.style.textAlign = "center";
                }
            } else {
                alert("⚠️ Error al obtener estudiantes desde el servidor.");
            }
        })
        .catch(err => {
            console.error("Error al filtrar estudiante:", err);
            alert("❌ Error de conexión con el servidor.");
        });
}

function obtenerDocenteFiltrado() {
    const input = document.getElementById("documento_docente");
    const documento = input.value.trim();

    if (!documento) {
        alert("⚠️ Debes ingresar un número de documento para buscar.");
        return;
    }

    fetch("https://api-prueba-2-zc3q.onrender.com/obtener_docentes")
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                // Buscar el docente por ID (documento)
                const docente = data.docentes.find(e => String(e.id) === documento);

                const tbody = document.querySelector("#tablaDocentes tbody");
                tbody.innerHTML = "";

                if (docente) {
                    const fila = tbody.insertRow();
                    fila.insertCell(0).textContent = docente.id;
                    fila.insertCell(1).textContent = docente.nombre;
                    fila.insertCell(2).textContent = docente.nombre_programa;
                } else {
                    const fila = tbody.insertRow();
                    const celda = fila.insertCell(0);
                    celda.colSpan = 3;
                    celda.textContent = "❌ No se encontró ningún Docente con ese documento.";
                    celda.style.textAlign = "center";
                }
            } else {
                alert("⚠️ Error al obtener Docente desde el servidor.");
            }
        })
        .catch(err => {
            console.error("Error al filtrar Docente:", err);
            alert("❌ Error de conexión con el servidor.");
        });
}



function actualizarTablaDocentes(docentes) {
    const tbody = document.querySelector("#tablaDocentes tbody");
    tbody.innerHTML = "";
    docentes.forEach(d => {
        const fila = tbody.insertRow();
        fila.insertCell(0).textContent = d.id;
        fila.insertCell(1).textContent = d.nombre;
    });
}

function llenarSelectProfesores(docentes) {
    const select = document.getElementById("buscarProfesor");
    select.innerHTML = '<option value="">Todos</option>';
    docentes.forEach(d => {
        const option = document.createElement("option");
        option.value = d.id;
        option.textContent = d.nombre;
        select.appendChild(option);
    });
}

// =============================
// 📥 Estudiantes
// =============================
function obtenerEstudiantes() {
    fetch("https://api-prueba-2-zc3q.onrender.com/obtener_estudiantes")
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                actualizarTablaEstudiantes(data.estudiantes);
                llenarSelectEstudiantes(data.estudiantes);
            }
        })
        .catch(err => console.error("Error:", err));
}

function cargarProgramas() {
    fetch('https://api-prueba-2-zc3q.onrender.com/programas')  
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const programas = data.programas;
                const select = document.getElementById('programaAcademico');
                select.innerHTML = '<<option value="">Seleccione un programa</option>'; 
                programas.forEach(p => {
                    const option = document.createElement('option');
                    option.value = p.id; 
                    option.textContent = p.nombre_programa;
                    select.appendChild(option);
                });
            } else {
                console.error("⚠️ Error al cargar programas:", data);
            }
        })
        .catch(error => console.error('❌ Error al cargar programas:', error));
}



function actualizarTablaEstudiantes(estudiantes) {
    const tbody = document.querySelector("#tablaEstudiantes tbody");
    tbody.innerHTML = "";
    estudiantes.forEach(e => {
        const fila = tbody.insertRow();
        fila.insertCell(0).textContent = e.id;
        fila.insertCell(1).textContent = e.nombre;
        fila.insertCell(2).textContent = e.nombre_programa;
    });
}

function llenarSelectEstudiantes(estudiantes) {
    const select = document.getElementById("buscarEstudiante");
    select.innerHTML = '<option value="">Todos</option>';
    estudiantes.forEach(e => {
        const option = document.createElement("option");
        option.value = e.id;
        option.textContent = e.nombre;
        select.appendChild(option);
    });
}

// =============================
// 📥 Programas
// =============================
function obtener_programas() {
    fetch("https://api-prueba-2-zc3q.onrender.com/programas")
        .then(res => res.json())
        .then(data => {
            if (data.success) actualizarTablaprogramas(data.programas);
        })
        .catch(err => console.error("Error al conectar con el servidor:", err));
}

function actualizarTablaprogramas(programas) {
    const tbody = document.querySelector("#tablaprogramas tbody");
    tbody.innerHTML = "";
    programas.forEach(p => {
        const fila = tbody.insertRow();
        fila.insertCell(0).textContent = p.id;
        fila.insertCell(1).textContent = p.nombre_programa;

    });
}

function registrar_programa() {
    const id = document.getElementById("idPrograma").value.trim();
    const nombre = document.getElementById("nombrePrograma").value.trim();

    if (!id || !nombre) {
        alert("Todos los campos son obligatorios");
        return;
    }

    fetch("https://api-prueba-2-zc3q.onrender.com/programas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, nombre })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
            document.getElementById("registro_programas").reset();
            obtener_programas();
        } else alert("Error: " + data.message);
    })
    .catch(err => console.error("Error al conectar con el servidor:", err));
}

function registrar_modulo() {
    const id = document.getElementById("idModulo").value.trim();
    const nombre = document.getElementById("nombreModulo").value.trim();

    if (!id || !nombre) {
        alert("Todos los campos son obligatorios");
        return;
    }

    fetch("https://api-prueba-2-zc3q.onrender.com/modulos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, nombre })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
            document.getElementById("registro_modulo").reset(); // ✅ corregido ID
            obtener_modulos();
        } else alert("Error: " + data.message);
    })
    .catch(err => console.error("Error al conectar con el servidor:", err));
}

// =============================
// 📥 Módulos
// =============================
function obtener_modulos() {
    fetch("https://api-prueba-2-zc3q.onrender.com/modulos")
        .then(res => res.json())
        .then(data => {
            if (data.success) actualizarTablamodulos(data.modulos);
        })
        .catch(err => console.error("Error al conectar con el servidor:", err));
}

function actualizarTablamodulos(modulos) {
    const tbody = document.querySelector("#tablamodulos tbody");
    tbody.innerHTML = "";
    modulos.forEach(m => {
        const fila = tbody.insertRow();
        fila.insertCell(0).textContent = m.id;
        fila.insertCell(1).textContent = m.nombre;
    });
}

function registrarUsuario() {
    const form = document.getElementById("registroUsuarioForm");
    if (!form) return;

    const selectRol = document.getElementById("rolUsuario");
    const inputPrograma = document.getElementById("programaAcademico");

    if (selectRol && inputPrograma) {
        inputPrograma.value = "";
        inputPrograma.disabled = true;
        inputPrograma.placeholder = "Solo disponible para estudiantes";

        selectRol.addEventListener("change", function () {
            if (this.value === "Estudiante") {
                inputPrograma.disabled = false;
                inputPrograma.placeholder = "Ingrese el programa académico";
            } else {
                inputPrograma.value = "";
                inputPrograma.disabled = true;
                inputPrograma.placeholder = "Solo disponible para estudiantes";
            }
        });

        form.addEventListener("reset", () => {
            inputPrograma.disabled = true;
            inputPrograma.placeholder = "Solo disponible para estudiantes";
        });
    }

    form.addEventListener("submit", e => {
        e.preventDefault();

        const datos = {
            rol: form.rolUsuario.value.trim(),
            id: form.idUsuario.value.trim(),
            nombre: form.nombreUsuario.value.trim(),
            id_programa: inputPrograma.value.trim(),
            contra: form.contraUsuario.value.trim()
        };

        if (!datos.rol || !datos.id || !datos.nombre || !datos.contra) {
            alert("⚠️ Todos los campos son obligatorios.");
            return;
        }

        if (datos.rol === "Estudiante" && !datos.id_programa) {
            alert("⚠️ Debes ingresar el programa académico del estudiante.");
            return;
        }

        if (datos.rol !== "Estudiante") datos.id_programa = "";

        fetch("http://127.0.0.1:5000/registrar_usuario", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert("✅ Usuario registrado con éxito.");
                form.reset();

                inputPrograma.disabled = true;
                inputPrograma.placeholder = "Solo disponible para estudiantes";

                obtenerDocentes();
                obtenerEstudiantes();
                cargarProgramas();
            } else {
                alert("❌ Error al registrar usuario: " + (data.message || "Desconocido"));
            }
        })
        .catch(err => {
            console.error("Error:", err);
            alert("⚠️ Error en la conexión con el servidor.");
        });
    });
}


function cargarProgramas() {
    fetch('http://127.0.0.1:5000/programas')  
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const programas = data.programas;
                const select = document.getElementById('programaAcademico');
                select.innerHTML = '<option value="">Seleccione un programa</option>'; 
                programas.forEach(p => {
                    const option = document.createElement('option');
                    option.value = p.id; 
                    option.textContent = p.nombre_programa;
                    select.appendChild(option);
                });
            } else {
                console.error(" Error al cargar programas:", data);
            }
        })
        .catch(error => console.error(' Error al cargar programas:', error));
}

cargarProgramas();



// =============================
// ⚙️ Utilidades
// =============================
function openTab(evt, tabName) {
    document.querySelectorAll(".tabcontent").forEach(tab => tab.classList.remove("active"));
    document.querySelectorAll(".tablink").forEach(btn => btn.classList.remove("active"));
    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.classList.add("active");
}

function exportarExcel() {
    let tabla = document.getElementById("tablaConsultas");
    let wb = XLSX.utils.table_to_book(tabla, { sheet: "Consultas" });
    XLSX.writeFile(wb, "Consultas.xlsx");
}

function exportarformato() {
    window.location.href = "ejemplo_formato.html";
}

function cerrarSesion() {
    localStorage.clear();
    window.location.href = "index.html";
}

