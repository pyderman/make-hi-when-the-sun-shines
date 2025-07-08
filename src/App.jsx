import { useEffect, useState } from 'react';
import './App.css';
import sonaImg from './assets/sona.png';
import conanImg from './assets/conan.png';
import fourGuysImg from './assets/4guys.png';
import winningConversation from './assets/winning-conversation.wav';

const API_URL = 'https://puzzled.directus.app/items/hi_game/?fields=who,audio_file.filename_disk';
const AUDIO_BASE_URL = 'https://puzzled.directus.app/assets/';
const TOTAL_ROUNDS = 10;

function App() {
  const [audioList, setAudioList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [remainingIndexes, setRemainingIndexes] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [selectedWho, setSelectedWho] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [scores, setScores] = useState([0, 0]); // [Player1, Player2]
  const [roundCount, setRoundCount] = useState(0); // To trigger score reset and track rounds
  const [currentPlayer, setCurrentPlayer] = useState(0); // 0: Player 1, 1: Player 2
  const [gameRound, setGameRound] = useState(1); // 1-based round counter
  const [gameOver, setGameOver] = useState(false);
  const [firework, setFirework] = useState([false, false]);

  useEffect(() => {
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch audio data');
        return res.json();
      })
      .then((data) => {
        setAudioList(data.data || []);
        setLoading(false);
        setRemainingIndexes(data.data ? data.data.map((_, i) => i) : []);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Pick a random index from remainingIndexes
  const getRandomIndex = (indexes) => {
    if (indexes.length === 0) return null;
    const rand = Math.floor(Math.random() * indexes.length);
    return indexes[rand];
  };

  // Show a random audio file when ready or when Next is pressed
  useEffect(() => {
    if (!loading && audioList.length > 0 && currentIndex === null) {
      const idx = getRandomIndex(remainingIndexes);
      setCurrentIndex(idx);
    }
  }, [loading, audioList, remainingIndexes, currentIndex]);

  // Reset scores and set player 1 to start when a new game starts
  useEffect(() => {
    setScores([0, 0]);
    setCurrentPlayer(roundCount % 2); // Player 1 starts on even rounds, Player 2 on odd
    setGameRound(1);
    setGameOver(false);
  }, [roundCount]);

  useEffect(() => {
    if (gameOver && scores[0] > scores[1]) {
      const audio = new Audio(winningConversation);
      audio.play();
    }
    // eslint-disable-next-line
  }, [gameOver]);

  const playAudio = (filename) => {
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
    }
    const audio = new Audio(AUDIO_BASE_URL + filename);
    audio.play();
    setCurrentAudio(audio);
    audio.onended = () => setCurrentAudio(null);
  };

  const handleNext = () => {
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
    }
    if (gameRound >= TOTAL_ROUNDS) {
      setGameOver(true);
      return;
    }
    let newRemaining = remainingIndexes.filter((i) => i !== currentIndex);
    // If all have been played, reset pool
    if (newRemaining.length === 0) {
      newRemaining = audioList.map((_, i) => i);
    }
    const nextIdx = getRandomIndex(newRemaining);
    setRemainingIndexes(newRemaining);
    setCurrentIndex(nextIdx);
    setSelectedWho(null);
    setShowResult(false);
    setCurrentPlayer((p) => 1 - p); // Switch player
    setGameRound((r) => r + 1);
  };

  const handleGuess = (who) => {
    setSelectedWho(who);
    setShowResult(true);
    if (who === audioList[currentIndex].who) {
      setScores((s) => {
        const newScores = [...s];
        newScores[currentPlayer] += 1;
        return newScores;
      });
      setFirework((f) => {
        const arr = [false, false];
        arr[currentPlayer] = true;
        return arr;
      });
      setTimeout(() => {
        setFirework([false, false]);
      }, 700);
    }
  };

  const handleReset = () => {
    setRoundCount((c) => c + 1);
    setCurrentIndex(null);
    setRemainingIndexes(audioList.map((_, i) => i));
    setSelectedWho(null);
    setShowResult(false);
    setGameRound(1);
    setGameOver(false);
  };

  if (loading) return <div>Loading audio files...</div>;
  if (error) return <div>Error: {error}</div>;
  if (audioList.length === 0 || currentIndex === null) return <div>No audio files available.</div>;

  const item = audioList[currentIndex];
  const allWhos = Array.from(new Set(audioList.map((a) => a.who)));
  let winner = null;
  if (gameOver) {
    if (scores[0] > scores[1]) winner = 'Sona';
    else if (scores[1] > scores[0]) winner = 'Conan';
    else winner = 'It\'s a tie!';
  }

  return (
    <div className="audio-app-container">
      <div className="player-col left-col">
        <div className="player-label">Sona</div>
        <img
          src={sonaImg}
          alt="Sona"
          className={`player-img left-img${currentPlayer === 0 ? ' active' : ''}${firework[0] ? ' firework' : ''}`}
        />
        <div className="player-score">Score: {scores[0]}</div>
      </div>
      <div className="audio-app">
        <h1>make 'hi' while the sun shines</h1>
        <div className="round" style={{ marginBottom: '1rem' }}>
          {gameOver ? `Total rounds: ${TOTAL_ROUNDS}` : `Round: ${gameRound} / ${TOTAL_ROUNDS}`}
        </div>
        {gameOver ? (
          <div style={{ margin: '2rem 0', textAlign: 'center' }}>
            <h2>
              Winner: {winner}
            </h2>
            <button className="next-btn pay-btn" onClick={handleReset} style={{ margin: '2rem auto 0', display: 'block', textAlign: 'center' }}>
              <span style={{ fontSize: '2rem', fontWeight: 'bold', display: 'block' }}>Pay 99$</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 'normal', display: 'block', marginTop: '0.2rem' }}>play again</span>
            </button>
          </div>
        ) : (
          <>
            <div className="audio-item">
              <button
                className="play-btn"
                onClick={() => playAudio(item.audio_file?.filename_disk)}
                disabled={!item.audio_file?.filename_disk || gameOver}
              >
                ▶
              </button>
            </div>
            <div className="choices">
              {allWhos.map((who) => (
                <button
                  key={who}
                  onClick={() => handleGuess(who)}
                  disabled={showResult || gameOver}
                  className={showResult && who === selectedWho ? 'selected' : ''}
                  style={{
                    margin: '0.5rem',
                    backgroundColor:
                      showResult && who === item.who
                        ? '#a5d6a7'
                        : showResult && who === selectedWho
                        ? undefined
                        : undefined,
                  }}
                >
                  {who}
                </button>
              ))}
            </div>
            {showResult && (
              <div className="result" style={{ marginTop: '1rem' }}>
                {selectedWho === item.who ? 'Դա ճիշտ է - Correct!' : `Shottyshot! It was ${item.who}.`}
              </div>
            )}
            <button className="next-btn" onClick={handleNext} style={{ margin: '2rem auto 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }} disabled={!showResult || gameOver} aria-label="Next">
              <span role="img" aria-label="microphone" style={{ marginRight: '0.5rem' }}>🎤</span>
              Next
            </button>
            <img
              src={fourGuysImg}
              alt="4 guys"
              className="four-guys-img"
            />
          </>
        )}
      </div>
      <div className="player-col right-col">
        <div className="player-label">Conan</div>
        <img
          src={conanImg}
          alt="Conan"
          className={`player-img right-img${currentPlayer === 1 ? ' active' : ''}${firework[1] ? ' firework' : ''}`}
        />
        <div className="player-score">Score: {scores[1]}</div>
      </div>
    </div>
  );
}

export default App;
