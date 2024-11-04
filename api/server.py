import time
from flask import Flask, request

app = Flask(__name__)

@app.route('/api/solve', methods=['POST'])
def solve():
    data = request.json 
    print(data['board'])
    return 'Solved!'
