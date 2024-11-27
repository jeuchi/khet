

import sys
from piece import Pharaoh
from board import Board, parse_board_data, print_moves, print_move
from collections import deque
import os
import networkx as nx


class Solver:
    win_reward = 1e100

    def __init__(self, starting_board, player_color, debug = False, gamma = 0.9):
        self.starting_board = starting_board
        self.player_color = player_color
        self.root = TreeNode(starting_board)
        self.opponent_color = "Silver" if player_color == "Red" else "Red"
        self.gamma = gamma
        self.debug = debug
        self.current_node = self.root

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

        #self.minimax(self.root, True, search_depth)
        self.alphabeta(self.root, search_depth, -float('inf'), float('inf'), True)
        current_node = self.root
        print(f"Value: {current_node.value}")
        move_list = []
        while current_node.best_child is not None:
            current_node = current_node.best_child
            move_list.append(current_node.move)
            print(f"Value: {current_node.value}")

        return move_list
    

        
    def minimax(self, node, is_max, search_depth):
        turn_color = self.player_color if is_max else self.opponent_color

        if node.depth == search_depth or isinstance(node.piece_destroyed, Pharaoh):
            self.grade_board(node)
            return node.value

        # Expand the current node
        possible_moves=node.board.get_all_possible_moves(turn_color)
        if is_max:
            node.value = -float('inf')
        else:
            node.value = float('inf')

        for move in possible_moves:
            child_board = node.board.make_move(move, check_allowed=True)
            piece_destroyed = child_board.fire_laser(turn_color)

            #if TreeNode.is_visited(child_board):
                #continue
            
            child_node = TreeNode(child_board, node, move, piece_destroyed)
            node.add_child(child_node, move)
            
            current_value = self.minimax(child_node, not is_max, search_depth)

            if is_max and current_value > node.value:
                node.value = current_value
                node.best_child = child_node
                if node.value == self.win_reward:
                    break
            elif not is_max and current_value < node.value:
                node.value = current_value
                node.best_child = child_node
                if node.value == self.win_reward*-1:
                    break

        if node.value is None and current_value is None:
            print("!!!!!!!!!!!!!! NO MOVES FOUND !!!!!!!")
            self.grade_board(node)
        else:
            node.value = node.value * self.gamma
        return node.value
    

    def alphabeta(self, node, depth, alpha, beta, is_max):
        turn_color = self.player_color if is_max else self.opponent_color

        if depth == 0 or isinstance(node.piece_destroyed, Pharaoh):
            self.grade_board(node)
            return node.value

        possible_moves = node.board.get_all_possible_moves(turn_color)
        if is_max:
            value = -float('inf')
            for move in possible_moves:
                child_board = node.board.make_move(move, check_allowed=True)
                piece_destroyed = child_board.fire_laser(turn_color)
                child_node = TreeNode(child_board, node, move, piece_destroyed)
                node.add_child(child_node, move)
                child_node_value = self.alphabeta(child_node, depth - 1, alpha, beta, False)
                if child_node_value > value:
                    node.best_child = child_node
                    value = child_node_value
                    alpha = child_node_value
                if value == self.win_reward:
                    break
                if alpha >= beta:
                    break
            value = value * self.gamma
            node.value = value
            return value
        else:
            value = float('inf')
            for move in possible_moves:
                child_board = node.board.make_move(move, check_allowed=True)
                piece_destroyed = child_board.fire_laser(turn_color)
                child_node = TreeNode(child_board, node, move, piece_destroyed)
                node.add_child(child_node, move)
                child_node_value = self.alphabeta(child_node, depth - 1, alpha, beta, True)
                if child_node_value < value:
                    node.best_child = child_node
                    value = child_node_value
                    beta = child_node_value
                if value == -self.win_reward:
                    break
                if alpha >= beta:
                    break
            value = value * self.gamma
            node.value = value * self.gamma
            return value
            
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
                child_node = TreeNode(child_board, current_node, move, piece_destroyed)
                if isinstance(piece_destroyed, Pharaoh) and piece_destroyed.color == opponent_color:
                    return child_node
                current_node.add_child(child_node, move)
                queue.append(child_node)


    def grade_board(self, node):
        if isinstance(node.piece_destroyed, Pharaoh):
            if self.player_color == node.piece_destroyed.color:
                node.value = -self.win_reward
            else:
                node.value = self.win_reward
        else:
            #TODO generate better heuristic
            node.value = 0

    def num_nodes_searched(self):
        return TreeNode.num_nodes_made()

class TreeNode:
    visited_boards = set()
    nodes_made = 0

    def __init__(self, board, parent=None, move=None, piece_destroyed=None):
        self.board = board
        self.parent = parent
        self.children = {}   
        self.move = move
        self.depth = parent.depth + 1 if parent is not None else 0
        self.winner = None
        self.piece_destroyed = piece_destroyed
        self.value = None
        self.best_child = None
        TreeNode.nodes_made += 1  # Increment the counter when a node is created
        TreeNode.add_visited_board(board)

    def get_value(self):
        return self.value

    def add_child(self, child, move):
        self.children[move] = child

    def get_child(self, move):
        return self.children[move]

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
    def num_nodes_made(cls):
        return cls.nodes_made
    
    def display_tree(self, level=0, display_depth=1):
        indent = " " * (level * 4)
        print(f"{indent}Depth {self.depth}: Value {self.value}")
        for child in self.children:
            child.display_tree(level + 1)

    def display_tree_one_level(self):
        print(f"Depth {self.depth}: Value {self.value}")
        for child in self.children:
            print(f"    Depth {child.depth}: Value {child.value} Move {child.move[0]} to {child.move[1]}")

    def draw_tree(self):
        import matplotlib.pyplot as plt

        def add_edges(graph, node):
            for child in node.children:
                graph.add_edge(node, child)
                add_edges(graph, child)

        graph = nx.DiGraph()
        add_edges(graph, self)

        pos = nx.spring_layout(graph)
        labels = {node: f"Depth {node.depth}\nValue {node.value}" for node in graph.nodes()}

        plt.figure(figsize=(12, 8))
        nx.draw(graph, pos, with_labels=True, labels=labels, node_size=3000, node_color="skyblue", font_size=10, font_weight="bold", arrows=True)
        plt.title("Tree Structure")
        plt.show()
    


