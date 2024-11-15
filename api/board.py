from piece import Pharaoh, Anubis, Pyramid, Scarab, Sphynx, action, surface
import matplotlib.pyplot as plt
import matplotlib.patches as patches

class Board:
    def __init__(self, m=10, n=8, list_of_pieces=None):
        self.m = m
        self.n = n
        self.grid = self.initialize_board(list_of_pieces)
    
    def initialize_board(self, list_of_pieces):
        # Initialize the board with pieces in their starting positions
        grid = [[None for _ in range(self.m)] for _ in range(self.n)]
        if list_of_pieces is not None:
            for current_piece in list_of_pieces:
                x, y = current_piece.position
                grid[y][x] = current_piece

        return grid
    
    def deepcopy(self):
        new_list_of_pieces = []
        for piece in self.get_list_of_pieces():
            new_list_of_pieces.append(piece.deepcopy())
        new_board = Board(m=self.m, n=self.n, list_of_pieces=new_list_of_pieces)

        return new_board
    
    def display(self):
        for row in self.grid:
            print(" ".join([str(piece) if piece else '.' for piece in row]))
    
    def is_ankh_destroyed(self):
        # Check if the Pharaoh of either side is destroyed
        return False
    
    def fire_laser(self, color):
        Sphynx = self.get_sphynx(color)
        if Sphynx is None:
            return None
        
        x, y = Sphynx.get_position()
        laser_direction = Sphynx.get_laser_direction()
        print(f"Firing laser from Sphinx at ({x}, {y}) in direction {laser_direction}")

        laser_traveling = True

        while laser_traveling:
            x += laser_direction.value[0]
            y += laser_direction.value[1]

            # Check if the laser has left the board
            if not (0 <= x < self.m and 0 <= y < self.n):
                return None #TODO placeholder
            #print(f"Evaluating ({x}, {y})")
            piece = self.get_grid_position((x, y))
            if piece is not None:
                surface_hit = piece.get_surface_hit(laser_direction)
                print(f"Surface hit: {surface_hit} on {piece} at ({x}, {y})")
                if surface_hit == surface.BLOCKER or surface_hit == surface.EMIT_LASER:
                    return None #TODO placeholder
                elif surface_hit == surface.REFLECT_CW or surface_hit == surface.REFLECT_CCW:
                    laser_direction = piece.reflect_laser(laser_direction)
                    print(f"Reflecting to {laser_direction}")
                else: # surface_hit should be vunerable
                    laser_traveling = False
        
        hit_piece = self.get_grid_position((x, y))
        self.set_grid_position(None, (x, y))
        return hit_piece

    def get_sphynx(self, color):
        for row in self.grid:
            for piece in row:
                if isinstance(piece, Sphynx) and piece.color == color:
                    return piece
        return None
    
    def get_list_of_pieces(self):
        list_of_pieces = []
        for row in self.grid:
            for piece in row:
                if piece is not None:
                    list_of_pieces.append(piece)
        return list_of_pieces

    def display_board(self):
        fig, ax = plt.subplots()
        ax.set_xlim(0, self.m)
        ax.set_ylim(0, self.n)
        ax.set_aspect('equal')

        cell_width = 1
        cell_height = 1

        for i, row in enumerate(self.grid):
            for j, piece in enumerate(row):
                rect = patches.Rectangle((j * cell_width, (7 - i) * cell_height), cell_width, cell_height, linewidth=1, edgecolor='black', facecolor='none')
                ax.add_patch(rect)
                if piece:
                    ax.text(j * cell_width + cell_width / 2, (7 - i) * cell_height + cell_height / 2, str(piece), ha='center', va='center', fontsize=12, color=piece.color)

        # Set the ticks to have chesslike rank and file annotations
        ax.set_xticks([i + 0.5 for i in range(self.m)])
        ax.set_yticks([i + 0.5 for i in range(self.n)])
        ax.set_xticklabels([str(i) for i in range(self.m)])
        ax.set_yticklabels([str(self.n - i - 1) for i in range(self.n)])

        plt.gca().invert_yaxis()
        plt.show()

    def get_grid_position(self, position):
        x, y = position
        return self.grid[y][x]
    
    def set_grid_position(self, piece, position):
        x, y = position
        self.grid[y][x] = piece
        if piece is not None:
            piece.set_position(position)

    def check_move_position(self, position, action):
        return self.check_move(self, (self.get_grid_position(position), action))

    def check_move(self, move):
        piece, action = move

        if piece is None and action == action.PASS:
            return True

        if piece.check_allowed_move(action) == False:
            return False
        
        if action == action.PASS:
            return True
        
        if action == action.ROTATE_CW or action == action.ROTATE_CCW:
            return True
        
        dx, dy, dtheta = action.value
        x, y = piece.get_position()
        new_position = (x + dx, y + dy)
        
        # Check if the new position is within the board boundaries
        if not (0 <= new_position[0] < (self.m) and 0 <= new_position[1] < (self.n)):
            return False
        #add in forbidden space check

        # Check if the new position is occupied by another piece of the same color
        next_position_piece = self.get_grid_position(new_position)
        if next_position_piece is None:
           return True
        elif piece.can_initiate_swap and next_position_piece.can_be_swapped:
            return True
        else:
            return False
        
    def list_possible_moves(self, piece):
        possible_moves = []
        for action in piece.allowed_moves:
            if self.check_move((piece, action)):
                possible_moves.append(action)
        return possible_moves

    #assumes move is allowed
    def make_move(self, move):
        if self.check_move(move) == False:
            raise Exception("Invalid move")
        piece, action = move
        new_board = self.deepcopy()

        if action == action.PASS and piece == None:
            return new_board

        dx, dy, dtheta = action.value
        x, y = piece.position
        old_position = piece.position
        new_position = (x + dx, y + dy)



        if dtheta == 1:
            new_board.get_grid_position(new_position).rotate_cw()
        elif dtheta == -1:
            new_board.get_grid_position(new_position).rotate_ccw()
        else:
            #swap pieces in the positions. If the next space is none then the old space will be none
            piece_in_next_space = self.get_grid_position(new_position)
            new_board.set_grid_position(piece, new_position)
            new_board.set_grid_position(piece_in_next_space, old_position)
            
        return new_board