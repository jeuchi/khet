import { useEffect, useState, useRef } from 'react';
import {
  Stack,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Switch,
  FormGroup,
  FormControlLabel,
  Button,
  Tooltip
} from '@mui/material';
import { Game, GameHistory } from './Game';
import Bot from './assets/bot.svg';
import BotDead from './assets/bot-dead.svg';
import BotThinking from './assets/bot-thinking.svg';
import BotSleeping from './assets/bot-sleeping.svg';
import BuildingBlocks from './assets/building-blocks.gif';
import { AutoAwesome, PlayArrow, Stop } from '@mui/icons-material';

interface HistoryTableProps {
  game: Game;
  setGame: React.Dispatch<React.SetStateAction<Game>>;
}

function HistoryTable({ game, setGame }: HistoryTableProps) {
  const [botText, setBotText] = useState('');
  const tableRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    if (game.ai) {
      if (game.missedCheckmate) {
        setBotText('Too many moves! Click to see solution.');
        return;
      }

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
      if (game.gameOver) {
        setBotText('Game Over');
      } else {
        setBotText('Ready to play!');
      }
    }
  }, [game.ai, game.gameOver, game.callingNextMove, game.missedCheckmate]);

  useEffect(() => {
    // When new data is added, scroll to the bottom of the table
    if (tableRef.current) {
      tableRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [game.gameHistory]);

  return (
    <Stack direction="column" spacing={1} m={3} alignItems={'start'} sx={{ height: '90%' }}>
      <FormGroup>
        <Stack direction="row" alignContent={'center'} justifyContent={'start'} mt={4}>
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
                  : game.callingNextMove || game.callingApi
                  ? BotThinking
                  : Bot
                : game.callingApi
                ? BotThinking
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
              {game.callingApi ? (
                <>
                  <Typography
                    variant="body2"
                    sx={{
                      position: 'absolute',
                      top: '-50px',
                      left: '90px',
                      width: '99px',
                      background: 'white',
                      borderRadius: '10px',
                      padding: '5px',
                      boxShadow: '0px 0px 10px rgba(0,0,0,0.1)',
                      transform: 'translateX(-50%)'
                    }}
                  >
                    <Stack direction="column" alignItems="center">
                      <img src={BuildingBlocks} alt="Building Blocks" style={{ width: '100%' }} />
                      <span style={{ fontWeight: 500 }}>Solving...</span>
                    </Stack>
                  </Typography>
                </>
              ) : (
                <Typography
                  variant="body2"
                  fontWeight={500}
                  sx={{
                    position: 'absolute',
                    top: '-34px',
                    left: '100px',
                    width: '120px',
                    background: 'white',
                    borderRadius: '10px',
                    padding: '5px',
                    boxShadow: '0px 0px 10px rgba(0,0,0,0.1)',
                    transform: 'translateX(-50%)'
                  }}
                >
                  {botText}
                </Typography>
              )}
            </Stack>
          )}
        </Stack>
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={2} my={1}>
          <Tooltip title="Show Solution">
            <span>
              <Button
                disabled={!game.solvingSteps || game.callingApi}
                variant="contained"
                onClick={() =>
                  setGame((prevGame) => ({
                    ...prevGame,
                    gameHistory: [],
                    rotationAngles: {},
                    lastMove: null,
                    isSolving: true,
                    boardState: prevGame.solvingBoardState,
                    missedCheckmate: false,
                    gameOver: false
                  }))
                }
                color={!game.solvingSteps || game.callingApi ? 'primary' : 'primary'}
                sx={{
                  background:
                    !game.solvingSteps || game.callingApi
                      ? 'primary'
                      : 'linear-gradient(106.7deg, rgb(151, 150, 240) 12.1%, rgb(255, 206, 236) 63.2%);',
                  backgroundSize: '600%',
                  animation: game.missedCheckmate ? 'slidingWindow 3s linear infinite' : 'none',
                  '@keyframes slidingWindow': {
                    '0%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '50% 50%' },
                    '100%': { backgroundPosition: '0% 50%' }
                  },
                  color: 'black',
                  fontWeight: 'bold'
                }}
              >
                <AutoAwesome />
              </Button>
            </span>
          </Tooltip>
          <Tooltip title={game.animateHistory ? 'Stop Autoplay' : 'Autoplay History'}>
            <span>
              <Button
                variant="contained"
                color="primary"
                disabled={game.isSolving || game.gameHistory.length === 0}
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
                {game.animateHistory ? <Stop /> : <PlayArrow />}
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </FormGroup>
      <TableContainer sx={{ width: '300px', height: 'max(150px, calc(90vh - 430px))' }}>
        <Table>
          <TableBody>
            {game.gameHistory.map((history: GameHistory, index) => (
              <TableRow
                ref={tableRef}
                key={index}
                hover
                selected={game.currentMove === index}
                onClick={() => {
                  if (index === game.currentMove || game.laserAnimating) return;
                  setGame((prevGame: Game) => ({
                    ...prevGame,
                    currentMove: index,
                    lastMove: { from: history.from, to: history.to, action: history.action },
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
