import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import { Box } from '@mui/material';
import Piece from './Piece';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import {
  CELL_COLOR_1,
  CELL_COLOR_2,
  MOVE_HIGHLIGHT_COLOR,
  REMOVE_PIECE_COLOR,
  ADD_PIECE_COLOR,
  LAST_MOVE_FROM_COLOR,
  LAST_MOVE_TO_COLOR
} from './constants';

const Cell = styled('div')({
  position: 'relative',
  width: '100%',
  paddingTop: '100%',
  border: '1px solid #f9e2cf',
  boxSizing: 'border-box',
  backgroundColor: '#e2c8b6'
});

const CellContent = styled('div')({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
});

const Sprite = styled('img')({
  maxWidth: '50%',
  maxHeight: '50%',
  transition: 'transform 0.3s'
});

const RemoveIcon = styled(CloseIcon)({
  position: 'absolute',
  top: 4,
  right: 4,
  cursor: 'pointer',
  color: REMOVE_PIECE_COLOR
});

const AddPieceIcon = styled(AddIcon)({
  fontSize: '2rem',
  color: ADD_PIECE_COLOR
});

const MoveHighlight = styled('div')({
  width: '20%',
  height: '20%',
  borderRadius: '50%',
  backgroundColor: MOVE_HIGHLIGHT_COLOR
});

const CellLabel = styled('div')({
  position: 'absolute',
  color: '#000',
  fontSize: '0.7rem',
  fontWeight: 'bold'
});

interface BoardProps {
  boardState: (string | null)[][];
  onMovePiece: (from: { row: number; col: number }, to: { row: number; col: number }) => void;
  isEditable?: boolean;
  onCellClick?: (row: number, col: number) => void;
  onRemovePiece?: (row: number, col: number) => void;
  lastMove?: { from: { row: number; col: number }; to: { row: number; col: number } } | null;
}

const Board: React.FC<BoardProps> = ({
  boardState,
  onMovePiece,
  isEditable = false,
  onCellClick,
  onRemovePiece,
  lastMove
}) => {
  const [selectedPiece, setSelectedPiece] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<{ row: number; col: number }[]>([]);

  const rows = boardState.length;
  const columns = boardState[0]?.length || 0;

  // Generate column labels (a-h) and row labels (8-1)
  const columnLabels = Array.from({ length: columns }, (_, i) =>
    String.fromCharCode('a'.charCodeAt(0) + i)
  );
  const rowLabels = Array.from({ length: rows }, (_, i) => String(rows - i));

  const handleDragStart = (
    e: React.DragEvent<HTMLImageElement>,
    row: number,
    col: number,
    cellValue: string
  ) => {
    if (isEditable) return; // Disable dragging in edit mode
    e.dataTransfer.setData('text/plain', JSON.stringify({ row, col }));
    setSelectedPiece({ row, col });
    const piece = Piece[cellValue];
    if (piece) {
      const moves = piece.moveList(boardState, { row, col });
      setPossibleMoves(moves);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (isEditable) return;
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, row: number, col: number) => {
    if (isEditable) return;
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');
    const fromPosition = JSON.parse(data);
    const isValidMove = possibleMoves.some((move) => move.row === row && move.col === col);
    if (isValidMove && selectedPiece) {
      movePiece(fromPosition, { row, col });
    }
    setSelectedPiece(null);
    setPossibleMoves([]);
  };

  const handleDragEnd = () => {
    if (isEditable) return;
    setSelectedPiece(null);
    setPossibleMoves([]);
  };

  const handleCellClick = (row: number, col: number, cellValue: string | null) => {
    if (isEditable) {
      if (!cellValue && onCellClick) {
        // Empty cell, open piece selection dialog
        onCellClick(row, col);
      }
      return;
    }

    // Existing game mode logic
    if (cellValue) {
      // There is a piece at this cell
      const piece = Piece[cellValue];
      if (piece) {
        // Select the piece and show possible moves
        setSelectedPiece({ row, col });
        const moves = piece.moveList(boardState, { row, col });
        setPossibleMoves(moves);
      }
    } else {
      // Empty cell
      if (selectedPiece) {
        // Check if the clicked cell is a possible move
        const move = possibleMoves.find((move) => move.row === row && move.col === col);
        if (move) {
          // Move the piece
          movePiece(selectedPiece, move);
          setSelectedPiece(null);
          setPossibleMoves([]);
        } else {
          // Deselect if clicking outside possible moves
          setSelectedPiece(null);
          setPossibleMoves([]);
        }
      }
    }
  };

  const handleRemovePiece = (
    e: React.MouseEvent<SVGSVGElement, MouseEvent>,
    row: number,
    col: number
  ) => {
    e.stopPropagation(); // Prevent triggering cell click
    if (onRemovePiece) {
      onRemovePiece(row, col);
    }
  };

  const movePiece = (from: { row: number; col: number }, to: { row: number; col: number }) => {
    if (!isEditable) {
      onMovePiece(from, to);
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" width="100%">
      <Box width="100vw" maxWidth="600px">
        <Grid container spacing={0} columns={columns}>
          {boardState.map((row, rowIndex) =>
            row.map((cellValue, colIndex) => {
              let borderRadius = '0';

              if (rowIndex === 0 && colIndex === 0) {
                borderRadius = '16px 0 0 0';
              } else if (rowIndex === 0 && colIndex === columns - 1) {
                borderRadius = '0 16px 0 0';
              } else if (rowIndex === rows - 1 && colIndex === 0) {
                borderRadius = '0 0 0 16px';
              } else if (rowIndex === rows - 1 && colIndex === columns - 1) {
                borderRadius = '0 0 16px 0';
              }

              const isPossibleMove = possibleMoves.some(
                (move) => move.row === rowIndex && move.col === colIndex
              );

              return (
                <Grid item xs={1} key={`${rowIndex}-${colIndex}`}>
                  <Cell
                    style={{
                      cursor:
                        !cellValue && isEditable
                          ? 'pointer'
                          : cellValue && !isEditable
                          ? 'grab'
                          : 'default',
                      borderRadius,
                      backgroundColor:
                        lastMove?.from.row === rowIndex && lastMove?.from.col === colIndex
                          ? LAST_MOVE_FROM_COLOR
                          : lastMove?.to.row === rowIndex && lastMove?.to.col === colIndex
                          ? LAST_MOVE_TO_COLOR
                          : rowIndex % 2 === colIndex % 2
                          ? CELL_COLOR_1
                          : CELL_COLOR_2
                    }}
                    onClick={() => handleCellClick(rowIndex, colIndex, cellValue)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, rowIndex, colIndex)}
                  >
                    <CellContent>
                      {/* Render Row Labels on the leftmost cells */}
                      {colIndex === 0 && (
                        <CellLabel style={{ top: 4, left: 4 }}>{rowLabels[rowIndex]}</CellLabel>
                      )}
                      {/* Render Column Labels on the bottommost cells */}
                      {rowIndex === rows - 1 && (
                        <CellLabel style={{ bottom: 4, right: 4 }}>
                          {columnLabels[colIndex]}
                        </CellLabel>
                      )}

                      {cellValue && (
                        <>
                          <Sprite
                            src={Piece[cellValue]?.image || ''}
                            alt={`Piece at ${rowIndex},${colIndex}`}
                            draggable={!isEditable}
                            onDragStart={(e) => handleDragStart(e, rowIndex, colIndex, cellValue)}
                            onDragEnd={handleDragEnd}
                          />
                          {isEditable && (
                            <RemoveIcon onClick={(e) => handleRemovePiece(e, rowIndex, colIndex)} />
                          )}
                        </>
                      )}
                      {!cellValue && isEditable && <AddPieceIcon />}
                      {!cellValue && isPossibleMove && <MoveHighlight />}
                    </CellContent>
                  </Cell>
                </Grid>
              );
            })
          )}
        </Grid>
      </Box>
    </Box>
  );
};

export default Board;
