import React, { useState } from 'react';
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
  Tooltip
} from '@mui/material';
import Board from './Board';
import Piece from './Piece';
import LinkIcon from '@mui/icons-material/Link';
import LinkOff from '@mui/icons-material/LinkOff';
import ArrowLeft from '@mui/icons-material/ArrowLeft';
import ArrowRight from '@mui/icons-material/ArrowRight';
import Add from '@mui/icons-material/Add';
import HistoryTable from './HistoryTable';
import axios from './axios';
import { LASER_SPEED } from './constants';

interface GameHistory {
  boardState: (string | null)[][];
  from: { row: number; col: number };
  to: { row: number; col: number };
  move: string;
}

const INITIAL_BOARD = [
  ['rl,180', '', ''],
  ['', '', ''],
  ['', '', 'bl']
];

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

const Game: React.FC = () => {
  const [editMode, setEditMode] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [linkOn, setLinkOn] = useState(true);
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [currentMove, setCurrentMove] = useState<number>(0);
  const [lastMove, setLastMove] = useState<{
    from: { row: number; col: number };
    to: { row: number; col: number };
  } | null>(null);
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [boardState, setBoardState] = useState<(string | null)[][]>(INITIAL_BOARD);
  const [initialBoardState, setInitialBoardState] = useState<(string | null)[][]>(INITIAL_BOARD);
  const [pieceSelectionOpen, setPieceSelectionOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [laserPath, setLaserPath] = useState<
    {
      row: number;
      col: number;
      entry: string;
      exit: string;
    }[]
  >([]);

  const handleBoardSizeChange = (newRows: number, newCols: number) => {
    if (newRows < 2 || newCols < 2) return;
    if (newRows > 10 || newCols > 10) return;

    setRows(newRows);
    setCols(newCols);
    // Fill the new board with empty strings except the rl in top left and bl in bottom right
    const newBoardState = Array.from({ length: newRows }, (_, i) =>
      Array.from({ length: newCols }, (_, _j) => '')
    );
    newBoardState[0][0] = 'rl,180';
    newBoardState[newRows - 1][newCols - 1] = 'bl';
    setBoardState(newBoardState);
  };

  const handleCellClick = (row: number, col: number) => {
    setSelectedCell({ row, col });
    setPieceSelectionOpen(true);
  };

  const handleRemovePiece = (row: number, col: number) => {
    setBoardState((prevBoardState) => {
      const newBoardState = prevBoardState.map((r) => r.slice());
      newBoardState[row][col] = null;
      return newBoardState;
    });
  };

  const handlePieceSelect = async (piece: string) => {
    if (selectedCell) {
      const { row, col } = selectedCell;
      setBoardState((prevBoardState) => {
        const newBoardState = prevBoardState.map((r) => r.slice());
        newBoardState[row][col] = piece;
        return newBoardState;
      });
      setSelectedCell(null);
      setPieceSelectionOpen(false);
    }
  };

  const startGame = async () => {
    try {
      const res = await axios.post('/solve', {
        board: boardState.map((r) => r.map((c) => (c ? c : ' ')))
      });

      console.log(res);
    } catch (error) {
      // TODO
    }

    setInitialBoardState(boardState);
    setEditMode(false);
  };

  const resetGame = () => {
    setGameOver(false);
    setBoardState(initialBoardState);
    setGameHistory([]);
    setLastMove(null);
    setEditMode(true);
    setLaserPath([]);
  };

  const handleMovePiece = (
    fromPosition: { row: number; col: number },
    toPosition: { row: number; col: number }
  ) => {
    if (currentMove < gameHistory.length - 1) {
      setCurrentMove(gameHistory.length - 1);
      setLastMove({
        from: gameHistory[gameHistory.length - 1].from,
        to: gameHistory[gameHistory.length - 1].to
      });
      setBoardState(gameHistory[gameHistory.length - 1].boardState);
      return;
    }

    const piece = boardState[fromPosition.row][fromPosition.col];
    if (!piece) return;

    const columnLabels = Array.from({ length: cols }, (_, i) =>
      String.fromCharCode('a'.charCodeAt(0) + i)
    );
    const rowLabels = Array.from({ length: rows }, (_, i) => String(rows - i));

    const newBoardState = boardState.map((r) => r.slice());
    newBoardState[toPosition.row][toPosition.col] = piece;
    newBoardState[fromPosition.row][fromPosition.col] = null;

    setBoardState(newBoardState);
    const log = `${piece} ${columnLabels[fromPosition.col]}${rowLabels[fromPosition.row]} to ${
      columnLabels[toPosition.col]
    }${rowLabels[toPosition.row]}`;
    setGameHistory([
      ...gameHistory,
      { boardState: newBoardState, move: log, from: fromPosition, to: toPosition }
    ]);
    setLastMove({ from: fromPosition, to: toPosition });
    setCurrentMove(gameHistory.length);

    // Animate laser from 'bl' only
    animateLaser(newBoardState);
  };

  const animateLaser = (currentBoardState: (string | null)[][]) => {
    // Find the 'bl' piece on the board
    let blPosition = null;
    let blRotation = 0;

    for (let i = 0; i < currentBoardState.length; i++) {
      for (let j = 0; j < currentBoardState[i].length; j++) {
        const cell = currentBoardState[i][j];
        if (cell && cell.startsWith('bl')) {
          blPosition = { row: i, col: j };
          // Extract rotation if any
          const parts = cell.split(',');
          if (parts.length > 1) {
            blRotation = parseInt(parts[1], 10);
          } else {
            blRotation = 0;
          }
          break;
        }
      }
      if (blPosition) {
        break;
      }
    }

    if (!blPosition) {
      console.error('No blue laser "bl" found on the board.');
      return;
    }

    // Map rotation to direction
    let direction = '';
    switch (blRotation % 360) {
      case 0:
        direction = 'up';
        break;
      case 90:
        direction = 'right';
        break;
      case 180:
        direction = 'down';
        break;
      case 270:
        direction = 'left';
        break;
      default:
        console.error(`Invalid rotation ${blRotation}`);
        return;
    }

    // Simulate laser path
    let path: {
      row: number;
      col: number;
      entry: string; // Entry direction into the cell
      exit: string; // Exit direction from the cell
    }[] = [];

    let x = blPosition.col;
    let y = blPosition.row;
    let currentDirection = direction;
    let steps = 0;
    const maxSteps = 100; // To prevent infinite loops

    // Add the initial segment from the laser source
    path.push({
      row: blPosition.row,
      col: blPosition.col,
      entry: '', // The laser starts moving in the initial direction
      exit: direction
    });

    const step = () => {
      if (steps++ > maxSteps) {
        console.error('Laser simulation exceeded maximum steps.');
        setLaserPath([...path]);
        return;
      }

      const { dx, dy } = directions[currentDirection];
      const prevX = x;
      const prevY = y;
      x += dx;
      y += dy;

      // Check bounds
      if (x < 0 || x >= currentBoardState[0].length || y < 0 || y >= currentBoardState.length) {
        // Laser is out of bounds, end animation
        setTimeout(() => setLaserPath([]), LASER_SPEED * 5);
        return;
      }

      const cellEntry = oppositeDirections[currentDirection];

      // Check if laser hits a piece
      const cell = currentBoardState[y][x];
      if (cell && cell !== '') {
        // Determine new direction based on piece type
        const newDirection = handleReflection(cell, currentDirection);

        if (newDirection) {
          // Reflect laser
          path.push({
            row: y,
            col: x,
            entry: cellEntry,
            exit: newDirection
          });
          currentDirection = newDirection;
          setLaserPath([...path]);
          setTimeout(step, LASER_SPEED);
        } else {
          // Laser is blocked or absorbed, end animation
          console.log('Laser hit a piece at', { row: y, col: x }, 'Piece:', cell);
          if (cell === 'rk' || cell === 'bk') {
            setGameOver(true);
            path.push({
              row: y,
              col: x,
              entry: cellEntry,
              exit: ''
            });
            setLaserPath([...path]);
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
      setLaserPath([...path]);
      setTimeout(step, LASER_SPEED);
    };

    // Start the laser movement
    setLaserPath([...path]);
    setTimeout(step, LASER_SPEED);
  };

  const handleReflection = (piece: string, incomingDirection: string): string | null => {
    const [pieceType, rotationStr] = piece.split(',');
    const rotation = parseInt(rotationStr) || 0;

    switch (pieceType) {
      case 'mirror':
        // Define mirror reflection logic based on rotation
        // For example, '/' and '\' mirrors
        return getMirrorReflection(rotation, incomingDirection);
      default:
        // Dead piece, laser is absorbed
        return null;
    }

    return null;
  };

  const getMirrorReflection = (rotation: number, incomingDirection: string): string | null => {
    const mirrorReflections: { [key: number]: { [key: string]: string } } = {
      0: { up: 'right', right: 'up', down: 'left', left: 'down' }, // '/' mirror at 0 degrees
      90: { up: 'left', right: 'down', down: 'right', left: 'up' }, // '\' mirror at 90 degrees
      180: { up: 'left', right: 'down', down: 'right', left: 'up' }, // '/' mirror at 180 degrees
      270: { up: 'right', right: 'up', down: 'left', left: 'down' } // '\' mirror at 270 degrees
    };

    const reflectionMap = mirrorReflections[rotation % 360];
    return reflectionMap ? reflectionMap[incomingDirection] || null : null;
  };

  const availablePieces = Object.keys(Piece);

  return (
    <Stack>
      <Typography variant="h3" align="center" style={{ marginBottom: 25, fontWeight: 500 }}>
        Laser Chess
      </Typography>
      {gameOver && (
        <Typography variant="h5" align="center" style={{ marginBottom: 25, color: 'red' }}>
          Game Over
        </Typography>
      )}
      {editMode ? (
        <Stack direction="row" alignItems="start">
          <Board
            boardState={boardState}
            onMovePiece={handleMovePiece}
            onCellClick={handleCellClick}
            onRemovePiece={handleRemovePiece}
            isEditable={true}
            laserPath={laserPath} // Pass laserPath to Board
          />

          <Paper elevation={20} sx={{ width: '300px', borderRadius: 5 }}>
            <Stack direction="column" spacing={1} m={3} alignItems={'start'}>
              <Stack direction="row" justifyContent={'space-evenly'}>
                <TextField
                  label="Rows"
                  type="number"
                  variant="standard"
                  value={rows}
                  onChange={(e) =>
                    handleBoardSizeChange(
                      parseInt(e.target.value) || 0,
                      linkOn ? parseInt(e.target.value) : cols
                    )
                  }
                />

                <Tooltip title={linkOn ? 'Rows/Columns linked' : 'Rows/Columns not linked'}>
                  <span>
                    <IconButton
                      size="small"
                      sx={{ m: 1 }}
                      onClick={() => setLinkOn(!linkOn)}
                      color={linkOn ? 'primary' : 'default'}
                    >
                      {linkOn ? <LinkIcon /> : <LinkOff />}
                    </IconButton>
                  </span>
                </Tooltip>

                <TextField
                  label="Columns"
                  type="number"
                  variant="standard"
                  value={cols}
                  onChange={(e) =>
                    handleBoardSizeChange(
                      linkOn ? parseInt(e.target.value) : rows,
                      parseInt(e.target.value) || 0
                    )
                  }
                />
              </Stack>

              <Button
                variant="contained"
                color="primary"
                onClick={startGame}
                style={{ marginTop: 15 }}
              >
                Start Game
              </Button>
            </Stack>
          </Paper>

          <Dialog open={pieceSelectionOpen} onClose={() => setPieceSelectionOpen(false)}>
            <DialogTitle>Select a Piece</DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                {availablePieces.map((pieceKey) =>
                  Piece[pieceKey].readonly ? null : (
                    <Grid item xs={3} key={pieceKey}>
                      <img
                        src={Piece[pieceKey].image}
                        alt={pieceKey}
                        onClick={() => handlePieceSelect(pieceKey)}
                        style={{ cursor: 'pointer', maxWidth: '100%' }}
                      />
                    </Grid>
                  )
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setPieceSelectionOpen(false)}>Cancel</Button>
            </DialogActions>
          </Dialog>
        </Stack>
      ) : (
        <Stack direction="row" alignItems="start">
          <Board
            boardState={boardState}
            onMovePiece={handleMovePiece}
            lastMove={lastMove}
            laserPath={laserPath} // Pass laserPath to Board
          />

          <Paper elevation={20} sx={{ width: '400px', borderRadius: 5 }}>
            <Stack direction="column" spacing={3} m={3} alignItems={'start'}>
              <HistoryTable
                gameHistory={gameHistory}
                setBoardState={setBoardState}
                setLastMove={setLastMove}
                currentMove={currentMove}
                setCurrentMove={setCurrentMove}
              />

              <Stack direction="row" alignContent={'space-evenly'} spacing={2}>
                <Tooltip title="Reset Game">
                  <span>
                    <Button variant="contained" onClick={resetGame}>
                      <Add />
                    </Button>
                  </span>
                </Tooltip>

                <Tooltip title="Move Back">
                  <span>
                    <Button
                      variant="contained"
                      disabled={currentMove === 0 || gameHistory.length === 0}
                      onClick={() => {
                        if (currentMove === 0) return;
                        const newMove = currentMove > 0 ? currentMove - 1 : currentMove;
                        setCurrentMove(newMove);
                        setBoardState(gameHistory[newMove].boardState);
                        setLastMove({
                          from: gameHistory[newMove].from,
                          to: gameHistory[newMove].to
                        });
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
                      disabled={currentMove === gameHistory.length - 1 || gameHistory.length === 0}
                      onClick={() => {
                        if (gameHistory.length === 0) return;
                        const newMove =
                          currentMove < gameHistory.length - 1 ? currentMove + 1 : currentMove;
                        setCurrentMove(newMove);
                        setBoardState(gameHistory[newMove].boardState);
                        setLastMove({
                          from: gameHistory[newMove].from,
                          to: gameHistory[newMove].to
                        });
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
