

from piece import Pharaoh
from board import Board, parse_board_data, print_moves, print_move
from collections import deque
import os

def solve_single_agent(starting_board, player_color):
    # Create the root node
    root = TreeNode(starting_board)
    winning_node = find_winning_node_single_agent(root, player_color)

    winning_moves = deque()
    current_node = winning_node
    while current_node.parent is not None:
        winning_moves.appendleft(current_node.move)
        current_node = current_node.parent

    winning_moves_list = [*winning_moves]
    return winning_moves_list

    

def find_winning_node_single_agent(root, player_color):
    # Create a queue to hold the nodes to be expanded
    queue = [root]
    opponent_color = "Silver" if player_color == "Red" else "Red"

    # While there are nodes to be expanded
    while queue:
        current_node = queue.pop(0)
        # Check if the current node is a goal state
        if current_node.board.is_pharoh_destroyed(opponent_color):
            return current_node

        # Expand the current node
        possible_moves=current_node.board.get_all_possible_moves(player_color)
        #print_moves(possible_moves)

        for move in possible_moves:
            child_board = current_node.board.make_move(move, check_allowed=True)
            #child_board.display_board()

            piece_destroyed = child_board.fire_laser(player_color)
            print(piece_destroyed)
            child_node = TreeNode(child_board, current_node, move)
            if isinstance(piece_destroyed, Pharaoh) and piece_destroyed.color == opponent_color:
                return child_node
            current_node.add_child(child_node)
            queue.append(child_node)

class TreeNode:
    def __init__(self, board, parent=None, move=None):
        self.board = board
        self.parent = parent
        self.children = []
        self.move = move

    def add_child(self, child):
        self.children.append(child)


