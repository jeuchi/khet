import time
from flask import Flask, request
from solver import *
from board import *


app = Flask(__name__)

solver = None

@app.route('/api/next-best-move', methods=['POST'])
def next_best_move():
    data = request.json
    move_data = data['move']

    return "4,7,ROTATE_CCW"
    previous_known_node = solver.current_node
    
    received_move = parse_move_data(move_data, previous_known_node.board)
    
    if previous_known_node.board.check_move(received_move) == False:
        print("Invalid move")
        return {"error": "Invalid move"}, 400

    active_node = solver.current_node.get_child(received_move)

    next_node = active_node.best_child
    next_best_move = next_node.move

    solver.current_node = next_node
    
    optimal_move_piece, optimal_move_action = next_best_move
    r, c = optimal_move_piece.position
    move_str = f"{r},{c},{optimal_move_action}"
    return move_str

@app.route('/api/solve', methods=['POST'])
def solve():
    data = request.json 
    board_data = data['board']
    board = parse_board_data(board_data)

    solver = Solver(board, "Silver", debug=False)
    solution = solver.solve_multi_agent(board, "Silver", search_depth=6)
    print_moves(solution)

    solution_str = ""
    for move in solution:
        piece, action = move
        r, c = piece.position
        move_str = f"{r},{c},{action}"
        solution_str += move_str + "\n"
    return solution_str