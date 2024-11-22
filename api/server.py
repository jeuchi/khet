import time
from flask import Flask, request
from solver import *
from board import Board, parse_board_data


app = Flask(__name__)

@app.route('/api/next-best-move', methods=['POST'])
def next_best_move():
    data = request.json
    board_data = data['board']
    try :
        board = parse_board_data(board_data)
    except:
        return ('Invalid board data', 400)
    # Implement your next best move logic here

    # If not solvable, return 400
    time.sleep(1)

    # Otherwise, return string of the next best move
    return ('Note to self: Implement next best move logic', 404)

@app.route('/api/solve', methods=['POST'])
def solve():
    data = request.json 
    board_data = data['board']
    board = parse_board_data(board_data)
    solver = Solver(board, "Silver")
    solution = solver.solve_single_agent(board, "Silver")
    solution_str = ""
    for move in solution:
        piece, action = move
        r, c = piece.position
        move_str = f"{r},{c},{action}"
        solution_str += move_str + "\n"
    return solution_str