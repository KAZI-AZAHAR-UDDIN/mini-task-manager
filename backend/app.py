from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Set up SQLite database
def setup_database():
    conn = sqlite3.connect('task_manager.db')  # Changed filename
    cur = conn.cursor()
    cur.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            task_id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_title TEXT NOT NULL,
            task_status TEXT NOT NULL CHECK(task_status IN ('pending', 'done')),
            created_at TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

# Convert database row to dictionary
def row_to_json(row):
    if not row:
        return None
    return {col: row[col] for col in row.keys()}

# Log requests to a file for debugging
def log_request(endpoint, method, data=None):
    with open('api_logs.txt', 'a') as log_file:
        log_file.write(f"[{datetime.now()}] {method} {endpoint} | Data: {data}\n")

# GET /tasks - Fetch all tasks
@app.route('/tasks', methods=['GET'])
def fetch_all_tasks():
    log_request('/tasks', 'GET')
    try:
        conn = sqlite3.connect('task_manager.db')
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute('SELECT * FROM tasks')
        tasks = [row_to_json(row) for row in cur.fetchall()]
        conn.close()
        return jsonify(tasks), 200
    except sqlite3.Error as db_err:
        return jsonify({'error': f'DB issue: {db_err}'}), 500

# POST /tasks - Add new task
@app.route('/tasks', methods=['POST'])
def create_task():
    data = request.get_json()
    log_request('/tasks', 'POST', data)
    if not data:
        return jsonify({'error': 'No JSON data provided'}), 400

    title = data.get('task_title')
    status = data.get('task_status', 'pending')

    if not title or not isinstance(title, str) or not title.strip():
        return jsonify({'error': 'Task title must be a non-empty string'}), 400
    if status not in ['pending', 'done']:
        return jsonify({'error': 'Status must be pending or done'}), 400

    try:
        conn = sqlite3.connect('task_manager.db')
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute(
            'INSERT INTO tasks (task_title, task_status, created_at) VALUES (?, ?, ?)',
            (title.strip(), status, datetime.now().isoformat())
        )
        conn.commit()
        new_id = cur.lastrowid
        cur.execute('SELECT * FROM tasks WHERE task_id = ?', (new_id,))
        new_task = cur.fetchone()
        conn.close()
        if new_task:
            return jsonify(row_to_json(new_task)), 201
        return jsonify({'error': 'Could not fetch new task'}), 500
    except sqlite3.Error as db_err:
        return jsonify({'error': f'DB issue: {db_err}'}), 500

# GET /tasks/<id> - Fetch task by ID
@app.route('/tasks/<int:task_id>', methods=['GET'])
def fetch_task(task_id):
    log_request(f'/tasks/{task_id}', 'GET')
    try:
        conn = sqlite3.connect('task_manager.db')
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute('SELECT * FROM tasks WHERE task_id = ?', (task_id,))
        task = cur.fetchone()
        conn.close()
        if not task:
            return jsonify({'error': 'Task not found'}), 404
        return jsonify(row_to_json(task)), 200
    except sqlite3.Error as db_err:
        return jsonify({'error': f'DB issue: {db_err}'}), 500

# PUT /tasks/<id> - Update task
@app.route('/tasks/<int:task_id>', methods=['PUT'])
def modify_task(task_id):
    data = request.get_json()
    log_request(f'/tasks/{task_id}', 'PUT', data)
    if not data:
        return jsonify({'error': 'No JSON data provided'}), 400

    title = data.get('task_title')
    status = data.get('task_status')

    updates = {}
    if title and isinstance(title, str) and title.strip():
        updates['task_title'] = title.strip()
    if status in ['pending', 'done']:
        updates['task_status'] = status

    if not updates:
        return jsonify({'error': 'Nothing to update'}), 400

    try:
        conn = sqlite3.connect('task_manager.db')
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute('SELECT * FROM tasks WHERE task_id = ?', (task_id,))
        if not cur.fetchone():
            conn.close()
            return jsonify({'error': 'Task not found'}), 404

        update_query = 'UPDATE tasks SET ' + ', '.join(f'{k} = ?' for k in updates) + ' WHERE task_id = ?'
        update_values = list(updates.values()) + [task_id]
        cur.execute(update_query, update_values)
        conn.commit()

        cur.execute('SELECT * FROM tasks WHERE task_id = ?', (task_id,))
        updated_task = cur.fetchone()
        conn.close()
        if updated_task:
            return jsonify(row_to_json(updated_task)), 200
        return jsonify({'error': 'Could not fetch updated task'}), 500
    except sqlite3.Error as db_err:
        return jsonify({'error': f'DB issue: {db_err}'}), 500

# DELETE /tasks/<id> - Delete task
@app.route('/tasks/<int:task_id>', methods=['DELETE'])
def remove_task(task_id):
    log_request(f'/tasks/{task_id}', 'DELETE')
    try:
        conn = sqlite3.connect('task_manager.db')
        cur = conn.cursor()
        cur.execute('SELECT * FROM tasks WHERE task_id = ?', (task_id,))
        if not cur.fetchone():
            conn.close()
            return jsonify({'error': 'Task not found'}), 404
        cur.execute('DELETE FROM tasks WHERE task_id = ?', (task_id,))
        conn.commit()
        conn.close()
        return '', 204
    except sqlite3.Error as db_err:
        return jsonify({'error': f'DB issue: {db_err}'}), 500

if __name__ == '__main__':
    setup_database()
    app.run(port=3001)