
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById('registroForm');

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Obtener valores del formulario
        let nombre = document.getElementById('nombreCompleto').value.trim();
        let numeroDoc = document.getElementById('numeroDocumento').value.trim();
        let id_programa = document.getElementById('programaAcademico').value;
        let contra = document.getElementById('contra').value.trim();

        // =============================
        // 🔒 Validaciones de seguridad
        // =============================

        // 1. Validar campos vacíos
        if (!nombre || !numeroDoc || !id_programa || !contra) {
            alert("⚠️ Todos los campos son obligatorios");
            return;
        }

        // 2. Validar nombre (solo letras y espacios, mínimo 3 caracteres)
        const regexNombre = /^[A-Za-zÁÉÍÓÚÑáéíóúñ\s]{3,50}$/;
        if (!regexNombre.test(nombre)) {
            alert("⚠️ El nombre solo puede contener letras y debe tener al menos 3 caracteres");
            return;
        }

        // 3. Validar número de documento (solo dígitos, entre 6 y 12)
        const regexDoc = /^[0-9]{6,12}$/;
        if (!regexDoc.test(numeroDoc)) {
            alert("⚠️ El número de documento debe contener entre 6 y 12 dígitos");
            return;
        }

        // 4. Validar contraseña segura (mínimo 8 caracteres, mayúscula, minúscula, número y símbolo)
        const regexContra = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
        if (!regexContra.test(contra)) {
            alert("⚠️ La contraseña debe tener mínimo 8 caracteres, incluir mayúscula, minúscula, número y símbolo");
            return;
        }


        let datos = {
            id: numeroDoc,
            nombre: nombre,
            id_programa: id_programa,
            rol: "Estudiante",
            contra: contra
        };

        // =============================
        // Enviar datos al backend
        // =============================
        fetch('https://api-prueba-2-r35v.onrender.com/registrar_usuario', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(' Estudiante registrado exitosamente');
                form.reset();
            } else {
                alert('⚠️ ' + (data.error || 'El estudiante ya está registrado'));
            }
        })
        .catch(error => {
            console.error(' Error al enviar la solicitud:', error);
            alert('Error de conexión con el servidor');
        });
    });
});

// =============================
// 📚 Cargar Programas
// =============================
function cargarProgramas() {
    fetch('https://api-prueba-2-r35v.onrender.com/programas')  
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



