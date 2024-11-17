import {
  Stack,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper
} from '@mui/material';
import { Game, GameHistory } from './Game';

interface HistoryTableProps {
  game: Game;
  setGame: React.Dispatch<React.SetStateAction<Game>>;
}

function HistoryTable({ game, setGame }: HistoryTableProps) {
  return (
    <Stack direction="column" spacing={1} m={3} alignItems={'start'}>
      <Typography variant="h6">Game History</Typography>
      <TableContainer component={Paper} sx={{ width: '350px', height: 400 }}>
        <Table aria-label="game history table">
          <TableBody>
            {game.gameHistory.map((history: GameHistory, index) => (
              <TableRow
                key={index}
                hover
                selected={game.currentMove === index}
                onClick={() => {
                  if (index === game.currentMove || game.laserAnimating) return;
                  setGame((prevGame: Game) => ({
                    ...prevGame,
                    currentMove: index,
                    lastMove: { from: history.from, to: history.to },
                    boardState: history.boardState,
                    rotationAngles: history.rotationAngles
                  }));
                }}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>{index + 1}.</TableCell>
                <TableCell>{history.move}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}

export default HistoryTable;
