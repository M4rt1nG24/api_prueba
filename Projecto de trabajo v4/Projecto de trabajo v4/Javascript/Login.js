document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    loginUsuario();
});

function loginUsuario() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const mensajeLogin = document.getElementById('error-message');

    fetch('https://api-prueba-2-r35v.onrender.com/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }) 
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            localStorage.setItem('id_usuario', username);
            localStorage.setItem('rol', data.rol);
            localStorage.setItem('nombre_usuario',data.nombre)

            if (data.rol === 'Lider') {
                window.location.href = 'Lideres.html';
            } else if (data.rol === 'Docente') {
                window.location.href = 'docentes.html';
            } else if (data.rol === 'Estudiante') {
                window.location.href = 'estudiantes.html';
            }
        } else {
            mensajeLogin.innerText = 'Usuario o contraseña incorrectos.';
        }
    })
    .catch(error => {
        console.error('Error al iniciar sesión:', error);
        mensajeLogin.innerText = 'Error de conexión con el servidor.';
    }); 
}

// =============================
// 📲 Recuperar contraseña
// =============================
document.getElementById("modalRecuperar").addEventListener("click", async () => {
  const documento = document.getElementById("docUsuario").value.trim();
  const correo = document.getElementById("correoUsuario").value.trim();
  const telefono = document.getElementById("telefonoUsuario").value.trim();
  const mensaje = document.getElementById("mensajeRecuperar");

  if (!documento || !correo || !telefono) {
    mensaje.textContent = "Por favor, completa todos los campos.";
    mensaje.style.color = "red";
    return;
  }

  try {
    const response = await fetch("https://api-prueba-2-r35v.onrender.com/recuperar_contraseña", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documento, correo, telefono })
    });

    const data = await response.json();

    if (response.ok) {
      mensaje.textContent = "✅ Nueva contraseña enviada al correo y por SMS.";
      mensaje.style.color = "green";
    } else {
      mensaje.textContent = `❌ ${data.error || "Error al enviar la contraseña."}`;
      mensaje.style.color = "red";
    }
  } catch (error) {
    mensaje.textContent = "⚠️ Error en la conexión con el servidor.";
    mensaje.style.color = "red";
    console.error("Error:", error);
  }
});

