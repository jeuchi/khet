// Piece.ts
import RedSphinx from './assets/red-sphinx.svg';
import SilverSphix from './assets/silver-sphinx.svg';
import RedPharaoh from './assets/red-pharaoh.svg';
import SilverPharaoh from './assets/silver-pharaoh.svg';
import RedPyramid from './assets/red-pyramid.svg';
import SilverPyramid from './assets/silver-pyramid.svg';

export interface Piece {
  image: string;
  rotate?: boolean;
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
  rsp: {
    image: RedSphinx,
    moveList: KingMoveList,
    rotate: true
  },
  rph: {
    image: RedPharaoh,
    moveList: KingMoveList,
    rotate: true
  },
  rpy: {
    image: RedPyramid,
    rotate: true
  },
  ssp: {
    image: SilverSphix,
    moveList: KingMoveList,
    rotate: true
  },
  sph: {
    image: SilverPharaoh,
    moveList: KingMoveList,
    rotate: true
  },
  spy: {
    image: SilverPyramid,
    rotate: true
  },
};

export default Piece;
