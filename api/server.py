import time
from flask import Flask, request
from solver import *
from board import *


app = Flask(__name__)

global solver
solver = None

@app.route('/api/next-best-move', methods=['POST'])
def next_best_move():
    data = request.json
    move_data = data['move']

    global solver
    previous_known_node = solver.current_node
    
    received_move = parse_move_data(move_data, previous_known_node.board)

    print("Received move:")
    print_moves([received_move])
    print(f"Move valid: {previous_known_node.board.check_move(received_move)}")

    
    if previous_known_node.board.check_move(received_move) == False:
        print("Invalid move")
        return {"error": "Invalid move"}, 400

    next_best_move = solver.get_next_best_move(received_move)

    print("Next best move:")
    print_move(next_best_move)
    
    optimal_move_piece, optimal_move_action = next_best_move
    r, c = optimal_move_piece.position
    move_str = f"{r},{c},{optimal_move_action}"
    return move_str

@app.route('/api/solve', methods=['POST'])
def solve():
    data = request.json 
    board_data = data['board']
    board = parse_board_data(board_data)

    global solver    
    if solver is None or solver.root.board != board:
        solver = Solver(board, "Silver", debug=False, search_depth=6)
        solution = solver.solve_multi_agent(solver.root)
    else:
        solution = solver.get_solution(solver.root)

    solver.current_node = solver.root
    print_moves(solution)

    solution_str = ""
    for move in solution:
        piece, action = move
        r, c = piece.position
        move_str = f"{r},{c},{action}"
        solution_str += move_str + "\n"
    return solution_str