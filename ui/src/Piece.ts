// Piece.ts
import RedKingImage from './assets/red-king.svg';
import BlueKingImage from './assets/blue-king.svg';
import RedLaser from './assets/red-laser.svg';
import BlueLaser from './assets/blue-laser.svg';

export interface Piece {
  image: string;
  readonly?: boolean;
  moveList?: (
    boardState: (string | null)[][],
    position: { row: number; col: number }
  ) => { row: number; col: number }[];
}

const KingMoveList = (boardState: (string | null)[][], position: { row: number; col: number }) => {
  const moves: { row: number; col: number }[] = [];
  const directions = [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 }
  ];
  directions.forEach((dir) => {
    const newRow = position.row + dir.row;
    const newCol = position.col + dir.col;
    if (
      newRow >= 0 &&
      newRow < boardState.length &&
      newCol >= 0 &&
      newCol < boardState[0].length &&
      !boardState[newRow][newCol]
    ) {
      moves.push({ row: newRow, col: newCol });
    }
  });
  return moves;
};

const Piece: { [key: string]: Piece } = {
  rk: {
    image: RedKingImage,
    moveList: KingMoveList
  },
  bk: {
    image: BlueKingImage,
    moveList: KingMoveList
  },
  rl: {
    image: RedLaser,
    readonly: true
  },
  bl: {
    image: BlueLaser,
    readonly: true
  }
};

export default Piece;
