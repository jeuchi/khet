// Piece.ts
import RedSphinx from './assets/red-sphinx.svg';
import SilverSphix from './assets/silver-sphinx.svg';
import RedPharaoh from './assets/red-pharaoh.svg';
import SilverPharaoh from './assets/silver-pharaoh.svg';
import RedPyramid from './assets/red-pyramid.svg';
import SilverPyramid from './assets/silver-pyramid.svg';
import RedScarab from './assets/red-scarab.svg';
import SilverScarab from './assets/silver-scarab.svg';
import RedAnubis from './assets/red-anubis.svg';
import SilverAnubis from './assets/silver-anubis.svg';

export interface Piece {
  image: string;
  rotate?: boolean;
  moveList?: (
    boardState: (string | null)[][],
    position: { row: number; col: number }
  ) => { row: number; col: number }[];
}

export type PieceType =
  | 'red_sphinx'
  | 'red_pharaoh'
  | 'red_pyramid'
  | 'red_scarab'
  | 'red_anubis'
  | 'silver_sphinx'
  | 'silver_pharaoh'
  | 'silver_pyramid'
  | 'silver_scarab'
  | 'silver_anubis';

const NormalMoveList = (
  boardState: (string | null)[][],
  position: { row: number; col: number }
) => {
  const moves: { row: number; col: number }[] = [];
  const directions = [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
    { row: -1, col: -1 },
    { row: -1, col: 1 },
    { row: 1, col: -1 },
    { row: 1, col: 1 }
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

// The Scarab moves in all directions as well, but it can also swap places with a piece in an adjacent cell.
const ScarabMoveList = (
  boardState: (string | null)[][],
  position: { row: number; col: number }
) => {
  const moves: { row: number; col: number }[] = [];
  const directions = [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
    { row: -1, col: -1 },
    { row: -1, col: 1 },
    { row: 1, col: -1 },
    { row: 1, col: 1 }
  ];
  directions.forEach((dir) => {
    const newRow = position.row + dir.row;
    const newCol = position.col + dir.col;
    const piece = boardState[newRow][newCol]?.split('_')[1];
    if (
      newRow >= 0 &&
      newRow < boardState.length &&
      newCol >= 0 &&
      newCol < boardState[0].length &&
      piece !== 'scarab' &&
      piece !== 'pharaoh' &&
      piece !== 'sphinx'
    ) {
      moves.push({ row: newRow, col: newCol });
    }
  });
  return moves;
};

export const Pieces: { [key in PieceType]: Piece } = {
  red_sphinx: { image: RedSphinx, rotate: true },
  red_pharaoh: { image: RedPharaoh, rotate: true, moveList: NormalMoveList },
  red_pyramid: { image: RedPyramid, rotate: true, moveList: NormalMoveList },
  red_scarab: { image: RedScarab, rotate: true, moveList: ScarabMoveList },
  red_anubis: { image: RedAnubis, rotate: true, moveList: NormalMoveList },
  silver_sphinx: { image: SilverSphix, rotate: true },
  silver_pharaoh: { image: SilverPharaoh, rotate: true, moveList: NormalMoveList },
  silver_pyramid: { image: SilverPyramid, rotate: true, moveList: NormalMoveList },
  silver_scarab: { image: SilverScarab, rotate: true, moveList: ScarabMoveList },
  silver_anubis: { image: SilverAnubis, rotate: true, moveList: NormalMoveList }
};

export default Pieces;
