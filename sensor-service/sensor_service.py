from flask import Flask, jsonify
import random

app = Flask(__name__)

@app.route('/sensor/data')
def get_data():
    data = {
        "sensor_id": random.randint(1, 5),
        "temperature": round(random.uniform(20, 35), 2),
        "humidity": round(random.uniform(30, 80), 2)
    }
    return jsonify(data)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
