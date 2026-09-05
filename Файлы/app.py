from flask import Flask, request, jsonify, send_from_directory
import csv
import os
import requests
from requests.auth import HTTPBasicAuth

app = Flask(__name__)

# Папки
UPLOAD_FOLDER = "uploads"
RES_FOLDER = "res"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RES_FOLDER, exist_ok=True)

# Отдача файлов
#html
@app.route("/")
def index():
    return send_from_directory(".", "index.html")
#js
@app.route("/sc.js")
def js():
    return send_from_directory(".", "sc.js")
#css
@app.route("/style.css")
def css():
    return send_from_directory(".", "style.css")
#Фото сайта
@app.route("/res/<path:filename>")
def res_files(filename):
    return send_from_directory(RES_FOLDER, filename)
#Загруженные фото
@app.route("/uploads/<path:filename>")
def uploaded_files(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

#Импорт csv
@app.route("/import", methods=["POST"])
def import_csv():
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "Файл не передан"}), 400
    text = file.read().decode("utf-8").splitlines()
    reader = csv.DictReader(text)
    for row in reader:
        cursor.execute(
            "INSERT INTO customers (fio, email, phone) VALUES (?, ?, ?)",
            (row.get("fio"), row.get("email"), row.get("phone"))
        )
    conn.commit()
    return jsonify({"status": "ok"})

#Функция поиска
@app.route("/search")
def search():
    q = request.args.get("q", "")
    query = f"%{q}%"
    cursor.execute("""
        SELECT * FROM customers
        WHERE fio LIKE ? OR email LIKE ? OR phone LIKE ?
    """, (query, query, query))
    rows = cursor.fetchall()
    result = []
    for r in rows:
        result.append({
            "id": r[0],
            "fio": r[1],
            "email": r[2],
            "phone": r[3]
        })
    return jsonify(result)

#Загрузка фото
@app.route("/upload-image", methods=["POST"])
def upload_image():
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "Файл не передан"}), 400
    filename = file.filename
    path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(path)
    return jsonify({
        "url": f"/uploads/{filename}"
    })

@app.route("/get-management-contacts")
def get_management_contacts():
    auth = HTTPBasicAuth('Admin', '')
    url_1c = "http://localhost/InfoBase/hs/api/get_management"
    try:
        # Запрашиваем данные у 1С
        response = requests.get(url_1c, auth=auth, timeout=5)
        if response.status_code == 200:
            # Возвращаем список сотрудников как JSON
            return jsonify(response.json())
        else:
            return jsonify({"error": f"1С ответила ошибкой {response.status_code}"}), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/get_clients")
def get_all_clients():
    # Запрос к 1С
    auth = ('Admin', '')
    url_1c = "http://localhost/InfoBase/hs/api/get_clients"
    try:
        response = requests.get(url_1c, auth=auth, timeout=5)
        return jsonify(response.json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/get_journal")
def get_journal():
    auth = ('Admin', '')
    url_1c = "http://localhost/InfoBase/hs/api/get_journal"
    try:
        response = requests.get(url_1c, auth=auth, timeout=5)
        if response.status_code == 200:
            response.encoding = 'utf-8'
            data = response.json()
            return jsonify(data)
        else:
            return jsonify({"error": f"1С вернула ошибку: {response.status_code}"}), response.status_code
    except requests.exceptions.Timeout:
        return jsonify({"error": "1С слишком долго отвечает (Timeout)"}), 504
    except Exception as e:
        return jsonify({"error": f"Системная ошибка Python: {str(e)}"}), 500

# Функция добавления клиентов
@app.route("/add_client", methods=["POST"])
def add_client():
    auth = ('Admin', '')
    url_1c = "http://localhost/InfoBase/hs/api/get_clients"
    data_from_js = request.json
    payload = {
        "Name": data_from_js.get("fio"),
        "Email": data_from_js.get("email"),
        "Phone": data_from_js.get("phone")
    }
    try:
        response = requests.post(url_1c, auth=auth, json=payload, timeout=5)
        if response.status_code == 201:
            return jsonify({"status": "success"}), 201
        else:
            return jsonify({"error": response.text}), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATES_DIR = os.path.join(BASE_DIR, 'saved_templates')
if not os.path.exists(TEMPLATES_DIR):
    os.makedirs(TEMPLATES_DIR)

@app.route('/delete_template_file/<filename>', methods=['DELETE'])
def delete_template_file(filename):
    file_path = os.path.join(TEMPLATES_DIR, filename)
    if os.path.exists(file_path):
        os.remove(file_path)
        return jsonify({"status": "deleted"})
    return jsonify({"error": "File not found"}), 404

@app.route('/save_to_folder', methods=['POST'])
def save_to_folder():
    try:
        data = request.json
        if not data or 'content' not in data:
            return jsonify({"status": "error", "message": "No content"}), 400
        filename = f"{data['name']}.html"
        file_path = os.path.join(TEMPLATES_DIR, filename)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(data['content'])
        print(f"--- Файл успешно сохранен: {file_path}")
        return jsonify({"status": "success", "filename": filename})
    except Exception as e:
        print(f"--- ОШИБКА СОХРАНЕНИЯ: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/load_from_folder/<filename>')
def load_from_folder(filename):
    file_path = os.path.join(TEMPLATES_DIR, filename)
    print(f"--- Запрос на чтение файла: {file_path}")
    if os.path.exists(file_path):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            return jsonify({"content": content})
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    print(f"--- ОШИБКА: Файл не найден по пути {file_path}")
    return jsonify({"error": "File not found"}), 404

#Запуск
if __name__ == "__main__":
    app.run(debug=True)