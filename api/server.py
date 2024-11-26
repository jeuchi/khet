import time
from flask import Flask, request
from solver import *
from board import Board, parse_board_data


app = Flask(__name__)

solver = None

@app.route('/api/next-best-move', methods=['POST'])
def next_best_move():
    data = request.json
    move_data = data['board']
    x = move_data[0]
    y = move_data[1]
    action_str = move_data[2]
    piece = solver.current_node.get_piece_at_position((x, y))
    action = Action(action_str)


    valid_moves = solver.current_node.get_all_possible_moves("Silver")

    try :
        
        board = parse_board_data(board_data)
    except:
        return ('Invalid board data', 400)
    # Implement your next best move logic here
    #parse move
    for node in solver.current_node.children:   
        node_piece, node_action = node.move
        if node_piece == piece and node_action == action:
            solver.current_node = node
            break

    solver.current_node = solver.current_node.best_child
    optimal_move = solver.current_node.move
    optimal_move_piece, optimal_move_action = optimal_move
    
    r, c = optimal_move_piece.position
    move_str = f"{r},{c},{optimal_move_action}"


    #traverse to node in tree

    #return best move from that node

    # If not solvable, return 400
    time.sleep(1)

    # Otherwise, return string of the next best move
    return ('Note to self: Implement next best move logic', 404)

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