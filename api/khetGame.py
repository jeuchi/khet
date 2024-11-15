from piece import Pharaoh, Anubis, Pyramid, Scarab, Sphynx, action, create_piece_from_str
from board import Board, parse_board_data, print_moves
from solver import solve_single_agent
import json

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

## list of starting pieces
list_of_starting_pieces = []
list_of_starting_pieces.append(Sphynx("Silver", (9, 0), 0))
list_of_starting_pieces.append(Sphynx("Red", (0, 7), 2))
list_of_starting_pieces.append(Pyramid("Silver", (9, 3), 2))
list_of_starting_pieces.append(Pyramid("Red", (0, 4), 0))
list_of_starting_pieces.append(Pharaoh("Silver", (9, 4)))
list_of_starting_pieces.append(Pharaoh("Red", (0, 0)))
list_of_starting_pieces.append(Scarab("Silver", (4, 4), 1))
list_of_starting_pieces.append(Pyramid("Red", (3, 6), 1))
list_of_starting_pieces.append(Scarab("Red", (9, 6), 0))
list_of_starting_pieces.append(Anubis("Silver", (6, 6), 3))

# Example usage
if __name__ == "__main__":
    file_path = "C:\\Users\\austi\\Documents\\GitHub\\khet\\boards\\test_0.txt"
    board_data_str = open(file_path)
    board_data=json.load(board_data_str)

    board = parse_board_data(board_data)

    solution = solve_single_agent(board, "Silver")
    print(f"Winning moves: {solution}")

    board.display_board()