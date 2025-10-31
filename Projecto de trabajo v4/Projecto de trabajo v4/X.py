from flask import Flask, jsonify
import mysql.connector

# ============================
# 🔌 CONEXIÓN A AWS RDS
# ============================
def obtener_conexion():
    return mysql.connector.connect(
        host="consultas-iub-db.crowmwmuizav.us-east-2.rds.amazonaws.com",  # 👈 tu endpoint exacto
        user="admin",            # 👈 usuario de RDS
        password="ADMIN12345",  # 👈 reemplázala con tu contraseña real
        database="consultas_iub",  # 👈 nombre exacto del schema
        port=3306
    )

# ============================
# 🚀 INICIALIZACIÓN DE FLASK
# ============================
app = Flask(__name__)

# ============================
# 🧪 RUTA DE PRUEBA DE CONEXIÓN
# ============================
@app.route('/test_db')
def test_db():
    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor()
        cursor.execute("SELECT NOW();")
        resultado = cursor.fetchone()
        cursor.close()
        conexion.close()
        return jsonify({
            "success": True,
            "mensaje": "✅ Conexión exitosa a AWS RDS",
            "hora_servidor": str(resultado[0])
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        })

# ============================
# ▶️ EJECUCIÓN LOCAL
# ============================
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8800, debug=True)
