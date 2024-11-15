import time
from flask import Flask, request
from solver import solve_single_agent
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
        move_str = f"{piece.color} {piece} at {piece.position} -> {action}"
        solution_str += move_str + "\n"
    return "Solutibn"