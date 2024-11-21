import time
from flask import Flask, request
from solver import *
from board import Board, parse_board_data


app = Flask(__name__)

@app.route('/api/solve', methods=['POST'])
def solve():
    data = request.json 
    board_data = data['board']
    board = parse_board_data(board_data)

    solution = solve_single_agent(board, "Silver")
    solution_str = ""
    for move in solution:
        piece, action = move
        r, c = piece.position
        move_str = f"{r},{c},{action}"
        solution_str += move_str + "\n"
    return solution_str