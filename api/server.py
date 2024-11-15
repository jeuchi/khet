import time
from flask import Flask, request
from khetGame import parse_board_data

app = Flask(__name__)

@app.route('/api/solve', methods=['POST'])
def solve():
    data = request.json 
    board = data['board']
    solution = parse_board_data(board)
    return solution
