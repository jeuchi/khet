import { createTheme } from '@mui/material/styles';
import { blue, green, red, yellow } from '@mui/material/colors';

export const theme = createTheme({
  palette: {
    primary: {
      main: blue[500]
    },
    background: {
      default: '#feefe2',
      paper: '#f4ede8'
    }
  }
});

export const LASER_SPEED = 100;

export const CELL_COLOR_1 = '#f0d9b5';
export const CELL_COLOR_2 = '#b58863';

export const REMOVE_PIECE_COLOR = red[500];
export const ADD_PIECE_COLOR = green[900];
export const MOVE_HIGHLIGHT_COLOR = green[900];
export const LAST_MOVE_FROM_COLOR = yellow[200];
export const LAST_MOVE_TO_COLOR = yellow[400];
