import time
from flask import Flask, request, jsonify
import math

app = Flask(__name__)

@app.route('/', methods=['POST'])
def calculate_sine():
    data = request.get_json()
    if 'angle <number>' not in data:
        return jsonify({"error": "Missing angle parameter"}), 400
    angle = data['angle <number>']
    try:
        angle = float(angle)
    except ValueError:
        return jsonify({"error": "Invalid angle parameter"}), 400
    result = math.sin(math.radians(angle))
    time.sleep(3)
    return jsonify({"result <number>": result}), 200

@app.route('/health', methods=['GET'])  # Health check typically uses a GET request
def health_check():
    # Simple health check response. You can expand this to check dependencies or app state if necessary.
    return jsonify({"status": "healthy"}), 200

if __name__ == '__main__':
    app.run(debug=True)

