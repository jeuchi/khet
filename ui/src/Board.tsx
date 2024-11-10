import React, { useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import { Box } from '@mui/material';
import { Pieces, PieceType } from './Piece';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import {
  CELL_COLOR_1,
  CELL_COLOR_2,
  MOVE_HIGHLIGHT_COLOR,
  REMOVE_PIECE_COLOR,
  ADD_PIECE_COLOR,
  LAST_MOVE_FROM_COLOR,
  LAST_MOVE_TO_COLOR,
  DIRECTION_TO_ROTATION
} from './constants';
import SilverAnkh from './assets/silver-ankh.svg';
import RedEye from './assets/red-eye.svg';

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
  maxWidth: '70%',
  maxHeight: '70%',
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
  laserPath?: { row: number; col: number; entry: string; exit: string }[];
  onRotatePiece: (row: number, col: number, direction: string) => void;
  rotationAngles: { [key: string]: number };
  onRotationAnglesChange: (rotationAngles: { [key: string]: number }) => void;
}

const Board: React.FC<BoardProps> = ({
  boardState,
  onMovePiece,
  isEditable = false,
  onCellClick,
  onRemovePiece,
  lastMove,
  laserPath = [],
  onRotatePiece,
  rotationAngles,
  onRotationAnglesChange
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
    cellValue: PieceType
  ) => {
    if (isEditable) return; // Disable dragging in edit mode
    e.dataTransfer.setData('text/plain', JSON.stringify({ row, col }));
    setSelectedPiece({ row, col });
    const piece = Pieces[cellValue];
    if (piece && piece.moveList) {
      const moves = piece.moveList(boardState, { row, col });
      const pieceColor = cellValue.split('_')[0];
      const filteredMoves = moves.filter((move) => {
        if (pieceColor === 'red' && isAnkhSpace(move.row, move.col)) {
          return false;
        }
        if (pieceColor === 'silver' && isEyeSpace(move.row, move.col)) {
          return false;
        }
        return true;
      });
      setPossibleMoves(filteredMoves);
    } else {
      setPossibleMoves([]);
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

  const handleCellClick = (row: number, col: number, cellValue: PieceType | null) => {
    if (isEditable) {
      if (!cellValue && onCellClick) {
        // Empty cell, open piece selection dialog
        onCellClick(row, col);
      }
      return;
    }

    if (laserPath.length > 0) {
      return;
    }

    // Existing game mode logic
    if (cellValue) {
      // There is a piece at this cell
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
      } else {
        const piece = Pieces[cellValue];
        if (piece && piece.moveList) {
          // Select the piece and show possible moves
          setSelectedPiece({ row, col });
          if (piece.moveList) {
            const moves = piece.moveList(boardState, { row, col });
            const pieceColor = cellValue.split('_')[0];
            // Filter out moves that land on edges of the board that the piece can't move to
            // For example, red pieces cant be on the right most column
            const filteredMoves = moves.filter((move) => {
              if (pieceColor === 'red' && isAnkhSpace(move.row, move.col)) {
                return false;
              }
              if (pieceColor === 'silver' && isEyeSpace(move.row, move.col)) {
                return false;
              }
              return true;
            });
            setPossibleMoves(filteredMoves);
          } else {
            setPossibleMoves([]);
          }
        } else {
          setSelectedPiece(null);
          setPossibleMoves([]);
        }
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

  const isAnkhSpace = (row: number, col: number) => {
    if (columns - 1 === col || (row === 0 && col === 1) || (row === rows - 1 && col === 1)) {
      return true;
    }
    return false;
  };

  const isEyeSpace = (row: number, col: number) => {
    if (
      col === 0 ||
      (col === columns - 2 && row === 0) ||
      (col === columns - 2 && row === rows - 1)
    ) {
      return true;
    }
    return false;
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

  const getCoordinate = (direction: string) => {
    // Returns the x, y coordinate (0-100) for the given direction
    switch (direction) {
      case 'up':
        return { x: 50, y: 0 };
      case 'right':
        return { x: 100, y: 50 };
      case 'down':
        return { x: 50, y: 100 };
      case 'left':
        return { x: 0, y: 50 };
      default:
        return { x: 50, y: 50 }; // Center of the cell
    }
  };

  const handleRotatePiece = (row: number, col: number, rotationDirection: string) => {
    onRotatePiece(row, col, rotationDirection);
  };

  useEffect(() => {
    // Clear selected piece and possible moves when board state changes
    setSelectedPiece(null);
    setPossibleMoves([]);
  }, [boardState]);

  return (
    <Box display="flex" justifyContent="center" alignItems="center" width="100%">
      <Box width="100vw" maxWidth="600px">
        <Grid container spacing={0} columns={columns}>
          {boardState.map((row, rowIndex) =>
            row.map((cellValue, colIndex) => {
              // Split the cellValue by comma
              let piece: PieceType | null = null;
              let direction = 'up';

              let canRotate = true;

              if (cellValue !== null) {
                const [pieceStr, _direction] = cellValue.split(',').map((part) => part.trim());
                piece = pieceStr as PieceType;
              }

              let borderRadius = '0';

              const laserSegment = laserPath.find(
                (pos) => pos.row === rowIndex && pos.col === colIndex
              );

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

              // Get rotation angle from state or default
              const cellKey = `${rowIndex}-${colIndex}`;
              let rotation = rotationAngles[cellKey];

              if (rotation === undefined) {
                rotation = DIRECTION_TO_ROTATION[direction] || 0;
                // Initialize the rotation angle in state
                onRotationAnglesChange({
                  ...rotationAngles,
                  [cellKey]: rotation
                });
              }

              return (
                <Grid item xs={1} key={`${rowIndex}-${colIndex}`}>
                  <Cell
                    style={{
                      cursor:
                        !piece && isEditable
                          ? 'pointer'
                          : piece && !isEditable
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
                    onClick={() => handleCellClick(rowIndex, colIndex, piece)}
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

                      {piece && (
                        <>
                          <Sprite
                            src={Pieces[piece].image}
                            alt={`Piece at ${rowIndex},${colIndex}`}
                            draggable={!isEditable && laserPath.length === 0}
                            onDragStart={(e) => handleDragStart(e, rowIndex, colIndex, piece)}
                            onDragEnd={handleDragEnd}
                            sx={{
                              transform: `rotate(${rotation}deg) ${
                                selectedPiece?.row === rowIndex && selectedPiece?.col === colIndex
                                  ? 'scale(1.3)'
                                  : ''
                              }`
                            }}
                          />
                          {isEditable && (
                            <RemoveIcon onClick={(e) => handleRemovePiece(e, rowIndex, colIndex)} />
                          )}

                          {canRotate && (
                            <div
                              style={{
                                position: 'absolute',
                                bottom: 4,
                                display: 'flex',
                                gap: 8
                              }}
                            >
                              <RotateLeftIcon
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRotatePiece(rowIndex, colIndex, 'left');
                                }}
                                style={{ cursor: 'pointer' }}
                              />
                              <RotateRightIcon
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRotatePiece(rowIndex, colIndex, 'right');
                                }}
                                style={{ cursor: 'pointer' }}
                              />
                            </div>
                          )}
                        </>
                      )}
                      {!piece && isEditable && <AddPieceIcon />}
                      {isPossibleMove && <MoveHighlight />}

                      {isAnkhSpace(rowIndex, colIndex) && (
                        <Sprite
                          src={SilverAnkh}
                          alt="Silver Ankh"
                          sx={{ position: 'absolute', left: '10px', top: '10px' }}
                          width={'20%'}
                          height={'20%'}
                        />
                      )}

                      {isEyeSpace(rowIndex, colIndex) && (
                        <Sprite
                          src={RedEye}
                          alt="Red Eye"
                          sx={{ position: 'absolute', left: '10px', top: '10px' }}
                          width={'20%'}
                          height={'20%'}
                        />
                      )}

                      {laserSegment && (
                        <svg
                          width="100%"
                          height="100%"
                          viewBox="0 0 100 100"
                          xmlns="http://www.w3.org/2000/svg"
                          style={{ position: 'absolute', top: 0, left: 0 }}
                        >
                          <defs>
                            <filter id="glow">
                              <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                              <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                              </feMerge>
                            </filter>
                          </defs>
                          <line
                            x1={getCoordinate(laserSegment.entry).x}
                            y1={getCoordinate(laserSegment.entry).y}
                            x2={50}
                            y2={50}
                            stroke="red"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          <line
                            x1={50}
                            y1={50}
                            x2={getCoordinate(laserSegment.exit).x}
                            y2={getCoordinate(laserSegment.exit).y}
                            stroke="red"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      )}
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
