from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
import smtplib
from email.message import EmailMessage
import os
import secrets


app = Flask(__name__)
app.secret_key = "super_secret_key_123"

CORS(app, resources={r"/*": {"origins": "https://consultas-iub.netlify.app"}})


# ==========================
# CONEXIÓN
# ==========================
def obtener_conexion():
    return mysql.connector.connect(
        host="consultas-iub-db.crowmwmuizav.us-east-2.rds.amazonaws.com",  # 👈 tu endpoint exacto
        user="admin",            # 👈 usuario de RDS
        password="ADMIN12345",  # 👈 reemplázala con tu contraseña real
        database="consultas_iub",  # 👈 nombre exacto del schema
        port=3306
    )


# ==========================
# LOGIN
# ==========================
@app.route('/login', methods=['POST'])
def loginUsuario():
    datos = request.get_json(force=True)
    username = datos['username']
    password = datos['password']

    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)

    cursor.execute("SELECT id, nombre, rol, contraseña FROM usuarios WHERE id = %s", (username,))
    resultado = cursor.fetchone()

    cursor.close()
    conexion.close()

    if resultado and resultado['contraseña'] == password:
        return jsonify({
            'success': True,
            'rol': resultado['rol'],
            'id': resultado['id'],
            'nombre': resultado['nombre']   # ✅ clave corregida
        })
    return jsonify({'success': False, 'message': 'Usuario o contraseña incorrectos'})



# ==========================
# PROGRAMAS ACADÉMICOS
# ==========================
@app.route('/programas', methods=['GET'])
def obtener_programas():
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    cursor.execute("SELECT id, nombre_programa FROM programas_academicos")
    programas = cursor.fetchall()
    cursor.close()
    conexion.close()
    return jsonify({"success": True, "programas": programas})


# ==========================
# MODULOS
# ==========================
@app.route('/modulos', methods=['GET'])
def obtener_modulos():
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    cursor.execute("SELECT id, nombre FROM modulos")
    modulos = cursor.fetchall()
    cursor.close()
    conexion.close()
    return jsonify({"success": True, "modulos": modulos})

# ==========================
# Registro de modulo
# ==========================
@app.route('/modulos', methods=['POST'])
def registrar_modulo():
    data = request.get_json()
    nombre = data.get("nombre")
    id = data.get("id")

    if not nombre:
        return jsonify({"success": False, "message": "El nombre es obligatorio"}), 400

    conexion = obtener_conexion()
    cursor = conexion.cursor()
    try:
        cursor.execute("INSERT INTO modulos (id,nombre) VALUES (%s,%s)", (id, nombre))
        conexion.commit()
        return jsonify({"success": True, "message": "Módulo registrado exitosamente"})
    except Exception as e:
        conexion.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        conexion.close()

# ==========================
# SOLICITAR CONSULTA (Estudiante)
# ==========================
@app.route('/solicitar_consulta', methods=['POST'])
def solicitar_consulta():
    try:
        data = request.get_json()
        id_estudiante = data.get("id_estudiante")
        id_docente = data.get("id_docente")
        id_modulo = data.get("id_modulo")
        tema = data.get("tema")
        fecha = data.get("fecha")
        hora = data.get("hora")
        lugar = data.get("lugar")

        conexion = obtener_conexion()
        cursor = conexion.cursor()

        cursor.execute("""
            INSERT INTO solicitudes_consultas (id_estudiante, id_docente, id_modulo, tema, fecha, hora, lugar_consulta, estado)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'Pendiente')
        """, (id_estudiante, id_docente, id_modulo, tema, fecha, hora, lugar))

        conexion.commit()
        cursor.close()
        conexion.close()

        return jsonify({"success": True, "message": "Solicitud enviada con éxito ✅"})

    except Exception as e:
        print("❌ Error en solicitar_consulta:", e)
        return jsonify({"success": False, "error": str(e)}), 500
    
# ==========================
# Registrar Programa
# ==========================


@app.route('/programas', methods=['POST'])
def registrar_programas():
    data = request.get_json()
    nombre = data.get("nombre")
    id = data.get("id")

    if not nombre or not id:
        return jsonify({"success": False, "message": "Todos los campos son obligatorios"}), 400

    conexion = obtener_conexion()
    cursor = conexion.cursor()
    try:
        cursor.execute("INSERT INTO programas_academicos (id, nombre_programa) VALUES (%s, %s)", (id, nombre))
        conexion.commit()
        return jsonify({"success": True, "message": "Programa registrado exitosamente"})
    except Exception as e:
        conexion.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        conexion.close()

# ==========================
# USUARIOS
# ==========================
@app.route('/obtener_docentes', methods=['GET'])
def obtener_docentes():
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    cursor.execute("SELECT * FROM usuarios WHERE rol = 'Docente'")
    docentes = cursor.fetchall()
    cursor.close()
    conexion.close()
    return jsonify({'success': True, 'docentes': docentes})

@app.route('/obtener_solicitudes_docente/<int:id_docente>', methods=['GET'])
def obtener_solicitudes_docente(id_docente):
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    cursor.execute("""
        SELECT s.id, s.id_estudiante, s.tema, s.fecha, s.hora, s.lugar_consulta,
               e.nombre AS nombre_estudiante, p.nombre_programa, m.nombre AS nombre_modulo, s.estado
        FROM solicitudes_consultas s
        JOIN usuarios e ON s.id_estudiante = e.id
        LEFT JOIN programas_academicos p ON e.id_programa = p.id
        JOIN modulos m ON s.id_modulo = m.id
        WHERE s.id_docente = %s
        ORDER BY s.fecha DESC, s.hora DESC
    """, (id_docente,))
    solicitudes = cursor.fetchall()
    cursor.close()
    conexion.close()

    # 🔥 Convertir timedelta/fecha a string
    for s in solicitudes:
        if isinstance(s.get("hora"), (bytes, bytearray)) or hasattr(s.get("hora"), "total_seconds"):
            segundos = int(s["hora"].total_seconds())
            horas = segundos // 3600
            minutos = (segundos % 3600) // 60
            s["hora"] = f"{horas:02d}:{minutos:02d}"
        if isinstance(s.get("fecha"), (bytes, bytearray)) or hasattr(s.get("fecha"), "strftime"):
            s["fecha"] = s["fecha"].strftime("%Y-%m-%d")

    return jsonify({'success': True, 'solicitudes': solicitudes})

@app.route('/obtener_solicitudes_estudiante/<int:id_estudiante>', methods=['GET'])
def obtener_solicitudes_estudiante(id_estudiante):
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    cursor.execute("""
        SELECT s.id, s.id_estudiante, s.tema, s.fecha, s.hora, s.lugar_consulta, s.id_docente, d.nombre AS nombre_docente,
               e.nombre AS nombre_estudiante, p.nombre_programa, m.nombre AS nombre_modulo, s.estado
        FROM solicitudes_consultas s
        JOIN usuarios e ON s.id_estudiante = e.id
        LEFT JOIN programas_academicos p ON e.id_programa = p.id
        JOIN usuarios d ON s.id_docente = d.id
        JOIN modulos m ON s.id_modulo = m.id
        WHERE s.id_estudiante = %s
        ORDER BY s.fecha DESC, s.hora DESC
    """, (id_estudiante,))
    solicitudes = cursor.fetchall()
    cursor.close()
    conexion.close()

     # 🔥 Convertir timedelta/fecha a string
    for s in solicitudes:
        if isinstance(s.get("hora"), (bytes, bytearray)) or hasattr(s.get("hora"), "total_seconds"):
            segundos = int(s["hora"].total_seconds())
            horas = segundos // 3600
            minutos = (segundos % 3600) // 60
            s["hora"] = f"{horas:02d}:{minutos:02d}"
        if isinstance(s.get("fecha"), (bytes, bytearray)) or hasattr(s.get("fecha"), "strftime"):
            s["fecha"] = s["fecha"].strftime("%Y-%m-%d")

    return jsonify({'success': True, 'solicitudes': solicitudes})




# ==========================
# RESPONDER SOLICITUD
# ==========================
@app.route('/responder_solicitud', methods=['POST'])
def responder_solicitud():
    try:
        data = request.get_json()
        id_solicitud = data.get("id_solicitud")
        accion = data.get("accion")

        conexion = obtener_conexion()
        cursor = conexion.cursor(dictionary=True)

        if accion == "Aceptar":
            cursor.execute(
                "UPDATE solicitudes_consultas SET estado = 'Aceptada' WHERE id = %s",
                (id_solicitud,)
            )
            
            # 2️⃣ Insertar en consultas con el ID real del módulo
            cursor.execute("""
                INSERT INTO consultas (id_estudiante, id_docente, modulo, tema, fecha, hora, lugar_consulta, firma)
                SELECT s.id_estudiante, s.id_docente, s.id_modulo, s.tema, s.fecha, s.hora, s.lugar_consulta, 'No Firmado'
                FROM solicitudes_consultas s
                WHERE s.id = %s
            """, (id_solicitud,))

        elif accion == "Rechazar":
            cursor.execute(
                "UPDATE solicitudes_consultas SET estado = 'Rechazada' WHERE id = %s",
                (id_solicitud,)
            )

        conexion.commit()
        cursor.close()
        conexion.close()

        return jsonify({"success": True, "message": f"Solicitud {accion} con éxito"})

    except Exception as e:
        print("❌ Error en responder_solicitud:", e)
        return jsonify({"success": False, "error": str(e)}), 500



@app.route('/obtener_estudiantes', methods=['GET'])
def obtener_estudiantes():
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    cursor.execute("""
        SELECT u.id, u.nombre, p.nombre_programa
        FROM usuarios u
        LEFT JOIN programas_academicos p ON u.id_programa = p.id
        WHERE u.rol = 'Estudiante'
    """)
    estudiantes = cursor.fetchall()
    cursor.close()
    conexion.close()
    return jsonify({'success': True, 'estudiantes': estudiantes})


@app.route("/estudiantes_docente/<int:id_docente>", methods=["GET"])
def estudiantes_docente(id_docente):
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)

    cursor.execute("""
        SELECT DISTINCT e.id, e.nombre
        FROM usuarios e
        INNER JOIN consultas c ON e.id = c.id_estudiante
        WHERE c.id_docente = %s AND e.rol = 'Estudiante'
    """, (id_docente,))

    estudiantes = cursor.fetchall()
    cursor.close()
    conexion.close()
    return jsonify({"success": True, "estudiantes": estudiantes})

@app.route("/estudiantes_docente_solicitud/<int:id_docente>", methods=["GET"])
def estudiantes_docente_solicitud(id_docente):
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)

    cursor.execute("""
        SELECT DISTINCT e.id, e.nombre
        FROM usuarios e
        INNER JOIN solicitudes_consultas c ON e.id = c.id_estudiante
        WHERE c.id_docente = %s AND e.rol = 'Estudiante'
    """, (id_docente,))

    estudiantes = cursor.fetchall()
    cursor.close()
    conexion.close()
    return jsonify({"success": True, "estudiantes": estudiantes})

@app.route("/docentes_estudiante/<int:id_estudiante>", methods=["GET"])
def docentes_estudiante(id_estudiante):
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)

    cursor.execute("""
        SELECT DISTINCT d.id, d.nombre
        FROM usuarios d
        INNER JOIN consultas c ON d.id = c.id_docente
        WHERE c.id_estudiante = %s AND d.rol = 'Docente'
    """, (id_estudiante,))

    docentes = cursor.fetchall()
    cursor.close()
    conexion.close()
    return jsonify({"success": True, "docentes": docentes})



@app.route('/obtener_lideres', methods=['GET'])
def obtener_lideres():
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    cursor.execute("SELECT * FROM usuarios WHERE rol = 'Lider'")
    lideres = cursor.fetchall()
    cursor.close()
    conexion.close()
    return jsonify({'success': True, 'lideres': lideres})


@app.route('/registrar_usuario', methods=['POST'])
def registrar_usuario():
    try:
        datos = request.get_json(force=True)
        id_usuario = datos.get("id")
        nombre = datos.get("nombre")
        contra = datos.get("contra")
        rol = datos.get("rol")
        id_programa = datos.get("id_programa")  # puede venir vacío o None

        if not id_usuario or not nombre or not rol or not contra:
            return jsonify({'success': False, 'error': 'Faltan campos obligatorios'}), 400

        # Ajustar id_programa según rol
        if rol != "Estudiante":
            id_programa = None
        else:
            # Validar que el programa exista para estudiantes
            if not id_programa:
                return jsonify({'success': False, 'error': 'Estudiante debe tener un programa académico'}), 400

        conexion = obtener_conexion()
        cursor = conexion.cursor()

        # Validar que usuario no exista
        cursor.execute("SELECT id FROM usuarios WHERE id = %s", (id_usuario,))
        if cursor.fetchone():
            return jsonify({'success': False, 'error': 'Usuario ya registrado'}), 400

        # Validar programa si es estudiante
        if rol == "Estudiante":
            cursor.execute("SELECT id FROM programas_academicos WHERE id = %s", (id_programa,))
            if not cursor.fetchone():
                return jsonify({'success': False, 'error': 'El programa académico no existe'}), 400

        # Insertar usuario
        cursor.execute("""
            INSERT INTO usuarios (id, nombre, id_programa, rol, contraseña)
            VALUES (%s, %s, %s, %s, %s)
        """, (id_usuario, nombre, id_programa, rol, contra))

        conexion.commit()
        return jsonify({'success': True, 'message': 'Usuario registrado correctamente'})

    except mysql.connector.Error as e:
        return jsonify({'success': False, 'error': f'Error MySQL: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conexion' in locals():
            conexion.close()


# ==========================
# CONSULTAS
# ==========================
@app.route('/registrar_consulta', methods=['POST'])
def registrar_consulta():
    data = request.json
    conexion = obtener_conexion()
    cursor = conexion.cursor()

    # Validar estudiante
    cursor.execute("SELECT * FROM usuarios WHERE id = %s AND rol = 'Estudiante'", (data['id_estudiante'],))
    if not cursor.fetchone():
        cursor.close()
        conexion.close()
        return jsonify({'success': False, 'message': 'Estudiante no válido'}), 400

    # Validar docente
    cursor.execute("SELECT * FROM usuarios WHERE id = %s AND rol = 'Docente'", (data['id_docente'],))
    if not cursor.fetchone():
        cursor.close()
        conexion.close()
        return jsonify({'success': False, 'message': 'Docente no válido'}), 400

    cursor.execute("""
        INSERT INTO consultas (id_estudiante, id_docente, modulo, tema, lugar_consulta, fecha, hora, firma)
        VALUES (%s, %s, %s, %s, %s, %s, %s, 'No Firmado')
    """, (data['id_estudiante'], data['id_docente'], data['modulo'], data['tema'],
          data['lugar_consulta'], data['fecha'], data['hora']))

    conexion.commit()
    cursor.close()
    conexion.close()
    return jsonify({'success': True, 'message': 'Consulta registrada exitosamente'})


@app.route("/editar_consulta/<int:id>", methods=["PUT"])
def editar_consulta(id):
    data = request.get_json()
    nueva_fecha = data.get("fecha")
    nueva_hora = data.get("hora")

    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor()
        cursor.execute(
            "UPDATE consultas SET fecha = %s, hora = %s WHERE id = %s",
            (nueva_fecha, nueva_hora, id)
        )
        conexion.commit()
        cursor.close()
        conexion.close()

        return jsonify({"success": True, "message": "Consulta actualizada"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})
    



@app.route('/consultas_lider', methods=['GET'])
def obtener_consultas_lider():
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    cursor.execute("""
        SELECT c.id, c.id_estudiante, c.id_docente, c.modulo ,m.nombre AS nombre_modulo, c.tema, c.fecha, c.hora, 
               c.lugar_consulta, c.firma,
               e.nombre AS nombre_estudiante, p.nombre_programa, d.nombre AS nombre_docente
        FROM consultas c
        JOIN usuarios e ON c.id_estudiante = e.id
        LEFT JOIN programas_academicos p ON e.id_programa = p.id
        LEFT JOIN modulos m ON c.modulo = m.id
        JOIN usuarios d ON c.id_docente = d.id
        WHERE e.rol = 'Estudiante'
        ORDER BY c.id ASC
    """)
    consultas = cursor.fetchall()
    cursor.close()
    conexion.close()
    return jsonify({'success': True, 'consultas': consultas})


@app.route('/consultas_docente/<id_docente>', methods=['GET'])
def obtener_consultas_docente(id_docente):
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    cursor.execute("""
        SELECT c.id, c.id_estudiante, c.id_docente, m.nombre AS nombre_modulo, m.id AS id_modulo, 
               c.tema, c.fecha, c.hora, c.lugar_consulta, c.firma,
               e.nombre AS nombre_estudiante, p.nombre_programa
        FROM consultas c
        JOIN usuarios e ON c.id_estudiante = e.id
        LEFT JOIN programas_academicos p ON e.id_programa = p.id
        LEFT JOIN modulos m ON c.modulo = m.id
        WHERE c.id_docente = %s
    """, (id_docente,))
    consultas = cursor.fetchall()
    cursor.close()
    conexion.close()
    return jsonify({'success': True, 'consultas': consultas})


@app.route('/consultas_estudiante/<id_estudiante>', methods=['GET'])
def obtener_consultas_por_estudiante(id_estudiante):
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    cursor.execute("""
        SELECT c.id, m.nombre AS nombre_modulo, c.tema, c.lugar_consulta, c.fecha, c.hora, c.firma,
               d.nombre AS nombre_docente, e.nombre AS nombre_estudiante
        FROM consultas c
        JOIN usuarios d ON c.id_docente = d.id
        JOIN usuarios e ON c.id_estudiante = e.id
        LEFT JOIN modulos m ON c.modulo = m.id
        WHERE c.id_estudiante = %s
        ORDER BY c.fecha DESC, c.hora DESC
    """, (id_estudiante,))
    consultas = cursor.fetchall()
    cursor.close()
    conexion.close()
    return jsonify({'success': True, 'consultas': consultas})


@app.route('/firmar_consulta/<int:id_consulta>', methods=['POST'])
def firmar_consulta(id_consulta):
    data = request.get_json()
    firma = data.get("firma")

    if not firma:
        return jsonify({'success': False, 'message': 'No se envió la firma'}), 400

    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    cursor.execute("SELECT firma FROM consultas WHERE id = %s", (id_consulta,))
    consulta = cursor.fetchone()

    if not consulta:
        cursor.close()
        conexion.close()
        return jsonify({'success': False, 'message': 'Consulta no encontrada'}), 404

    cursor.execute("UPDATE consultas SET firma = %s WHERE id = %s", (firma, id_consulta))
    conexion.commit()
    cursor.close()
    conexion.close()
    return jsonify({'success': True, 'message': 'Consulta firmada con éxito'})


if __name__ == "__main__":

    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))







