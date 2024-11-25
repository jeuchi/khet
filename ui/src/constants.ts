import { createTheme } from '@mui/material/styles';
import { green, red, yellow, blueGrey, grey } from '@mui/material/colors';

export const theme = createTheme({
  palette: {
    primary: {
      main: blueGrey[500]
    },
    secondary: {
      main: red[500]
    },
    background: {
      default: '#feefe2',
      paper: '#f4ede8'
    }
  }
});

export const LASER_SPEED = 25;

export const CELL_COLOR_MAIN =  grey[700];
export const CELL_COLOR_EYE = red[200];
export const CELL_COLOR_ANKH = blueGrey[100]

export const REMOVE_PIECE_COLOR = red[500];
export const ADD_PIECE_COLOR = green[500];
export const MOVE_HIGHLIGHT_COLOR = green[900];
export const LAST_MOVE_FROM_COLOR = yellow[200];
export const LAST_MOVE_TO_COLOR = yellow[400];

export const DIRECTION_TO_ROTATION: { [key: string]: number } = {
  up: 0,
  right: 90,
  down: 180,
  left: 270
};
