from piece import Pharaoh, Anubis, Pyramid, Scarab, Sphynx, action, create_piece_from_str
from board import Board

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

    def get_all_possible_moves(self):
        possible_moves = []
        board = self.board_history[-1]
        for piece in board.get_list_of_pieces():
            if piece.color == self.turn:
                for move in board.list_possible_moves(piece):
                    possible_moves.append((piece, move))
        return possible_moves
    

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

    def print_moves(self, moves):
        for move in moves:
            self.print_move(move)

    def print_move(self, move):
        piece, action = move
        if piece is not None:
            print(f"{piece.color} {piece} at {piece.position} -> {action}") 
        else:
            print(f"PASS")

    def get_current_board(self):
        return self.board_history[-1]
    
def parse_board_data(board_data):
    n = len(board_data)
    m = len(board_data[0])
    print(f"Board shape: {m}x{n}")

    list_of_pieces = []
    for i in range(n):
        for j in range(m):
            piece_str = board_data[i][j]
            x = j #translate from front end coordinates to back end coordinates
            y = n - i - 1
            
            parsed_piece = parse_piece_str(piece_str)
            if parsed_piece is not None:
                color, piece_str, orientation = parsed_piece

                piece_obj = create_piece_from_str(color, piece_str, (x, y), orientation)
                if piece_obj is None:
                    print(f"Error: Could not create piece from string '{piece_str}' with color '{color}', piece '{piece}', coordinates ({x},{y}), and orientation '{orientation}'")

                list_of_pieces.append(piece_obj)


    #for piece in list_of_pieces:
        #print(f"{piece.color} {piece} at {piece.position}")
    game = KhetGame(m=m, n=n, list_of_pieces=list_of_pieces)
    initial_board = game.board_history[0]
    initial_board.display_board()

    return 'Solved!'

def parse_piece_str(piece_str):
    if piece_str == " ":
        return None
    color, piece_and_orientation = piece_str.split("_")

    if color == "red":
        color = "Red"
    elif color == "silver":
        color = "Silver"

    if "," in piece_and_orientation:
        piece, orientation_str = piece_and_orientation.split(",")
        if orientation_str == "up":
            orientation = 0
        elif orientation_str == "right":
            orientation = 1
        elif orientation_str == "down":
            orientation = 2
        elif orientation_str == "left":
            orientation = 3
    else:
        piece = piece_and_orientation
        orientation = 0  # Default orientation if not specified

    return (color, piece, orientation)
    


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
    game = KhetGame(list_of_starting_pieces)

    game.make_move_pos((4,4), action.WEST)
    game.make_move((None, action.PASS))
    game.make_move_pos((6,6), action.EAST)
    game.make_move((None, action.PASS))
    game.make_move_pos((7,6), action.ROTATE_CW)
    game.make_move((None, action.PASS))
    game.make_move_pos((9,4), action.WEST)
    game.make_move_pos((9,6), action.WEST)
    #game.make_move_pos((7,2), action.WEST)
    #game.make_move((None, action.PASS))
    #game.make_move_pos((6,2), action.WEST)

    board_to_display = game.board_history[-1]
    board_to_display.display_board()

