from enum import Enum

def create_piece_from_str(color, piece_str, position, orientation):
        if piece_str == "pharaoh":
            return Pharaoh(color, position, orientation)
        elif piece_str == "anubis":
            return Anubis(color, position, orientation)
        elif piece_str == "pyramid":
            return Pyramid(color, position, orientation)
        elif piece_str == "scarab":
            return Scarab(color, position, orientation)
        elif piece_str == "sphynx":
            return Sphynx(color, position, orientation)
        elif piece_str == "sphinx":
            return Sphynx(color, position, orientation)
        else:
            raise ValueError(f"Unknown piece type: {piece_str}")
        
def parse_piece_str(piece_str):
    if piece_str == " " or piece_str == "" or piece_str == None:
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

class Piece:
    def __init__(self, color, position, orientation=0):
        self.color = color
        self.position = position
        self.orientation = orientation

    def __str__(self):
        return self.symbol
    
    def __eq__(self, value: object) -> bool:
        if not isinstance(value, Piece):
            return False
        return (self.color == value.color and
            self.position == value.position and
            self.orientation == value.orientation and
            self.symbol == value.symbol)
    
    def __hash__(self):
        return hash((self.color, self.position, self.orientation, self.symbol))
    
    def deepcopy(self):
        new_piece = self.__class__(self.color, self.position, self.orientation)
        return new_piece
    
    def move(self, action):
        dx, dy, dtheta = action.value
        x, y = self.position
        self.position = (x + dx, y + dy)
        if(dtheta != 0):
            self.rotate_cw() if dtheta == 1 else self.rotate_ccw()

    def rotate_cw(self):
        self.orientation = self.orientation + 1
        self.set_orientation(self.orientation)

    def rotate_ccw(self):
        self.orientation = self.orientation - 1
        self.set_orientation(self.orientation)

    def check_allowed_move(self, move):
        if move not in self.allowed_moves:
            return False
        return True
    
    def set_position(self, position):
        self.position = position

    def get_position(self):
        return self.position
    
    def get_surface_hit(self, direction):
        surface_hit = None

        if direction == action.NORTH:
            surface_hit = self.side_S
        elif direction == action.EAST:
            surface_hit = self.side_W
        elif direction == action.SOUTH:
            surface_hit = self.side_N
        elif direction == action.WEST:
            surface_hit = self.side_E

        return surface_hit
    
    def reflect_laser(self, direction):
        new_direction = None

        if direction == action.NORTH:
            if self.side_S == surface.REFLECT_CW:
                new_direction = action.WEST
            elif self.side_S == surface.REFLECT_CCW:
                new_direction = action.EAST
        elif direction == action.EAST:
            if self.side_W == surface.REFLECT_CW:
                new_direction = action.NORTH
            elif self.side_W == surface.REFLECT_CCW:
                new_direction = action.SOUTH
        elif direction == action.SOUTH:
            if self.side_N == surface.REFLECT_CW:
                new_direction = action.EAST
            elif self.side_N == surface.REFLECT_CCW:
                new_direction = action.WEST
        elif direction == action.WEST:
            if self.side_E == surface.REFLECT_CW:
                new_direction = action.SOUTH
            elif self.side_E == surface.REFLECT_CCW:
                new_direction = action.NORTH
        
        return new_direction

        

class surface(Enum):
    VUNERABLE = 0
    BLOCKER = 1
    REFLECT_CW = 2
    REFLECT_CCW = 3
    EMIT_LASER = 4

class action(Enum): # (dx,dy, dtheta)
    NORTH = (0, 1, 0)
    NORTH_EAST = (1, 1, 0)
    EAST = (1, 0, 0)
    SOUTH_EAST = (1, -1, 0)
    SOUTH = (0, -1, 0)
    SOUTH_WEST = (-1, -1, 0)
    WEST = (-1, 0, 0)
    NORTH_WEST = (-1, 1, 0)
    ROTATE_CW = (0, 0, 1)
    ROTATE_CCW = (0, 0, -1)
    PASS = (0, 0, 0)

    __str__ = lambda self: self.name

class Pharaoh(Piece):
    allowed_moves = [action.NORTH, action.NORTH_EAST, action.EAST, action.SOUTH_EAST, action.SOUTH, action.SOUTH_WEST, action.WEST, action.NORTH_WEST]
    can_initiate_swap = False
    can_be_swapped = False

    def __init__(self, color, position, orientation=0):
        super().__init__(color, position)
        self.symbol = 'Pharoh'
        self.can_swap = False
        self.set_orientation()

    def set_orientation(self):
        self.orientation = 0
        self.side_N = surface.VUNERABLE
        self.side_E = surface.VUNERABLE
        self.side_S = surface.VUNERABLE
        self.side_W = surface.VUNERABLE

class Anubis(Piece):
    allowed_moves = [action.NORTH, action.NORTH_EAST, action.EAST, action.SOUTH_EAST, action.SOUTH, action.SOUTH_WEST, action.WEST, action.NORTH_WEST, action.ROTATE_CW, action.ROTATE_CCW]
    can_initiate_swap = False
    can_be_swapped = True

    def __init__(self, color, position, orientation=0):
        super().__init__(color, position)
        self.symbol = 'Anubis'
        self.set_orientation(orientation)

    def set_orientation(self,orientation):
        self.orientation = orientation % 4
        if(self.orientation == 0):
            self.side_N = surface.BLOCKER
            self.side_E = surface.VUNERABLE
            self.side_S = surface.VUNERABLE
            self.side_W = surface.VUNERABLE
        elif(self.orientation == 1):
            self.side_N = surface.VUNERABLE
            self.side_E = surface.BLOCKER
            self.side_S = surface.VUNERABLE
            self.side_W = surface.VUNERABLE
        elif(self.orientation == 2):
            self.side_N = surface.VUNERABLE
            self.side_E = surface.VUNERABLE
            self.side_S = surface.BLOCKER
            self.side_W = surface.VUNERABLE
        elif(self.orientation == 3):
            self.side_N = surface.VUNERABLE
            self.side_E = surface.VUNERABLE
            self.side_S = surface.VUNERABLE
            self.side_W = surface.BLOCKER

class Pyramid(Piece):
    allowed_moves = [action.NORTH, action.NORTH_EAST, action.EAST, action.SOUTH_EAST, action.SOUTH, action.SOUTH_WEST, action.WEST, action.NORTH_WEST, action.ROTATE_CW, action.ROTATE_CCW]
    can_initiate_swap = False
    can_be_swapped = True

    def __init__(self, color, position, orientation):
        super().__init__(color, position)
        self.symbol = 'Pyramid'
        self.set_orientation(orientation)
        self.can_swap = False

    def set_orientation(self,orientation):
        self.orientation = orientation % 4
        if(self.orientation == 0):
            self.side_N = surface.REFLECT_CW
            self.side_E = surface.REFLECT_CCW
            self.side_S = surface.VUNERABLE
            self.side_W = surface.VUNERABLE
        elif(self.orientation == 1):
            self.side_N = surface.VUNERABLE
            self.side_E = surface.REFLECT_CW
            self.side_S = surface.REFLECT_CCW
            self.side_W = surface.VUNERABLE
        elif(self.orientation == 2):
            self.side_N = surface.VUNERABLE
            self.side_E = surface.VUNERABLE
            self.side_S = surface.REFLECT_CW
            self.side_W = surface.REFLECT_CCW
        elif(self.orientation == 3):
            self.side_N = surface.REFLECT_CCW
            self.side_E = surface.VUNERABLE
            self.side_S = surface.VUNERABLE
            self.side_W = surface.REFLECT_CW

class Scarab(Piece):
    allowed_moves = [action.NORTH, action.NORTH_EAST, action.EAST, action.SOUTH_EAST, action.SOUTH, action.SOUTH_WEST, action.WEST, action.NORTH_WEST, action.ROTATE_CW]
    can_initiate_swap = True
    can_be_swapped = False

    def __init__(self, color, position, orientation):
        super().__init__(color, position)
        self.symbol = 'Scarab'
        self.set_orientation(orientation)

    def set_orientation(self,orientation):
        self.orientation = orientation % 2
        if(self.orientation == 0):
            self.side_N = surface.REFLECT_CW
            self.side_E = surface.REFLECT_CCW
            self.side_S = surface.REFLECT_CW
            self.side_W = surface.REFLECT_CCW
        elif(self.orientation == 1):
            self.side_N = surface.REFLECT_CCW
            self.side_E = surface.REFLECT_CW
            self.side_S = surface.REFLECT_CCW
            self.side_W = surface.REFLECT_CW 

class Sphynx(Piece):
    allowed_moves = [action.ROTATE_CW, action.ROTATE_CCW]
    can_initiate_swap = False
    can_be_swapped = False


    def __init__(self, color, position, orientation):
        super().__init__(color, position)
        self.symbol = 'Sphynx'
        self.can_swap = False
        self.set_orientation(orientation)

    def get_laser_direction(self):
        if self.orientation == 0:
            return action.NORTH
        elif self.orientation == 1:
            return action.EAST
        elif self.orientation == 2:
            return action.SOUTH
        elif self.orientation == 3:
            return action.WEST

    def set_orientation(self, orientation):
        self.orientation = orientation % 4
        if(self.orientation == 0):
            self.side_N = surface.EMIT_LASER
            self.side_E = surface.BLOCKER
            self.side_S = surface.BLOCKER
            self.side_W = surface.BLOCKER
        elif(self.orientation == 1):
            self.side_N = surface.BLOCKER
            self.side_E = surface.EMIT_LASER
            self.side_S = surface.BLOCKER
            self.side_W = surface.BLOCKER
        elif(self.orientation == 2):
            self.side_N = surface.BLOCKER
            self.side_E = surface.BLOCKER
            self.side_S = surface.EMIT_LASER
            self.side_W = surface.BLOCKER
        elif(self.orientation == 3):
            self.side_N = surface.BLOCKER
            self.side_E = surface.BLOCKER
            self.side_S = surface.BLOCKER
            self.side_W = surface.EMIT_LASER
