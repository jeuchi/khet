import { useEffect, useState } from 'react';
import {
  Stack,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  Switch,
  FormGroup,
  FormControlLabel,
  Button
} from '@mui/material';
import { Game, GameHistory } from './Game';
import Bot from './assets/bot.svg';
import BotDead from './assets/bot-dead.svg';
import BotThinking from './assets/bot-thinking.svg';
import BotSleeping from './assets/bot-sleeping.svg';

interface HistoryTableProps {
  game: Game;
  setGame: React.Dispatch<React.SetStateAction<Game>>;
}

function HistoryTable({ game, setGame }: HistoryTableProps) {
  const [botText, setBotText] = useState('');

  useEffect(() => {
    if (game.ai) {
      if (game.gameOver) {
        if (game.winner === 'red') {
          setBotText('I win! 😎');
        } else {
          setBotText('You win! 🎉');
        }
      } else if (game.callingNextMove) {
        setBotText('Thinking...');
      } else if (game.isSolving) {
        setBotText('Solving...');
      } else {
        setBotText('Your turn!');
      }
    } else {
      setBotText('...');
    }
  }, [game.ai, game.gameOver, game.callingNextMove]);

  return (
    <Stack direction="column" spacing={1} m={3} alignItems={'start'}>
      <Typography variant="h6">Game History</Typography>
      {game.gameOver && (
        <Typography variant="body1" color="error">
          Game Over
        </Typography>
      )}
      <FormGroup>
        <Stack direction="row" alignContent={'center'} justifyContent={'start'}>
          <FormControlLabel
            disabled={game.isSolving || game.gameOver}
            control={
              <Switch
                checked={game.ai}
                onChange={() =>
                  setGame((prevGame: Game) => ({
                    ...prevGame,
                    ai: !prevGame.ai
                  }))
                }
              />
            }
            label="AI"
          />
          <img
            src={
              game.ai
                ? game.gameOver
                  ? game.winner === 'silver'
                    ? BotDead
                    : Bot
                  : game.callingNextMove
                  ? BotThinking
                  : Bot
                : BotSleeping
            }
            alt="bot"
            width="50"
            height="50"
          />
          {botText && (
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="center"
              sx={{ position: 'relative' }}
            >
              <Stack
                direction="row"
                spacing={0.5}
                sx={{ position: 'absolute', top: '-10px', left: '45%' }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    width: '10px',
                    height: '10px',
                    background: 'white',
                    borderRadius: '50%',
                    boxShadow: '0px 0px 5px rgba(0,0,0,0.1)'
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    width: '7px',
                    height: '7px',
                    top: '-5px',
                    position: 'relative',
                    background: 'white',
                    borderRadius: '50%',
                    boxShadow: '0px 0px 5px rgba(0,0,0,0.1)'
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    width: '5px',
                    height: '5px',
                    background: 'white',
                    top: '-10px',
                    position: 'relative',
                    borderRadius: '50%',
                    boxShadow: '0px 0px 5px rgba(0,0,0,0.1)'
                  }}
                />
              </Stack>
              <Typography
                variant="body2"
                sx={{
                  position: 'absolute',
                  top: '-35px',
                  left: '81px',
                  width: '100px',
                  background: 'white',
                  borderRadius: '10px',
                  padding: '5px',
                  boxShadow: '0px 0px 10px rgba(0,0,0,0.1)',
                  transform: 'translateX(-50%)'
                }}
              >
                {botText}
              </Typography>
            </Stack>
          )}
        </Stack>
        {game.gameOver && (
          <Button
            variant="contained"
            color="primary"
            sx={{ m: 1 }}
            onClick={() =>
              setGame((prevGame: Game) => ({
                ...prevGame,
                currentMove: 0,
                lastMove: null,
                boardState: prevGame.gameHistory[0].boardState,
                rotationAngles: prevGame.gameHistory[0].rotationAngles,
                animateHistory: !prevGame.animateHistory
              }))
            }
          >
            {game.animateHistory ? 'Stop Autoplay' : 'Autoplay History'}
          </Button>
        )}
      </FormGroup>
      <TableContainer component={Paper} sx={{ width: '380px', height: 415 }}>
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
