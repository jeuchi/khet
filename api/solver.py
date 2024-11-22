

from piece import Pharaoh
from board import Board, parse_board_data, print_moves, print_move
from collections import deque
import os


class Solver:

    def __init__(self, starting_board, player_color, debug = False):
        self.starting_board = starting_board
        self.player_color = player_color
        self.root = TreeNode(starting_board)

    def solve_single_agent(self, debug = False):
        TreeNode.reset_visited()


        winning_node = self.find_winning_node_single_agent()

        winning_moves = deque()
        current_node = winning_node
        
        while current_node.parent is not None:
            winning_moves.appendleft(current_node.move)
            current_node = current_node.parent

        winning_moves_list = [*winning_moves]
        if debug:
            print("Winning moves:")
            print_moves(winning_moves_list)
            winning_node.board.display_board()
        num_visited = TreeNode.num_nodes_made()
        print(f"Numer of visited nodes: {num_visited}")
        return winning_moves_list

    def solve_multi_agent(self, starting_board, player_color, debug = False, search_depth = 4):
        # Create the root node
        TreeNode.reset_visited()

        self.expand_tree_multi_agent(search_depth)

        
    def expand_tree_multi_agent(self, search_depth):
        # Create a queue to hold the nodes to be expanded
        queue = [self.root]
        opponent_color = "Silver" if self.player_color == "Red" else "Red"

        # While there are nodes to be expanded
        while queue:
            current_node = queue.pop(0)

            if current_node.depth == search_depth:
                continue

            if current_node.depth % 2 == 0:
                turn_color = self.player_color
            else:
                turn_color = opponent_color

            # Check if the current node is a goal state
            if current_node.pharaoh_destroyed:
                continue

            # Expand the current node
            possible_moves=current_node.board.get_all_possible_moves(turn_color)

            for move in possible_moves:
                child_board = current_node.board.make_move(move, check_allowed=True)
                piece_destroyed = child_board.fire_laser(self.player_color)

                if TreeNode.is_visited(child_board):
                    continue
                child_node = TreeNode(child_board, current_node, move)
                
                current_node.add_child(child_node)
                if isinstance(piece_destroyed, Pharaoh):
                    child_node.pharaoh_destroyed()
                    continue
                if child_node.depth == search_depth:
                    continue
                else:
                    queue.append(child_node)

        

    def find_winning_node_single_agent(self):
        # Create a queue to hold the nodes to be expanded
        queue = [self.root]
        opponent_color = "Silver" if self.player_color == "Red" else "Red"

        # While there are nodes to be expanded
        while queue:
            current_node = queue.pop(0)
            # Check if the current node is a goal state
            if current_node.board.is_pharoh_destroyed(opponent_color):
                return current_node

            # Expand the current node
            possible_moves=current_node.board.get_all_possible_moves(self.player_color)

            for move in possible_moves:
                child_board = current_node.board.make_move(move, check_allowed=True)
                piece_destroyed = child_board.fire_laser(self.player_color)

                if TreeNode.is_visited(child_board):
                    continue
                child_node = TreeNode(child_board, current_node, move)
                if isinstance(piece_destroyed, Pharaoh) and piece_destroyed.color == opponent_color:
                    return child_node
                current_node.add_child(child_node)
                queue.append(child_node)

class TreeNode:
    visited_boards = set()
    nodes_made = 0

    def __init__(self, board, parent=None, move=None):
        self.board = board
        self.parent = parent
        self.children = []
        self.move = move
        self.depth = parent.depth + 1 if parent is not None else 0
        self.pharaoh_destroyed = False
        TreeNode.nodes_made += 1  # Increment the counter when a node is created
        TreeNode.add_visited_board(board)

    def add_child(self, child):
        self.children.append(child)

    def pharaoh_destroyed(self):
        self.pharaoh_destroyed = True

    @classmethod
    def add_visited_board(cls, board):
        cls.visited_boards.add(board)

    @classmethod
    def reset_visited(cls):
        cls.visited_boards = set()
        nodes_made = 0

    @classmethod
    def is_visited(cls, board):
        if board in cls.visited_boards:
            return True
        return False
    
    @classmethod
    def num_visited(cls):
        return len(cls.visited_boards)

    @classmethod
    def num_nodes_made(cls):
        return cls.nodes_made
    


