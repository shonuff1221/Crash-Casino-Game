'use client';

import React, { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';

import WelcomeLogin from '../components/WelcomeLogin';
import StatusBar from '../components/StatusBar';
import NumberInput from '../components/NumberInput';
import MultiplierGraph from '../components/MultiplierGraph';
import CurrentRound from '../components/CurrentRound';
import SpeedSlider from '../components/SpeedSlider';
import Ranking from '../components/Ranking';
import Chat from '../components/Chat';

import styles from '../styles/Root.module.scss';

const socket = io('http://localhost:4000');

interface Player {
  name: string;
  points: number;
  multiplier: number;
}

interface GraphDataPoints {
  name: string;
  multiplier?: number;
}

const defaultData: GraphDataPoints[] = [
  { name: '0' },
  { name: '1' },
  { name: '2' },
  { name: '3' },
  { name: '4' },
  { name: '5' },
  { name: '6' },
  { name: '7' },
  { name: '8' },
  { name: '9' },
  { name: '10' },
];

const roundDefault: Player[] = [
  { name: 'You', points: 0, multiplier: 0 },
  { name: 'CPU 1', points: 0, multiplier: 0 },
  { name: 'CPU 2', points: 0, multiplier: 0 },
  { name: 'CPU 3', points: 0, multiplier: 0 },
  { name: 'CPU 4', points: 0, multiplier: 0 },
];

const generateGraphData = (): GraphDataPoints[] => {
  const data: GraphDataPoints[] = [];
  const lastResult = parseFloat((Math.random() * 11).toFixed(2));
  data.push({ name: '10', multiplier: lastResult });

  let currentResult = lastResult;
  for (let i = 9; i >= 0; i--) {
    currentResult *= 0.85;
    data.push({ name: i.toString(), multiplier: parseFloat(currentResult.toFixed(2)) });
  }

  return data.reverse();
};

const getRandomValueFromMultiples = (min: number, max: number, step: number) => {
  const multiples = Array.from({ length: Math.floor((max - min) / step) + 1 }, (_, i) => min + i * step);
  return multiples[Math.floor(Math.random() * multiples.length)];
};

const randomPoints = () => getRandomValueFromMultiples(50, 1000, 25);
const randomMultipliers = () => parseFloat(getRandomValueFromMultiples(1.0, 10, 0.25).toFixed(2));

// Demo chat messages
const demoMessages = [
  "Good luck everyone!",
  "Nice win!",
  "This game is so addictive",
  "Going for 5x this time",
  "Who's ready for the next round?",
  "Amazing multiplier!"
];

const autoGenerateChat = () => {
  const socket = io('http://localhost:4000');
  const demoUsers = ['Player1', 'Player2', 'Player3', 'Player4'];
  
  demoMessages.forEach((message, index) => {
    setTimeout(() => {
      const randomUser = demoUsers[Math.floor(Math.random() * demoUsers.length)];
      socket.emit('chat message', { user: randomUser, message });
    }, index * 2000);
  });
};

export default function Home() {
  const [points, setPoints] = useState<number>(50);
  const [multiplier, setMultiplier] = useState<number>(1.0);
  const [speed, setSpeed] = useState<number>(1);
  const [speedMs, setSpeedMs] = useState<number>(5000);
  const [data, setData] = useState<GraphDataPoints[]>(defaultData);
  const [result, setResult] = useState<number>(0);
  const [chartKey, setChartKey] = useState<number>(0);
  const [round, setRound] = useState<Player[]>(roundDefault);
  const [ranking, setRanking] = useState<Player[]>(roundDefault);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('');
  const [userPoints, setUserPoints] = useState<number>(1000);
  const [userWon, setUserWon] = useState<boolean>();
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.0);
  const [gameInterval, setGameInterval] = useState<NodeJS.Timeout | null>(null);
  const [canCashOut, setCanCashOut] = useState<boolean>(false);

  useEffect(() => {
    // Cleanup interval on component unmount
    return () => {
      if (gameInterval) {
        clearInterval(gameInterval);
      }
    };
  }, [gameInterval]);

  useEffect(() => {
    if (isLoggedIn && !localStorage.getItem('demoMessagesSent')) {
      autoGenerateChat();
      localStorage.setItem('demoMessagesSent', 'true');
    }
  }, [isLoggedIn]);

  const handleLoginSuccess = (name: string) => {
    setIsLoggedIn(true);
    setUserName(name);
  };

  const generateNewPoint = (prevData: GraphDataPoints[]) => {
    if (prevData.length === 0) {
      return { name: '0', multiplier: 1.0 };
    }
    
    const lastPoint = prevData[prevData.length - 1];
    const newMultiplier = (lastPoint.multiplier || 1.0) * 1.01;
    const newName = (parseInt(lastPoint.name) + 1).toString();
    return {
      name: newName,
      multiplier: newMultiplier
    };
  };

  const cashOut = () => {
    if (!canCashOut || !isPlaying) return;
    
    // Clear the game interval
    if (gameInterval) {
      clearInterval(gameInterval);
      setGameInterval(null);
    }

    // Calculate winnings
    const winnings = points * currentMultiplier;
    setUserPoints(prev => prev + winnings);
    setUserWon(true);
    setResult(currentMultiplier);
    setIsPlaying(false);
    setCanCashOut(false);

    // Update rankings
    const newRanking = [...round].sort((a, b) => 
      (b.points * (currentMultiplier >= b.multiplier ? b.multiplier : 0)) - 
      (a.points * (currentMultiplier >= a.multiplier ? a.multiplier : 0))
    );
    setRanking(newRanking);
  };

  const startGame = () => {
    if (isPlaying || points > userPoints) return;

    setIsPlaying(true);
    setCanCashOut(true);
    setCurrentMultiplier(1.0);
    
    // Reset game state
    setData(defaultData);
    setChartKey(prev => prev + 1);
    setResult(0);
    setUserWon(undefined);

    // Generate CPU players' bets
    const newRound = [...roundDefault];
    for (let i = 1; i < newRound.length; i++) {
      newRound[i].points = randomPoints();
      newRound[i].multiplier = randomMultipliers();
    }
    newRound[0].points = points;
    newRound[0].multiplier = multiplier;
    setRound(newRound);

    // Start the game animation with slower progression
    let currentData = [...defaultData];
    
    const interval = setInterval(() => {
      // Random chance for game to crash (10% chance per update)
      if (Math.random() < 0.1) {
        clearInterval(interval);
        setGameInterval(null);
        setCanCashOut(false);
        setUserWon(false);
        setUserPoints(prev => prev - points);
        setResult(currentData[currentData.length - 1].multiplier || 0);
        setIsPlaying(false);
        return;
      }

      const newPoint = generateNewPoint(currentData);
      currentData = [...currentData, newPoint];
      setData(currentData);
      setCurrentMultiplier(newPoint.multiplier || 1.0);
    }, 100); // Update every 100ms

    setGameInterval(interval);
  };

  return (
    <main className={styles.root}>
      {!isLoggedIn ? (
        <WelcomeLogin onLoginSuccess={handleLoginSuccess} />
      ) : (
        <>
          <StatusBar userName={userName} points={userPoints} loggedIn={false} />
          <div className={styles.gameContainer}>
            <div className={styles.leftPanel}>
              <NumberInput
                label="Points"
                value={points}
                onChange={setPoints}
                min={50}
                max={userPoints}
                step={25}
                disabled={isPlaying}
              />
              <NumberInput
                label="Multiplier"
                value={multiplier}
                onChange={setMultiplier}
                min={1.0}
                max={10.0}
                step={0.25}
                disabled={isPlaying}
              />
              <div className={styles.buttonContainer}>
                <button 
                  className={styles.startButton} 
                  onClick={startGame}
                  disabled={isPlaying || points > userPoints}
                >
                  {isPlaying ? 'Playing...' : 'Start'}
                </button>
                <button 
                  className={`${styles.startButton} ${styles.cashOutButton}`}
                  onClick={cashOut}
                  disabled={!canCashOut}
                >
                  Cash Out ({currentMultiplier.toFixed(2)}x)
                </button>
              </div>
              <CurrentRound players={round} />
              <SpeedSlider 
                speed={speed} 
                setSpeed={setSpeed}
                setSpeedMs={setSpeedMs}
                disabled={isPlaying}
              />
            </div>
            <div className={styles.centerPanel}>
              <MultiplierGraph 
                data={data} 
                key={chartKey} 
                speedMs={0} 
                userWon={userWon}
                isPlaying={isPlaying}
                finalMultiplier={result}
              />
            </div>
            <div className={styles.rightPanel}>
              <Ranking players={ranking} />
              <Chat userName={userName} />
            </div>
          </div>
        </>
      )}
    </main>
  );
}
