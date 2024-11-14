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

function GameHistory({
  gameHistory,
  currentMove,
  setCurrentMove,
  setLastMove,
  setBoardState,
  setRotationAngles
}) {
  return (
    <Stack direction="column" spacing={1} m={3} alignItems={'start'}>
      <Typography variant="h6">Game History</Typography>
      <TableContainer component={Paper} sx={{ width: '350px', height: 400 }}>
        <Table aria-label="game history table">
          <TableBody>
            {gameHistory.map((history, index) => (
              <TableRow
                key={index}
                hover
                selected={currentMove === index}
                onClick={() => {
                  if (index === currentMove) return;
                  setCurrentMove(index);
                  setLastMove({ from: history.from, to: history.to });
                  setBoardState(history.boardState);
                  setRotationAngles(history.rotationAngles);
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

export default GameHistory;
