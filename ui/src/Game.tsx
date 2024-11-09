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
  Tooltip
} from '@mui/material';
import Board from './Board';
import { Pieces, PieceType } from './Piece';
import LinkIcon from '@mui/icons-material/Link';
import LinkOff from '@mui/icons-material/LinkOff';
import ArrowLeft from '@mui/icons-material/ArrowLeft';
import ArrowRight from '@mui/icons-material/ArrowRight';
import Add from '@mui/icons-material/Add';
import HistoryTable from './HistoryTable';
import axios from './axios';
import { DIRECTION_TO_ROTATION, LASER_SPEED } from './constants';

interface GameHistory {
  boardState: (string | null)[][];
  from: { row: number; col: number };
  to: { row: number; col: number };
  move: string;
  rotationAngles?: { [key: string]: number };
}

const INITIAL_BOARD = [
  ['red_sphinx,down', 'red_anubis', 'red_pharaoh', ''],
  ['', '', 'silver_pyramid', ''],
  ['', '', '', ''],
  ['', 'silver_pharaoh', 'silver_anubis', 'silver_sphinx']
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
  const [rows, setRows] = useState(4);
  const [cols, setCols] = useState(4);
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
  const [rotationAngles, setRotationAngles] = useState<{ [key: string]: number }>({});

  const handleBoardSizeChange = (newRows: number, newCols: number) => {
    if (newRows < 4 || newCols < 4) return;
    if (newRows > 10 || newCols > 10) return;

    setRows(newRows);
    setCols(newCols);
    // Fill the new board with empty strings except the rl in top left and bl in bottom right
    const newBoardState = Array.from({ length: newRows }, () =>
      Array.from({ length: newCols }, () => '')
    );

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
      console.error(error);
    }

    setInitialBoardState(boardState);
    setEditMode(false);
  };

  const resetGame = () => {
    setGameOver(false);
    setRotationAngles({});
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
      setRotationAngles(gameHistory[gameHistory.length - 1].rotationAngles || {});
      return;
    }

    const [piece, direction] = boardState[fromPosition.row][fromPosition.col]?.split(',') || [];
    if (!piece) return;

    const columnLabels = Array.from({ length: cols }, (_, i) =>
      String.fromCharCode('a'.charCodeAt(0) + i)
    );
    const rowLabels = Array.from({ length: rows }, (_, i) => String(rows - i));

    // Update the board rotation angles
    const newRotationAngles = { ...rotationAngles };
    const fromCellKey = `${fromPosition.row}-${fromPosition.col}`;
    const toCellKey = `${toPosition.row}-${toPosition.col}`;
    newRotationAngles[toCellKey] = newRotationAngles[fromCellKey] || 0;
    delete newRotationAngles[fromCellKey];
    setRotationAngles(newRotationAngles);

    const newBoardState = boardState.map((r) => r.slice());
    newBoardState[toPosition.row][toPosition.col] = `${piece},${direction}`;
    newBoardState[fromPosition.row][fromPosition.col] = null;

    setBoardState(newBoardState);
    const log = `${piece} ${columnLabels[fromPosition.col]}${rowLabels[fromPosition.row]} to ${
      columnLabels[toPosition.col]
    }${rowLabels[toPosition.row]}`;
    setGameHistory([
      ...gameHistory,
      {
        boardState: newBoardState,
        move: log,
        from: fromPosition,
        to: toPosition,
        rotationAngles: newRotationAngles
      }
    ]);
    setLastMove({ from: fromPosition, to: toPosition });
    setCurrentMove(gameHistory.length);
  };

  const animateLaser = (currentBoardState: (string | null)[][]) => {
    if (editMode) return;

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
      console.error('No silver sphix "ssp" found on the board.');
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
        setLaserPath([...path]);
        return;
      }

      const { dx, dy } = directions[currentDirection];
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
          if (cell === 'red_pharaoh' || cell === 'silver_pharaoh') {
            setGameOver(true);
            path.push({
              row: y,
              col: x,
              entry: cellEntry,
              exit: ''
            });
            setLaserPath([...path]);
          } else if (cell === 'red_anubis' || cell === 'silver_anubis') {
            // Check if the anubis is facing the laser. Note that 'up' is the default direction
            // and Anubis piece is looking towards the right. If he's looking towards the laser,
            // the laser will be absorbed otherwise he will die.
            const anubisDirection = cell.split(',')[1] || 'up';
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
              setLaserPath([...path]);
              setTimeout(() => setLaserPath([]), LASER_SPEED * 5);
            } else {
              // Anubis is dead, remove it from the board
              const newBoardState = currentBoardState.map((r) => r.slice());
              newBoardState[y][x] = null;
              setBoardState(newBoardState);
              setLaserPath([]);
            }
          } else {
            // Piece is dead, remove it from the board
            const newBoardState = currentBoardState.map((r) => r.slice());
            newBoardState[y][x] = null;
            setBoardState(newBoardState);
            setLaserPath([]);
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
    const [pieceType, direction] = piece.split(',');
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
    const cellValue = boardState[row][col];
    if (!cellValue) return; // No piece to rotate
    const [pieceName, oldDirection] = cellValue.split(',').map((part) => part.trim());

    let newDirection = '';

    // Calculate the new rotation angle
    const cellKey = `${row}-${col}`;
    const previousRotation = rotationAngles[cellKey] || DIRECTION_TO_ROTATION[oldDirection] | 0;
    const rotationDelta = rotationDirection === 'left' ? -90 : 90;
    const newRotation = previousRotation + rotationDelta;

    // Update the rotation angle in state
    const newRotationAngles = { ...rotationAngles, [cellKey]: newRotation };

    setRotationAngles(newRotationAngles);

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

    const newCellValue = `${pieceName},${newDirection}`;

    // Same as moving piece, we will just rotate the piece in place
    const newBoardState = boardState.map((r) => r.slice());
    newBoardState[row][col] = newCellValue;
    setBoardState(newBoardState);

    if (editMode) return;

    const [pieceType] = newCellValue.split(',');

    const log = `${pieceType} rotated`;
    const fromPosition = { row, col };
    const toPosition = { row, col };

    setGameHistory([
      ...gameHistory,
      {
        boardState: newBoardState,
        move: log,
        from: fromPosition,
        to: toPosition,
        rotationAngles: newRotationAngles
      }
    ]);
    setLastMove({ from: fromPosition, to: toPosition });
    setCurrentMove(gameHistory.length);
  };

  useEffect(() => {
    if (currentMove >= gameHistory.length || gameHistory.length === 0) return;
    const currentBoardState = gameHistory[currentMove].boardState;
    animateLaser(currentBoardState);
  }, [gameHistory, currentMove]);

  const availablePieces: PieceType[] = Object.keys(Pieces) as PieceType[];

  return (
    <Stack>
      <Typography variant="h3" align="center" style={{ marginBottom: 25, fontWeight: 500 }}>
        Khet
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
            laserPath={laserPath}
            onRotatePiece={handleRotatePiece}
            rotationAngles={rotationAngles}
            onRotationAnglesChange={setRotationAngles}
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
                {availablePieces.map((pieceKey: PieceType) => (
                  <Grid item xs={3} key={pieceKey}>
                    <img
                      src={Pieces[pieceKey].image}
                      width={100}
                      height={100}
                      alt={pieceKey}
                      onClick={() => handlePieceSelect(pieceKey)}
                      style={{ cursor: 'pointer', maxWidth: '100%' }}
                    />
                  </Grid>
                ))}
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
            laserPath={laserPath}
            onRotatePiece={handleRotatePiece}
            rotationAngles={rotationAngles}
            onRotationAnglesChange={setRotationAngles}
          />

          <Paper elevation={20} sx={{ width: '400px', borderRadius: 5 }}>
            <Stack direction="column" spacing={3} m={3} alignItems={'start'}>
              <HistoryTable
                gameHistory={gameHistory}
                setBoardState={setBoardState}
                setLastMove={setLastMove}
                currentMove={currentMove}
                setCurrentMove={setCurrentMove}
                setRotationAngles={setRotationAngles}
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
                        setRotationAngles(gameHistory[newMove].rotationAngles || {});
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
                        setRotationAngles(gameHistory[newMove].rotationAngles || {});
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
