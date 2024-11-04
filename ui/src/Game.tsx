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

interface GameHistory {
  boardState: (string | null)[][];
  from: { row: number; col: number };
  to: { row: number; col: number };
  move: string;
}

const Game: React.FC = () => {
  const [editMode, setEditMode] = useState(true);
  const [linkOn, setLinkOn] = useState(true);
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [currentMove, setCurrentMove] = useState<number>(0);
  const [lastMove, setLastMove] = useState<{
    from: { row: number; col: number };
    to: { row: number; col: number };
  } | null>(null);
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [boardState, setBoardState] = useState<(string | null)[][]>(
    Array(3)
      .fill(null)
      .map(() => Array(3).fill(null))
  );
  const [initialBoardState, setInitialBoardState] = useState<(string | null)[][]>(
    Array(3)
      .fill(null)
      .map(() => Array(3).fill(null))
  );
  const [pieceSelectionOpen, setPieceSelectionOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);

  const handleBoardSizeChange = (newRows: number, newCols: number) => {
    if (newRows < 2 || newCols < 2) return;
    if (newRows > 10 || newCols > 10) return;

    setRows(newRows);
    setCols(newCols);
    setBoardState(
      Array(newRows)
        .fill(null)
        .map(() => Array(newCols).fill(null))
    );
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

  const handlePieceSelect = (piece: string) => {
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

  const startGame = () => {
    setInitialBoardState(boardState);
    setEditMode(false);
  };

  const resetGame = () => {
    setBoardState(initialBoardState);
    setGameHistory([]);
    setLastMove(null);
    setEditMode(true);
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
  };

  const availablePieces = Object.keys(Piece);

  return (
    <Stack>
      <Typography variant="h3" align="center" style={{ marginBottom: 25, fontWeight: 500 }}>
        Laser Chess
      </Typography>
      {editMode ? (
        <Stack direction="row" alignItems="start">
          <Board
            boardState={boardState}
            onMovePiece={handleMovePiece}
            onCellClick={handleCellClick}
            onRemovePiece={handleRemovePiece}
            isEditable={true}
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
                  <IconButton
                    size="small"
                    sx={{ m: 1 }}
                    onClick={() => setLinkOn(!linkOn)}
                    color={linkOn ? 'primary' : 'default'}
                  >
                    {linkOn ? <LinkIcon /> : <LinkOff />}
                  </IconButton>
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
                {availablePieces.map((pieceKey) => (
                  <Grid item xs={3} key={pieceKey}>
                    <img
                      src={Piece[pieceKey].image}
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
          <Board boardState={boardState} onMovePiece={handleMovePiece} lastMove={lastMove} />

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
                  <Button variant="contained" onClick={resetGame}>
                    <Add />
                  </Button>
                </Tooltip>

                <Tooltip title="Move Back">
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
                </Tooltip>

                <Tooltip title="Move Forward">
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
