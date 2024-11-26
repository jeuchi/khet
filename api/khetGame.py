from piece import Pharaoh, Anubis, Pyramid, Scarab, Sphynx, action, create_piece_from_str
from board import Board, parse_board_data, print_moves
from solver import *
import json
from pathlib import Path

class KhetGame:
    def __init__(self, m=10, n=8, list_of_pieces=None):
        self.board_history = []
        self.board_history.append(Board(m=10, n = 8, list_of_pieces=list_of_pieces))
        self.move_history = []
        self.turn = "Silver"  # Alternates between "Silver" and "Red"
    
    def switch_turn(self):
        if self.turn == "Silver":
            self.turn = "Red"
        else:
            self.turn = "Silver"
    
    def is_game_over(self):
        return self.board.is_ankh_destroyed()
    
    def play(self):
        while not self.is_game_over():
            self.board.display()
            self.board.make_move(self.turn)
            self.switch_turn()
    

    def make_move_pos(self, position, action):
        current_board = self.board_history[-1]
        piece = current_board.get_grid_position(position)
        if piece is None:
            raise Exception("No piece at position")
        if piece.color != self.turn:
            raise Exception("Not your turn")
        if action not in piece.allowed_moves:
            raise Exception("Invalid move")
        self.make_move((piece, action))

    def make_move(self, move):
        piece, action = move

        if piece is None and action == action.PASS:
            self.move_history.append((None, action))
        else:
            self.move_history.append((piece.deepcopy(), action))

        current_board = self.board_history[-1]
        next_board = current_board.make_move(move)
        self.print_move(self.move_history[-1])

        laser_target = next_board.fire_laser(self.turn)
        print(f"{self.turn} Laser target: {laser_target}")


        self.board_history.append(next_board)
        self.switch_turn()

        if isinstance(laser_target, Pharaoh):
            self.end_game(laser_target.color)

    def end_game(self, loser):
        if loser == "Silver":
            print("Red wins!")
        else:   
            print("Silver wins!")

    def get_current_board(self):
        return self.board_history[-1]

# Example usage
if __name__ == "__main__":
    data_folder = Path("ui/src/assets/boards")
    file = data_folder / "mate_3.txt"
    board_data_str = open(file)
    board_data=json.load(board_data_str)
    board = parse_board_data(board_data)

    #moves = board.get_all_possible_moves("Red")
    #print_moves(moves)
    #board.display_board()


    solver = Solver(board, "Silver", debug=False)
    solution = solver.solve_multi_agent(board, "Silver", search_depth=6)
    print_moves(solution)
    print(f" Number of nodes made: {TreeNode.num_nodes_made()}")

    #solver.root.display_tree()
    root = solver.root
    best1 = root.best_child
    best2 = best1.best_child
    root.display_tree_one_level()
    best1.display_tree_one_level()
    best2.display_tree_one_level()
    


    board.display_board()