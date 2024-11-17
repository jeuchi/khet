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
  Container
} from '@mui/material';
import Board from './Board';
import { Pieces, PieceType } from './Piece';
import LinkIcon from '@mui/icons-material/Link';
import LinkOff from '@mui/icons-material/LinkOff';
import ArrowLeft from '@mui/icons-material/ArrowLeft';
import ArrowRight from '@mui/icons-material/ArrowRight';
import Add from '@mui/icons-material/Add';
import { AutoAwesome } from '@mui/icons-material';
import HistoryTable from './HistoryTable';
import axios from './axios';
import { DIRECTION_TO_ROTATION, LASER_SPEED } from './constants';
import BuildingBlocks from './assets/building-blocks.mp4';

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
  isSolving: boolean;
  laserPath: {
    row: number;
    col: number;
    entry: string;
    exit: string;
  }[];
  laserAnimating: boolean;
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
    isSolving: false,
    laserPath: [],
    laserAnimating: false
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
        editMode: false
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
      laserPath: []
    }));

  const handleMovePiece = (
    fromPosition: { row: number; col: number },
    toPosition: { row: number; col: number }
  ) => {
    setGame((prevGame) => {
      const [piece, direction] =
        prevGame.boardState[fromPosition.row][fromPosition.col]?.split(',') || [];
      if (!piece) return prevGame;

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

      const log = `${piece} ${columnLabels[fromPosition.col]}${rowLabels[fromPosition.row]} to ${
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
    let silverSphinxPos = null;
    let direction = 'up';

    for (let i = 0; i < currentBoardState.length; i++) {
      for (let j = 0; j < currentBoardState[i].length; j++) {
        const cell = currentBoardState[i][j];
        if (cell && cell.startsWith('silver_sphinx')) {
          silverSphinxPos = { row: i, col: j };
          // Extract rotation if any
          const parts = cell.split(',');
          if (parts.length > 1) {
            direction = parts[1];
          }
          break;
        }
      }
      if (silverSphinxPos) {
        break;
      }
    }

    if (!silverSphinxPos) {
      console.error('No silver sphinx found on the board.');
      return;
    }

    // Simulate laser path
    const path: {
      row: number;
      col: number;
      entry: string; // Entry direction into the cell
      exit: string; // Exit direction from the cell
    }[] = [];

    let x = silverSphinxPos.col;
    let y = silverSphinxPos.row;
    let currentDirection = direction;
    let steps = 0;
    const maxSteps = 100; // To prevent infinite loops

    // Add the initial segment from the laser source
    path.push({
      row: silverSphinxPos.row,
      col: silverSphinxPos.col,
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
          () => setGame((prevGame) => ({ ...prevGame, laserAnimating: false, laserPath: [] })),
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

      console.log('Piece at', { row: y, col: x }, 'is', piece, 'Direction:', pieceDirection);

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
              laserAnimating: false
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
              console.log('Anubis absorbed the laser');
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
              const newBoardState = currentBoardState.map((r) => r.slice());
              newBoardState[y][x] = null;
              setGame((prevGame) => ({
                ...prevGame,
                boardState: newBoardState,
                laserPath: [],
                laserAnimating: false
              }));
            }
          } else {
            // Piece is dead, remove it from the board
            //console.log('Piece is dead, removing it from the board');
            const newBoardState = currentBoardState.map((r) => r.slice());
            newBoardState[y][x] = null;
            setGame((prevGame) => ({
              ...prevGame,
              boardState: newBoardState,
              laserAnimating: false
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
    setGame((prevGame) => ({ ...prevGame, laserPath: [...path], laserAnimating: true }));
    setTimeout(step, LASER_SPEED);
  };

  const handleReflection = (
    pieceType: string,
    direction: string,
    incomingDirection: string
  ): string | null => {
    const rotation = DIRECTION_TO_ROTATION[direction] || 0;

    console.log('Piece:', pieceType, 'Direction:', incomingDirection, 'Rotation:', rotation);

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
      const log = `${pieceType} rotated ${rotationDirection}`;
      const fromPosition = { row, col };
      const toPosition = { row, col };

      return {
        ...prevGame,
        boardState: newBoardState,
        rotationAngles: newRotationAngles,
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
        currentMove: prevGame.gameHistory.length
      };
    });
  };

  useEffect(() => {
    if (game.currentMove >= game.gameHistory.length || game.gameHistory.length === 0) return;
    const currentBoardState = game.gameHistory[game.currentMove].boardState;
    animateLaser(currentBoardState);
  }, [game.gameHistory, game.currentMove]);

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

  const solveGame = async () => {
    setGame((prevGame) => ({ ...prevGame, isSolving: true }));
    try {
      const res = await axios.post('/solve', {
        board: game.boardState.map((r) => r.map((c) => (c ? c : ' ')))
      });

      const solution = res.data;
      if (!solution) {
        console.error('No solution found.');
        return;
      }

      // Loop through each step in the solution, find the piece position in () and the direction after ->
      solution.split('\n').forEach((step: string) => {
        // Extract the piece position (n, m)
        const positionMatch = step.match(/\((\d+),\s*(\d+)\)/);
        if (positionMatch) {
          const backendCol = parseInt(positionMatch[1], 10);
          const backendRow = parseInt(positionMatch[2], 10);

          console.log(`Backend position: (${backendRow}, ${backendCol})`);

          // Convert backend position to frontend position
          const frontendRow = game.rows - backendRow - 1;
          const frontendCol = backendCol;

          // Extract the action after '->'
          const actionMatch = step.match(/->\s*(.*)/);
          if (actionMatch) {
            const action = actionMatch[1].trim();

            // Check if the action is a rotation or a direction
            if (action === 'ROTATE_CCW' || action === 'ROTATE_CW') {
              const rotation = action === 'ROTATE_CCW' ? 'left' : 'right';
              // Handle rotation
              console.log(`Rotate piece at (${frontendRow}, ${frontendCol}) to the ${rotation}`);
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

              console.log(
                `Move piece from (${frontendRow}, ${frontendCol}) to (${newRow}, ${newCol})`
              );
              // You can call your movement function here
              handleMovePiece({ row: frontendRow, col: frontendCol }, { row: newRow, col: newCol });
            }
          }
        } else {
          console.error(`Could not parse position from step: ${step}`);
        }
      });
    } catch (error) {
      // TODO
      console.error(error);
    }

    setGame((prevGame: Game) => ({
      ...prevGame,
      isSolving: false,
      currentMove: 0,
      lastMove: { from: prevGame.gameHistory[0].from, to: prevGame.gameHistory[0].to },
      boardState: prevGame.gameHistory[0].boardState,
      rotationAngles: prevGame.gameHistory[0].rotationAngles
    }));
  };

  return (
    <Stack>
      <Typography variant="h3" align="center" style={{ marginBottom: 25, fontWeight: 500 }}>
        Khet
      </Typography>
      {game.gameOver && (
        <Typography variant="h5" align="center" style={{ marginBottom: 25, color: 'red' }}>
          Game Over
        </Typography>
      )}
      {game.editMode ? (
        <Stack direction="row" alignItems="start">
          <Board
            game={game}
            onMovePiece={handleMovePiece}
            onCellClick={handleCellClick}
            onRemovePiece={handleRemovePiece}
            onRotatePiece={handleRotatePiece}
          />

          <Paper elevation={20} sx={{ width: '300px', borderRadius: 5 }}>
            <Stack direction="column" spacing={1} m={3} alignItems={'start'}>
              <Stack direction="row" justifyContent={'space-evenly'}>
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
                Save Game Board
              </Button>

              <Button
                variant="contained"
                color="primary"
                component="label"
                style={{ marginTop: 15 }}
              >
                Load Game Board
                <input
                  type="file"
                  hidden
                  onChange={(e) => e.target.files && loadGameBoard(e.target.files[0])}
                />
              </Button>

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
      ) : game.isSolving ? (
        <Container>
          <video autoPlay width={'50%'} height={'50%'} loop>
            <source src={BuildingBlocks} type="video/mp4" />
          </video>
        </Container>
      ) : (
        <Stack direction="row" alignItems="start">
          <Board game={game} onMovePiece={handleMovePiece} onRotatePiece={handleRotatePiece} />

          <Paper elevation={20} sx={{ width: '400px', borderRadius: 5 }}>
            <Stack direction="column" spacing={3} m={3} alignItems={'start'}>
              <HistoryTable game={game} setGame={setGame} />

              <Stack direction="row" alignContent={'space-evenly'} spacing={2}>
                <Tooltip title="Reset Game">
                  <span>
                    <Button
                      disabled={game.laserAnimating}
                      variant="contained"
                      onClick={resetGame}
                      color="secondary"
                    >
                      <Add />
                    </Button>
                  </span>
                </Tooltip>

                <Tooltip title="Solve Game">
                  <span>
                    <Button
                      disabled={game.gameOver || game.laserAnimating}
                      variant="contained"
                      onClick={solveGame}
                      color="primary"
                    >
                      <AutoAwesome />
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
                        game.gameHistory.length === 0
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
                        game.gameHistory.length === 0
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
