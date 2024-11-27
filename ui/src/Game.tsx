import React, { useEffect, useState } from 'react';
import {
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Stack,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  Card,
  CardActionArea,
  CardContent,
  CardMedia
} from '@mui/material';
import Board from './Board';
import { Pieces, PieceType } from './Piece';
import LinkIcon from '@mui/icons-material/Link';
import LinkOff from '@mui/icons-material/LinkOff';
import ArrowLeft from '@mui/icons-material/ArrowLeft';
import ArrowRight from '@mui/icons-material/ArrowRight';
import Add from '@mui/icons-material/Add';
import { Save } from '@mui/icons-material';
import { AutoAwesome } from '@mui/icons-material';
import HistoryTable from './HistoryTable';
import axios from './axios';
import { DIRECTION_TO_ROTATION, LASER_SPEED } from './constants';
import { isMobile } from 'react-device-detect';
import { toast } from 'react-toastify';

import Classic from './assets/boards/classic.txt';
import test0 from './assets/boards/test-0.txt';
import test0Img from './assets/boards/test-0.png';
import test1 from './assets/boards/test-1.txt';
import test1Img from './assets/boards/test-1.png';
import test2 from './assets/boards/test-2.txt';
import test2Img from './assets/boards/test-2.png';
import test3 from './assets/boards/test-3.txt';
import test3Img from './assets/boards/test-3.png';
import test4 from './assets/boards/test-4.txt';
import test4Img from './assets/boards/test-4.png';
import test5 from './assets/boards/test-5.txt';
import test5Img from './assets/boards/test-5.png';
import test6 from './assets/boards/test-6.txt';
import test6Img from './assets/boards/test-6.png';
import test7 from './assets/boards/test-7.txt';
import test7Img from './assets/boards/test-7.png';
import mate1 from './assets/boards/mate_1.txt';
import mate1Img from './assets/boards/mate-1.png';
import mate2 from './assets/boards/mate_2.txt';
import mate2Img from './assets/boards/mate-2.png';
import mate3 from './assets/boards/mate_3.txt';
import mate3Img from './assets/boards/mate-3.png';
import mate_3_real from './assets/boards/mate_3_real.txt';
import mate_3_realImg from './assets/boards/mate_3_real.png';

const AVAILABLE_BOARDS = [
  { name: 'Test 0', file: test0, img: test0Img },
  { name: 'Test 1', file: test1, img: test1Img },
  { name: 'Test 2', file: test2, img: test2Img },
  { name: 'Test 3', file: test3, img: test3Img },
  { name: 'Test 4', file: test4, img: test4Img },
  { name: 'Test 5', file: test5, img: test5Img },
  { name: 'Test 6', file: test6, img: test6Img },
  { name: 'Test 7', file: test7, img: test7Img },
  { name: 'Mate 1', file: mate1, img: mate1Img },
  { name: 'Mate 2', file: mate2, img: mate2Img },
  { name: 'Mate 3', file: mate3, img: mate3Img },
  { name: 'Mate 3 Real', file: mate_3_real, img: mate_3_realImg }
];

export interface GameHistory {
  boardState: (string | null)[][];
  from: { row: number; col: number };
  to: { row: number; col: number };
  move: string;
  rotationAngles: { [key: string]: number };
}

export interface Game {
  initialBoardState: (string | null)[][];
  boardState: (string | null)[][];
  gameHistory: GameHistory[];
  rotationAngles: { [key: string]: number };
  currentMove: number;
  lastMove: {
    from: { row: number; col: number };
    to: { row: number; col: number };
  } | null;
  gameOver: boolean;
  editMode: boolean;
  pieceSelectionOpen: boolean;
  selectedCell: {
    row: number;
    col: number;
  } | null;
  rows: number;
  cols: number;
  linkOn: boolean;
  laserPath: {
    row: number;
    col: number;
    entry: string;
    exit: string;
  }[];
  laserAnimating: boolean;
  boardSelectionOpen: boolean;
  animateHistory: boolean;
  solvingSteps: string[] | null;
  currentSolvingStepIndex: number;
  isSolving: boolean;
  callingApi: boolean;
  ai: boolean;
  turn: 'silver' | 'red';
  isLookingAtHistory: boolean;
  callingNextMove: boolean;
  winner: 'silver' | 'red' | null;
  solvingBoardState: (string | null)[][];
}

// Direction vectors
const directions: { [key: string]: { dx: number; dy: number } } = {
  up: { dx: 0, dy: -1 },
  right: { dx: 1, dy: 0 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 }
};

// Opposite directions
const oppositeDirections: { [key: string]: string } = {
  up: 'down',
  right: 'left',
  down: 'up',
  left: 'right'
};

const INITIAL_BOARD_STATE = [
  ['', '', '', ''],
  ['', '', '', ''],
  ['', '', '', ''],
  ['', '', '', '']
];

const Game: React.FC = () => {
  const [game, setGame] = useState<Game>({
    initialBoardState: INITIAL_BOARD_STATE,
    boardState: INITIAL_BOARD_STATE,
    gameHistory: [],
    rotationAngles: {},
    currentMove: 0,
    lastMove: null,
    gameOver: false,
    editMode: true,
    pieceSelectionOpen: false,
    selectedCell: null,
    rows: 4,
    cols: 4,
    linkOn: true,
    laserPath: [],
    laserAnimating: false,
    boardSelectionOpen: false,
    animateHistory: false,
    solvingSteps: null,
    currentSolvingStepIndex: 0,
    isSolving: false,
    callingApi: false,
    ai: false,
    turn: 'silver',
    isLookingAtHistory: false,
    callingNextMove: false,
    winner: null,
    solvingBoardState: INITIAL_BOARD_STATE
  });

  const isAnkhSpace = (row: number, col: number) => {
    if (game.rows - 1 === col || (row === 0 && col === 1) || (row === game.rows - 1 && col === 1)) {
      return true;
    }
    return false;
  };

  const isEyeSpace = (row: number, col: number) => {
    if (
      col === 0 ||
      (col === game.cols - 2 && row === 0) ||
      (col === game.cols - 2 && row === game.rows - 1)
    ) {
      return true;
    }
    return false;
  };

  const handleBoardSizeChange = (newRows: number, newCols: number) => {
    if (newRows < 4 || newCols < 4) return;
    if (newRows > 10 || newCols > 10) return;

    const newBoardState = Array.from({ length: newRows }, () =>
      Array.from({ length: newCols }, () => '')
    );

    setGame((prevGame) => ({
      ...prevGame,
      boardState: newBoardState,
      rows: newRows,
      cols: newCols
    }));
  };

  const handleCellClick = (row: number, col: number) => {
    setGame((prevGame) => ({
      ...prevGame,
      selectedCell: { row, col },
      pieceSelectionOpen: true
    }));
  };

  const handleRemovePiece = (row: number, col: number) => {
    setGame((prevGame) => {
      const newBoardState = prevGame.boardState.map((r) => r.slice());
      newBoardState[row][col] = null;
      return { ...prevGame, boardState: newBoardState };
    });
  };

  const handlePieceSelect = async (piece: string) => {
    setGame((prevGame) => {
      const newBoardState = prevGame.boardState.map((r) => r.slice());
      const { row, col } = prevGame.selectedCell || { row: 0, col: 0 };
      newBoardState[row][col] = piece;
      return { ...prevGame, boardState: newBoardState, pieceSelectionOpen: false };
    });
  };

  const startGame = async () => {
    // Initialize the game rotation angles

    setGame((prevGame) => {
      const newRotationAngles: { [key: string]: number } = {};
      prevGame.boardState.forEach((row, i) => {
        row.forEach((cell, j) => {
          if (cell) {
            const [_, direction] = cell.split(',');
            newRotationAngles[`${i}-${j}`] = DIRECTION_TO_ROTATION[direction] || 0;
          }
        });
      });

      return {
        ...prevGame,
        initialBoardState: prevGame.boardState,
        rotationAngles: newRotationAngles,
        editMode: false,
        gameHistory: [],
        currentMove: 0,
        lastMove: null,
        gameOver: false,
        laserPath: [],
        laserAnimating: false,
        selectedCell: null,
        pieceSelectionOpen: false,
        isSolving: false,
        turn: 'silver',
        winner: null
      };
    });
  };

  const resetGame = () =>
    setGame((prevGame) => ({
      ...prevGame,
      boardState: prevGame.initialBoardState,
      gameHistory: [],
      rotationAngles: {},
      currentMove: 0,
      lastMove: null,
      gameOver: false,
      editMode: true,
      pieceSelectionOpen: false,
      selectedCell: null,
      laserPath: [],
      ai: false,
    }));

  const handleMovePiece = (
    fromPosition: { row: number; col: number },
    toPosition: { row: number; col: number }
  ) => {
    setGame((prevGame) => {
      let [piece, direction] =
        prevGame.boardState[fromPosition.row][fromPosition.col]?.split(',') || [];
      if (!piece) return prevGame;

      if (!direction || direction === undefined) {
        direction = 'up';
      }

      const columnLabels = Array.from({ length: prevGame.cols }, (_, i) =>
        String.fromCharCode('a'.charCodeAt(0) + i)
      );
      const rowLabels = Array.from({ length: prevGame.rows }, (_, i) => String(prevGame.rows - i));

      // Update the board rotation angles
      const newRotationAngles = { ...prevGame.rotationAngles };
      const fromCellKey = `${fromPosition.row}-${fromPosition.col}`;
      const toCellKey = `${toPosition.row}-${toPosition.col}`;
      newRotationAngles[toCellKey] = newRotationAngles[fromCellKey] || 0;
      delete newRotationAngles[fromCellKey];

      const newBoardState = prevGame.boardState.map((r) => r.slice());

      if (piece === 'red_scarab' || piece === 'silver_scarab') {
        // Swap positions with the piece at the target position
        const targetPiece = newBoardState[toPosition.row][toPosition.col];
        newBoardState[toPosition.row][toPosition.col] = `${piece},${direction}`;
        newBoardState[fromPosition.row][fromPosition.col] = targetPiece;
      } else {
        newBoardState[toPosition.row][toPosition.col] = `${piece},${direction}`;
        newBoardState[fromPosition.row][fromPosition.col] = null;
      }

      const formattedPieceType = piece.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      const log = `${formattedPieceType} ${columnLabels[fromPosition.col]}${rowLabels[fromPosition.row]} to ${
        columnLabels[toPosition.col]
      }${rowLabels[toPosition.row]}`;

      return {
        ...prevGame,
        boardState: newBoardState,
        gameHistory: [
          ...prevGame.gameHistory,
          {
            boardState: newBoardState,
            move: log,
            from: fromPosition,
            to: toPosition,
            rotationAngles: newRotationAngles
          }
        ],
        lastMove: { from: fromPosition, to: toPosition },
        currentMove: prevGame.gameHistory.length,
        rotationAngles: newRotationAngles
      };
    });
  };

  const animateLaser = (currentBoardState: (string | null)[][]) => {
    if (game.editMode) return;

    // Find the 'bl' piece on the board
    let sphinxPos = null;
    let direction = 'up';
    let sphinx = game.currentMove % 2 === 0 ? 'silver_sphinx' : 'red_sphinx';

    for (let i = 0; i < currentBoardState.length; i++) {
      for (let j = 0; j < currentBoardState[i].length; j++) {
        const cell = currentBoardState[i][j];
        if (cell && cell.startsWith(sphinx)) {
          sphinxPos = { row: i, col: j };
          // Extract rotation if any
          const parts = cell.split(',');
          if (parts.length > 1) {
            direction = parts[1];
          }
          break;
        }
      }
      if (sphinxPos) {
        break;
      }
    }

    if (!sphinxPos) {
      console.error(`No ${sphinx} found on the board.`);
      return;
    }

    // Simulate laser path
    const path: {
      row: number;
      col: number;
      entry: string; // Entry direction into the cell
      exit: string; // Exit direction from the cell
    }[] = [];

    let x = sphinxPos.col;
    let y = sphinxPos.row;
    let currentDirection = direction;
    let steps = 0;
    const maxSteps = 100; // To prevent infinite loops

    // Add the initial segment from the laser source
    path.push({
      row: sphinxPos.row,
      col: sphinxPos.col,
      entry: '', // The laser starts moving in the initial direction
      exit: direction
    });

    const step = () => {
      if (steps++ > maxSteps) {
        console.error('Laser simulation exceeded maximum steps.');
        setGame((prevGame) => ({ ...prevGame, laserPath: [...path], laserAnimating: false }));
        return;
      }

      const { dx, dy } = directions[currentDirection];
      x += dx;
      y += dy;

      // Check bounds
      if (x < 0 || x >= currentBoardState[0].length || y < 0 || y >= currentBoardState.length) {
        // Laser is out of bounds, end animation
        setTimeout(
          () =>
            setGame((prevGame) => ({
              ...prevGame,
              laserAnimating: false,
              laserPath: [],
              turn: prevGame.currentMove % 2 === 0 ? 'red' : 'silver'
            })),
          LASER_SPEED * 5
        );
        return;
      }

      const cellEntry = oppositeDirections[currentDirection];

      // Check if laser hits a piece
      let [piece, pieceDirection] = currentBoardState[y][x]?.split(',') || [];
      if (pieceDirection === 'undefined' || !pieceDirection) {
        pieceDirection = 'up';
      }

      //console.log('Piece at', { row: y, col: x }, 'is', piece, 'Direction:', pieceDirection);

      if (piece && piece !== '') {
        // Determine new direction based on piece type
        const newDirection = handleReflection(piece, pieceDirection, currentDirection);

        if (newDirection) {
          // Reflect laser
          path.push({
            row: y,
            col: x,
            entry: cellEntry,
            exit: newDirection
          });
          currentDirection = newDirection;
          setGame((prevGame) => ({ ...prevGame, laserPath: [...path], laserAnimating: true }));
          setTimeout(step, LASER_SPEED);
        } else {
          // Laser is blocked or absorbed, end animation
          //console.log('Laser hit a piece at', { row: y, col: x }, 'Piece:', piece);
          if (piece === 'red_pharaoh' || piece === 'silver_pharaoh') {
            path.push({
              row: y,
              col: x,
              entry: cellEntry,
              exit: ''
            });
            setGame((prevGame) => ({
              ...prevGame,
              laserPath: [...path],
              gameOver: true,
              laserAnimating: false,
              turn: prevGame.currentMove % 2 === 0 ? 'red' : 'silver',
              winner: piece === 'red_pharaoh' ? 'silver' : 'red'
            }));
          } else if (piece === 'red_sphinx' || piece === 'silver_sphinx') {
            // Sphinx can't be destroyed by the laser
            //console.log('Sphinx absorbed the laser');
            path.push({
              row: y,
              col: x,
              entry: cellEntry,
              exit: ''
            });
            setGame((prevGame) => ({ ...prevGame, laserPath: [], laserAnimating: false }));
          } else if (piece === 'red_anubis' || piece === 'silver_anubis') {
            // Check if the anubis is facing the laser. Note that 'up' is the default direction
            // and Anubis piece is looking towards the right. If he's looking towards the laser,
            // the laser will be absorbed otherwise he will die.
            const anubisDirection = pieceDirection;
            //console.log('Anubis direction:', anubisDirection, 'Laser direction:', currentDirection);
            if (
              (anubisDirection === 'up' && currentDirection === 'left') ||
              (anubisDirection === 'right' && currentDirection === 'up') ||
              (anubisDirection === 'down' && currentDirection === 'right') ||
              (anubisDirection === 'left' && currentDirection === 'down')
            ) {
              // Anubis absorbed the laser
              path.push({
                row: y,
                col: x,
                entry: cellEntry,
                exit: ''
              });
              setGame((prevGame) => ({ ...prevGame, laserPath: [...path], laserAnimating: false }));
              setTimeout(
                () => setGame((prevGame) => ({ ...prevGame, laserPath: [] })),
                LASER_SPEED * 5
              );
            } else {
              // Anubis is dead, remove it from the board
              setGame((prevGame) => {
                const newBoardState = currentBoardState.map((r) => r.slice());
                newBoardState[y][x] = null;

                return {
                  ...prevGame,
                  boardState: newBoardState,
                  laserPath: [],
                  laserAnimating: false,
                  turn: prevGame.currentMove % 2 === 0 ? 'red' : 'silver'
                };
              });
            }
          } else {
            // Piece is dead, remove it from the board
            //console.log('Piece is dead, removing it from the board');
            const newBoardState = currentBoardState.map((r) => r.slice());
            newBoardState[y][x] = null;
            setGame((prevGame) => ({
              ...prevGame,
              boardState: newBoardState,
              laserAnimating: false,
              turn: prevGame.currentMove % 2 === 0 ? 'red' : 'silver'
            }));
          }
        }
        return;
      }

      // Empty cell, continue laser path
      path.push({
        row: y,
        col: x,
        entry: cellEntry,
        exit: currentDirection
      });

      // Continue laser movement after a delay
      setGame((prevGame) => ({ ...prevGame, laserPath: [...path], laserAnimating: true }));
      setTimeout(step, LASER_SPEED);
    };

    // Start the laser movement
    setGame((prevGame) => ({
      ...prevGame,
      laserPath: [...path],
      laserAnimating: true
    }));
    setTimeout(step, LASER_SPEED);
  };

  const handleReflection = (
    pieceType: string,
    direction: string,
    incomingDirection: string
  ): string | null => {
    const rotation = DIRECTION_TO_ROTATION[direction] || 0;

    //console.log('Piece:', pieceType, 'Direction:', incomingDirection, 'Rotation:', rotation);

    switch (pieceType) {
      case 'red_pyramid':
      case 'silver_pyramid':
        return getPyramidReflection(rotation, incomingDirection);
      case 'red_scarab':
      case 'silver_scarab':
        return getScarabReflection(rotation, incomingDirection);
      default:
        break;
    }

    // Dead piece, laser is absorbed
    return null;
  };

  const getPyramidReflection = (rotation: number, incomingDirection: string): string | null => {
    const mirrorReflections: { [key: number]: { [key: string]: string } } = {
      0: { up: 'left', right: 'down' },
      90: { right: 'up', down: 'left' },
      180: { left: 'up', down: 'right' },
      270: { up: 'right', left: 'down' }
    };

    const reflectionMap = mirrorReflections[rotation % 360];
    return reflectionMap ? reflectionMap[incomingDirection] || null : null;
  };

  const getScarabReflection = (rotation: number, incomingDirection: string): string | null => {
    const mirrorReflections: { [key: number]: { [key: string]: string } } = {
      0: { up: 'left', right: 'down', left: 'up', down: 'right' },
      90: { right: 'up', down: 'left', left: 'down', up: 'right' },
      180: { left: 'up', down: 'right', right: 'down', up: 'left' },
      270: { up: 'right', left: 'down', right: 'up', down: 'left' }
    };

    const reflectionMap = mirrorReflections[rotation % 360];
    return reflectionMap ? reflectionMap[incomingDirection] || null : null;
  };

  const handleRotatePiece = (row: number, col: number, rotationDirection: string) => {
    setGame((prevGame) => {
      const cellValue = prevGame.boardState[row][col];
      if (!cellValue) return prevGame; // No piece to rotate
      const [pieceName, oldDirection] = cellValue.split(',').map((part: string) => part.trim());

      // Calculate the new rotation angle
      const cellKey = `${row}-${col}`;
      const previousRotation =
        prevGame.rotationAngles[cellKey] || DIRECTION_TO_ROTATION[oldDirection] || 0;
      const rotationDelta = rotationDirection === 'left' ? -90 : 90;
      const newRotation = previousRotation + rotationDelta;

      // Update the rotation angle in state
      const newRotationAngles = { ...prevGame.rotationAngles, [cellKey]: newRotation };

      const newBoardState = prevGame.boardState.map((r: (string | null)[]) => r.slice());

      let newDirection = '';
      switch (oldDirection) {
        case 'left':
          if (rotationDirection === 'left') {
            newDirection = 'down';
          } else {
            newDirection = 'up';
          }
          break;
        case 'right':
          if (rotationDirection === 'left') {
            newDirection = 'up';
          } else {
            newDirection = 'down';
          }
          break;
        case 'down':
          if (rotationDirection === 'left') {
            newDirection = 'right';
          } else {
            newDirection = 'left';
          }
          break;
        case 'up':
        default:
          if (rotationDirection === 'left') {
            newDirection = 'left';
          } else {
            newDirection = 'right';
          }
          break;
      }

      newBoardState[row][col] = `${pieceName},${newDirection}`;

      const [pieceType] = newBoardState[row][col]?.split(',') || [];
      const formattedPieceType = pieceType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      const log = `${formattedPieceType} rotated ${rotationDirection}`;
      const fromPosition = { row, col };
      const toPosition = { row, col };

      return {
        ...prevGame,
        boardState: newBoardState,
        rotationAngles: newRotationAngles,
        gameHistory: prevGame.editMode
          ? []
          : [
              ...prevGame.gameHistory,
              {
                boardState: newBoardState,
                move: log,
                from: fromPosition,
                to: toPosition,
                rotationAngles: newRotationAngles
              }
            ],
        lastMove: prevGame.editMode ? null : { from: fromPosition, to: toPosition },
        currentMove: prevGame.editMode ? 0 : prevGame.gameHistory.length
      };
    });
  };

  useEffect(() => {
    if (game.boardState.length === 0) return;
    setGame((prevGame) => ({
      ...prevGame,
      rows: game.boardState.length,
      cols: game.boardState[0].length
    }));
  }, [game.boardState]);

  const availablePieces: PieceType[] = Object.keys(Pieces) as PieceType[];

  const saveGameBoard = async (blob: Blob) => {
    const a = document.createElement('a');
    a.download = 'my-file.txt';
    a.href = URL.createObjectURL(blob);
    a.addEventListener('click', (_) => {
      setTimeout(() => URL.revokeObjectURL(a.href), 30 * 1000);
    });
    a.click();
  };

  const selectGameBoard = async (file: string) => {
    try {
      const response = await fetch(file);
      const content = await response.text();
      const newBoardState = JSON.parse(content);
      setGame((prevGame) => ({
        ...prevGame,
        boardState: newBoardState,
        boardSelectionOpen: false
      }));
    } catch (error: any) {
      toast.error('Error loading the game board');
    }
  };

  const loadGameBoard = async (file: File) => {
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      if (!e.target || !e.target.result) return;
      const content = e.target.result as string;
      const newBoardState = JSON.parse(content);
      setGame((prevGame) => ({ ...prevGame, boardState: newBoardState }));
    };
    reader.readAsText(file);
  };
  useEffect(() => {
    if (!game.editMode && game.ai) {
      solveGame();
    } else if (!game.ai) {
      setGame((prevGame) => ({ ...prevGame, solvingSteps: null }));
    }
  }, [game.editMode, game.ai]);

  const solveGame = async () => {
    setGame((prevGame) => ({ ...prevGame, callingApi: true, solvingBoardState: prevGame.boardState }));

    try {
      const res = await axios.post('/solve', {
        board: game.boardState.map((r) => r.map((c) => (c ? c : ' ')))
      });

      const solution = res.data;
      if (!solution) {
        toast.error('No solution found!');
        return;
      }

      const steps = solution.split('\n').filter((step: string) => step && step.length > 0);

      // Set the solving steps and start index
      setGame((prevGame) => ({
        ...prevGame,
        solvingSteps: steps,
        currentSolvingStepIndex: 0,
        callingApi: false
      }));
    } catch (error: any) {
      setGame((prevGame) => ({ ...prevGame, callingApi: false }));
      toast.error(error.response.statusText);
    }
  };

  // Define a function to process the next step
  const processNextSolvingStep = () => {
    if (!game.solvingSteps || game.currentSolvingStepIndex >= game.solvingSteps.length) {
      // All steps processed, stop solving
      setGame((prevGame) => ({ ...prevGame, isSolving: false, solvingSteps: null }));
      return;
    }

    const step = game.solvingSteps[game.currentSolvingStepIndex];
    const [backendColStr, backendRowStr, action] = step.split(',');
    if (!backendRowStr || !backendColStr || !action) {
      // Invalid step, proceed to next
      setGame((prevGame) => ({
        ...prevGame,
        currentSolvingStepIndex: prevGame.currentSolvingStepIndex + 1
      }));
      return;
    }

    const backendRow = parseInt(backendRowStr);
    const backendCol = parseInt(backendColStr);

    // Convert backend position to frontend position
    const frontendRow = game.rows - backendRow - 1;
    const frontendCol = backendCol;

    if (action === 'ROTATE_CCW' || action === 'ROTATE_CW') {
      const rotation = action === 'ROTATE_CCW' ? 'left' : 'right';
      //console.log(`Rotate piece at (${frontendRow}, ${frontendCol}) to the ${rotation}`);
      handleRotatePiece(frontendRow, frontendCol, rotation);
    } else {
      const direction = action.toUpperCase();
      // Map the direction to new row/column
      let newRow = frontendRow;
      let newCol = frontendCol;

      switch (direction) {
        case 'NORTH':
          newRow -= 1;
          break;
        case 'SOUTH':
          newRow += 1;
          break;
        case 'EAST':
          newCol += 1;
          break;
        case 'WEST':
          newCol -= 1;
          break;
        case 'NORTH_EAST':
          newRow -= 1;
          newCol += 1;
          break;
        case 'NORTH_WEST':
          newRow -= 1;
          newCol -= 1;
          break;
        case 'SOUTH_EAST':
          newRow += 1;
          newCol += 1;
          break;
        case 'SOUTH_WEST':
          newRow += 1;
          newCol -= 1;
          break;
        default:
          console.error(`Unknown direction: ${direction}`);
          break;
      }

      //console.log(`Move piece from (${frontendRow}, ${frontendCol}) to (${newRow}, ${newCol})`);
      handleMovePiece({ row: frontendRow, col: frontendCol }, { row: newRow, col: newCol });
    }

    // After handling the move, increment currentSolvingStepIndex
    setGame((prevGame) => ({
      ...prevGame,
      currentSolvingStepIndex: prevGame.currentSolvingStepIndex + 1
    }));
  };

  // Use useEffect to process steps when laser animation is not active
  useEffect(() => {
    if (game.isSolving && !game.laserAnimating) {
      processNextSolvingStep();
    }
  }, [game.laserAnimating, game.isSolving, game.solvingSteps]);

  // Ensure the laser animation is triggered after each move/rotation
  useEffect(() => {
    if (game.currentMove >= game.gameHistory.length || game.gameHistory.length === 0) {
      return;
    }

    const currentBoardState = game.gameHistory[game.currentMove].boardState;
    animateLaser(currentBoardState);
  }, [game.gameHistory, game.currentMove]);

  useEffect(() => {
    if (game.currentMove < game.gameHistory.length - 1) {
      setGame((prevGame) => ({
        ...prevGame,
        isLookingAtHistory: true
      }));
    } else {
      setGame((prevGame) => ({
        ...prevGame,
        isLookingAtHistory: false
      }));
    }
  }, [game.currentMove, game.gameHistory]);

  // If the AI mode is enabled, check if player made their move and it's red turn to make a turn
  useEffect(() => {
    const fetchNextMove = async () => {
      if (game.editMode || !game.ai || game.isSolving || game.gameOver || game.isLookingAtHistory) return;

      setGame((prevGame) => ({ ...prevGame, callingNextMove: true }));

      if (game.turn === 'red') {
        try {
          const res = await axios.post('/next-best-move', {
            board: game.boardState.map((r) => r.map((c) => (c ? c : ' ')))
          });

          const move = res.data;
          if (!move) {
            toast.error('No next best move found!');
            return;
          }
        } catch (error: any) {
          toast.error(error.response.data);
        }
      }

      setGame((prevGame) => ({ ...prevGame, callingNextMove: false }));
    };

    //fetchNextMove();
  }, [game.ai, game.editMode, game.turn, game.isLookingAtHistory, game.gameOver, game.isSolving]);

  useEffect(() => {
    if (!game.animateHistory || game.laserAnimating) return;
    const interval = setInterval(() => {
      setGame((prevGame) => {
        const nextMove = prevGame.currentMove + 1;
        if (nextMove >= prevGame.gameHistory.length) {
          clearInterval(interval);
          return { ...prevGame, animateHistory: false };
        }

        const nextBoardState = prevGame.gameHistory[nextMove].boardState;
        return {
          ...prevGame,
          currentMove: nextMove,
          lastMove: {
            from: prevGame.gameHistory[nextMove].from,
            to: prevGame.gameHistory[nextMove].to
          },
          boardState: nextBoardState,
          rotationAngles: prevGame.gameHistory[nextMove].rotationAngles
        };
      });
    }, 500);
    return () => clearInterval(interval);
  }, [game.animateHistory, game.laserAnimating]);

  return (
    <Stack>
      <Typography variant="h3" align="center" style={{ marginBottom: 25, fontWeight: 500 }}>
        Khet
      </Typography>
      {game.editMode ? (
        <Stack
          direction={isMobile ? 'column' : 'row'}
          spacing={2}
          alignItems="start"
          justifyContent={'center'}
        >
          <Board
            game={game}
            onMovePiece={handleMovePiece}
            onCellClick={handleCellClick}
            onRemovePiece={handleRemovePiece}
            onRotatePiece={handleRotatePiece}
          />

          <Paper elevation={20} sx={{ borderRadius: 5 }}>
            <Stack direction="column" spacing={1} m={3} alignItems={'start'}>
              <Stack direction="column" justifyContent={'space-evenly'}>
                <TextField
                  label="Rows"
                  type="number"
                  variant="standard"
                  value={game.rows}
                  onChange={(e) =>
                    handleBoardSizeChange(
                      parseInt(e.target.value) || 0,
                      game.linkOn ? parseInt(e.target.value) : game.cols
                    )
                  }
                />

                <Tooltip title={game.linkOn ? 'Rows/Columns linked' : 'Rows/Columns not linked'}>
                  <span>
                    <IconButton
                      size="small"
                      sx={{ m: 1 }}
                      onClick={() =>
                        setGame((prevGame) => ({ ...prevGame, linkOn: !prevGame.linkOn }))
                      }
                      color={game.linkOn ? 'primary' : 'default'}
                    >
                      {game.linkOn ? <LinkIcon /> : <LinkOff />}
                    </IconButton>
                  </span>
                </Tooltip>

                <TextField
                  label="Columns"
                  type="number"
                  variant="standard"
                  value={game.cols}
                  onChange={(e) =>
                    handleBoardSizeChange(
                      game.linkOn ? parseInt(e.target.value) : game.rows,
                      parseInt(e.target.value) || 0
                    )
                  }
                />
              </Stack>

              <Button
                variant="contained"
                color="primary"
                onClick={() =>
                  saveGameBoard(new Blob([JSON.stringify(game.boardState)], { type: 'text/plain' }))
                }
                style={{ marginTop: 15 }}
              >
                Save Board
              </Button>

              <Button
                variant="contained"
                color="primary"
                component="label"
                style={{ marginTop: 15 }}
              >
                Load Board
                <input
                  type="file"
                  hidden
                  onChange={(e) => e.target.files && loadGameBoard(e.target.files[0])}
                />
              </Button>

              <Button
                variant="contained"
                color="primary"
                onClick={() => setGame((prevGame) => ({ ...prevGame, boardSelectionOpen: true }))}
                style={{ marginTop: 15 }}
              >
                Select Puzzle
              </Button>

              <Dialog
                fullWidth
                open={game.boardSelectionOpen}
                onClose={() => setGame((prevGame) => ({ ...prevGame, boardSelectionOpen: false }))}
              >
                <DialogTitle>Select a Puzzle</DialogTitle>
                <DialogContent>
                  <Grid container spacing={2}>
                    {AVAILABLE_BOARDS.map((board) => (
                      <Grid item xs={12} sm={6} md={4} key={board.name}>
                        <Card sx={{ maxWidth: 400 }}>
                          <CardActionArea onClick={() => selectGameBoard(board.file)}>
                            <CardContent>
                              <Typography gutterBottom variant="h6" component="div">
                                {board.name}
                              </Typography>
                              {board.img && (
                                <CardMedia component="img" image={board.img} alt={board.name} />
                              )}
                            </CardContent>
                          </CardActionArea>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </DialogContent>
                <DialogActions>
                  <Button
                    onClick={() =>
                      setGame((prevGame) => ({ ...prevGame, boardSelectionOpen: false }))
                    }
                  >
                    Close
                  </Button>
                </DialogActions>
              </Dialog>
              <Button
                variant="contained"
                color="secondary"
                onClick={startGame}
                style={{ marginTop: 15 }}
              >
                Start Game
              </Button>
            </Stack>
          </Paper>

          <Dialog
            open={game.pieceSelectionOpen}
            onClose={() => setGame((prevGame) => ({ ...prevGame, pieceSelectionOpen: false }))}
          >
            <DialogTitle>Select a Piece</DialogTitle>
            <DialogContent>
              <Grid container spacing={2} columns={10}>
                {['red', 'silver'].map((color) => (
                  <React.Fragment key={color}>
                    {availablePieces
                      .filter((pieceKey: PieceType) => pieceKey.startsWith(color))
                      .filter((pieceKey: PieceType) => {
                        if (game.selectedCell) {
                          const { row, col } = game.selectedCell;
                          if (pieceKey.startsWith('red') && isAnkhSpace(row, col)) {
                            return false;
                          }
                          if (pieceKey.startsWith('silver') && isEyeSpace(row, col)) {
                            return false;
                          }
                        }
                        return true;
                      })
                      .map((pieceKey: PieceType) => (
                        <Grid item xs={2} key={pieceKey}>
                          <img
                            src={Pieces[pieceKey].image}
                            width={75}
                            height={75}
                            alt={pieceKey}
                            onClick={() => handlePieceSelect(pieceKey)}
                            style={{ cursor: 'pointer', maxWidth: '100%' }}
                          />
                        </Grid>
                      ))}
                  </React.Fragment>
                ))}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => setGame((prevGame) => ({ ...prevGame, pieceSelectionOpen: false }))}
              >
                Close
              </Button>
            </DialogActions>
          </Dialog>
        </Stack>
      ) : (
        <Stack
          direction={isMobile ? 'column' : 'row'}
          alignItems="start"
          spacing={2}
          justifyContent={'center'}
        >
          <Board game={game} onMovePiece={handleMovePiece} onRotatePiece={handleRotatePiece} />

          <Paper elevation={20} sx={{ width: '350px', borderRadius: 5 }}>
            <Stack direction="column" spacing={3} m={3} alignItems={'start'}>
              <HistoryTable game={game} setGame={setGame} />

              <Stack direction="row" alignContent={'space-evenly'} spacing={2}>
                <Tooltip title="Reset Game">
                  <span>
                    <Button
                      disabled={game.laserAnimating || game.animateHistory}
                      variant="contained"
                      onClick={resetGame}
                      color="secondary"
                    >
                      <Add />
                    </Button>
                  </span>
                </Tooltip>

                <Tooltip title="Save Board">
                  <span>
                    <Button
                      variant="contained"
                      disabled={game.animateHistory}
                      onClick={() =>
                        saveGameBoard(
                          new Blob([JSON.stringify(game.boardState)], { type: 'text/plain' })
                        )
                      }
                      color="primary"
                    >
                      <Save />
                    </Button>
                  </span>
                </Tooltip>
                
                <Tooltip title="Move Back">
                  <span>
                    <Button
                      variant="contained"
                      disabled={
                        game.laserAnimating ||
                        game.currentMove === 0 ||
                        game.gameHistory.length === 0 ||
                        game.animateHistory
                      }
                      onClick={() => {
                        if (game.currentMove === 0) return;
                        const newMove =
                          game.currentMove > 0 ? game.currentMove - 1 : game.currentMove;
                        setGame((prevGame) => ({
                          ...prevGame,
                          currentMove: newMove,
                          boardState: game.gameHistory[newMove].boardState,
                          lastMove: {
                            from: game.gameHistory[newMove].from,
                            to: game.gameHistory[newMove].to
                          },
                          rotationAngles: game.gameHistory[newMove].rotationAngles || {}
                        }));
                      }}
                      color="primary"
                    >
                      <ArrowLeft />
                    </Button>
                  </span>
                </Tooltip>

                <Tooltip title="Move Forward">
                  <span>
                    <Button
                      variant="contained"
                      disabled={
                        game.laserAnimating ||
                        game.currentMove === game.gameHistory.length - 1 ||
                        game.gameHistory.length === 0 ||
                        game.animateHistory
                      }
                      onClick={() => {
                        if (game.gameHistory.length === 0) return;
                        const newMove =
                          game.currentMove < game.gameHistory.length - 1
                            ? game.currentMove + 1
                            : game.currentMove;
                        setGame((prevGame) => ({
                          ...prevGame,
                          currentMove: newMove,
                          boardState: game.gameHistory[newMove].boardState,
                          lastMove: {
                            from: game.gameHistory[newMove].from,
                            to: game.gameHistory[newMove].to
                          },
                          rotationAngles: game.gameHistory[newMove].rotationAngles || {}
                        }));
                      }}
                      color="primary"
                    >
                      <ArrowRight />
                    </Button>
                  </span>
                </Tooltip>
              </Stack>
            </Stack>
          </Paper>
        </Stack>
      )}
    </Stack>
  );
};

export default Game;
