/**
 * SongMiniGamesPage — Play musical mini-games generated from actual karaoke songs.
 * Lets the user pick a song, then choose a game type and difficulty.
 * Challenges are derived from real note pitches, rhythms and melodic patterns.
 */
import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSongsQuery, useSongQuery } from '../../scripts/api/karaoke/apiKaraokeSongs';
import { parseNotes, type KaraokeNoteData } from '../../scripts/karaoke/karaokeTimeline';
import {
  generateMiniGameFromSong,
  getSuitableGameTypes,
  getGameTypes,
  submitAnswer,
  calculateMiniGameResult,
  type MiniGameType,
  type MiniGameState,
  type MiniGameResult,
} from '../../utils/miniGamesEngine';

type Phase = 'pickSong' | 'pickGame' | 'playing' | 'result';

const DIFFICULTY_LABELS = ['Easy', 'Medium', 'Hard', 'Expert', 'Master'] as const;
const DIFFICULTY_COLORS = ['#4caf50', '#2196f3', '#ff9800', '#e91e63', '#9c27b0'];

const SongMiniGamesPage: React.FC = () => {
  const { t } = useTranslation();
  const { data: songs = [] } = useSongsQuery();
  const [search, setSearch] = useState('');
  const [songId, setSongId] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('pickSong');
  const [gameType, setGameType] = useState<MiniGameType>('rhythm');
  const [difficulty, setDifficulty] = useState<1 | 2 | 3 | 4 | 5>(2);
  const [gameState, setGameState] = useState<MiniGameState | null>(null);
  const [result, setResult] = useState<MiniGameResult | null>(null);
  const [answerStart, setAnswerStart] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const { data: songFile } = useSongQuery(songId ?? 0, { enabled: songId !== null });

  const noteLines: KaraokeNoteData[][] = useMemo(() => {
    if (!songFile?.notes?.length) return [];
    const raw = songFile.notes.map(n => n.noteLine);
    return parseNotes(raw, songFile.bpm);
  }, [songFile]);

  const suitableTypes = useMemo(() => getSuitableGameTypes(noteLines), [noteLines]);
  const allTypes = useMemo(() => getGameTypes(), []);

  const filteredSongs = useMemo(() => {
    if (!search.trim()) return songs.slice(0, 50);
    const lower = search.toLowerCase();
    return songs
      .filter(s => (s.title?.toLowerCase().includes(lower) || s.artist?.toLowerCase().includes(lower)))
      .slice(0, 50);
  }, [songs, search]);

  // --- handlers ---
  const handleSelectSong = useCallback((id: number) => {
    setSongId(id);
    setPhase('pickGame');
    setResult(null);
    setGameState(null);
  }, []);

  const handleStartGame = useCallback(() => {
    if (noteLines.length === 0) return;
    const state = generateMiniGameFromSong(noteLines, gameType, difficulty, Date.now());
    setGameState({ ...state, startedAt: Date.now() });
    setPhase('playing');
    setResult(null);
    setFeedback(null);
    setAnswerStart(Date.now());
  }, [noteLines, gameType, difficulty]);

  const handleAnswer = useCallback((answer: string | number | number[]) => {
    if (!gameState || gameState.isComplete) return;
    const ms = Date.now() - answerStart;
    const next = submitAnswer(gameState, answer, ms);
    const correct = next.score > gameState.score;
    setFeedback(correct ? 'correct' : 'wrong');
    setTimeout(() => setFeedback(null), 600);

    if (next.isComplete) {
      const res = calculateMiniGameResult(next);
      setResult(res);
      setGameState(next);
      setPhase('result');
    } else {
      setGameState(next);
      setAnswerStart(Date.now());
    }
  }, [gameState, answerStart]);

  // --- render helpers ---
  const currentChallenge = gameState && !gameState.isComplete
    ? gameState.challenges[gameState.currentIndex]
    : null;

  const gradeColor = (grade: string) => {
    switch (grade) {
      case 'S': return '#ffd700';
      case 'A': return '#4caf50';
      case 'B': return '#2196f3';
      case 'C': return '#ff9800';
      case 'D': return '#e91e63';
      default:  return '#666';
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: 4 }}>
        🎵 {t('songMiniGames.title', 'Song Mini-Games')}
      </h1>
      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 24 }}>
        {t('songMiniGames.subtitle', 'Play musical challenges generated from real karaoke songs')}
      </p>

      {/* ═══════════════════ PICK SONG ═══════════════════ */}
      {phase === 'pickSong' && (
        <div>
          <input
            type="text"
            className="form-control mb-3"
            placeholder={t('songMiniGames.searchPlaceholder', 'Search songs...')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filteredSongs.map(s => (
              <button
                key={s.id}
                className="btn btn-outline-secondary text-start"
                onClick={() => handleSelectSong(s.id)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span><strong>{s.title}</strong> — {s.artist}</span>
                <span className="badge bg-secondary">{s.genre || '?'}</span>
              </button>
            ))}
            {filteredSongs.length === 0 && (
              <p className="text-muted text-center mt-3">
                {t('songMiniGames.noSongs', 'No songs found')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════ PICK GAME ═══════════════════ */}
      {phase === 'pickGame' && songFile && (
        <div>
          <div className="mb-3 text-center">
            <h4>{songFile.title} — {songFile.artist}</h4>
            <button
              className="btn btn-sm btn-link"
              onClick={() => { setPhase('pickSong'); setSongId(null); }}
            >
              ← {t('songMiniGames.changeSong', 'Change song')}
            </button>
          </div>

          {noteLines.length === 0 ? (
            <div className="alert alert-warning text-center">
              {t('songMiniGames.noNotes', 'This song has no note data. Please pick another song.')}
            </div>
          ) : (
            <>
              {/* Game type selector */}
              <h5>{t('songMiniGames.pickGameType', 'Choose game type')}</h5>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {allTypes.map(gt => {
                  const suited = suitableTypes.includes(gt.type);
                  const active = gt.type === gameType;
                  return (
                    <button
                      key={gt.type}
                      className={`btn ${active ? 'btn-primary' : 'btn-outline-primary'}`}
                      style={{
                        opacity: suited ? 1 : 0.5,
                        flex: '1 1 140px',
                      }}
                      onClick={() => setGameType(gt.type)}
                      disabled={!suited}
                      title={!suited ? 'Not enough note data for this game type' : gt.description}
                    >
                      {gt.name}
                    </button>
                  );
                })}
              </div>

              {/* Difficulty selector */}
              <h5>{t('songMiniGames.difficulty', 'Difficulty')}</h5>
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {([1, 2, 3, 4, 5] as const).map(d => (
                  <button
                    key={d}
                    className={`btn ${d === difficulty ? 'btn-warning' : 'btn-outline-secondary'}`}
                    onClick={() => setDifficulty(d)}
                    style={{
                      flex: 1,
                      borderColor: DIFFICULTY_COLORS[d - 1],
                      color: d === difficulty ? '#fff' : DIFFICULTY_COLORS[d - 1],
                      backgroundColor: d === difficulty ? DIFFICULTY_COLORS[d - 1] : 'transparent',
                    }}
                  >
                    {DIFFICULTY_LABELS[d - 1]}
                  </button>
                ))}
              </div>

              <div className="text-center">
                <button className="btn btn-success btn-lg" onClick={handleStartGame}>
                  🎮 {t('songMiniGames.startGame', 'Start Game')}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══════════════════ PLAYING ═══════════════════ */}
      {phase === 'playing' && gameState && currentChallenge && (
        <div>
          {/* Progress */}
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="badge bg-secondary">
              {gameState.currentIndex + 1} / {gameState.challenges.length}
            </span>
            <span style={{ fontSize: 20, fontWeight: 700 }}>
              {t('songMiniGames.score', 'Score')}: {gameState.score}
            </span>
            {gameState.streak > 0 && (
              <span className="badge bg-warning text-dark">
                🔥 {gameState.streak}x {t('songMiniGames.streak', 'streak')}
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="progress mb-3" style={{ height: 6 }}>
            <div
              className="progress-bar bg-success"
              style={{ width: `${(gameState.currentIndex / gameState.challenges.length) * 100}%` }}
            />
          </div>

          {/* Feedback flash */}
          {feedback && (
            <div
              className={`alert ${feedback === 'correct' ? 'alert-success' : 'alert-danger'} text-center py-1`}
              style={{ transition: 'opacity 0.3s' }}
            >
              {feedback === 'correct' ? '✓ Correct!' : '✗ Wrong!'}
            </div>
          )}

          {/* Challenge prompt */}
          <div className="card mb-3" style={{ textAlign: 'center', padding: 24 }}>
            <h3 style={{ marginBottom: 8 }}>
              {currentChallenge.type === 'rhythm' && '🥁 Tap!'}
              {currentChallenge.type === 'melody' && '🎵 What note is this?'}
              {currentChallenge.type === 'chord' && '🎹 What chord?'}
              {currentChallenge.type === 'interval' && '👂 What interval?'}
              {currentChallenge.type === 'sequence' && '🧠 Repeat the sequence'}
            </h3>
            <p className="text-muted mb-0">
              {t('songMiniGames.timeAt', 'At')} {currentChallenge.time.toFixed(1)}s
              &nbsp;·&nbsp;{currentChallenge.points} pts
            </p>
          </div>

          {/* Answer buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {currentChallenge.type === 'rhythm' ? (
              <button
                className="btn btn-lg btn-primary"
                onClick={() => handleAnswer(currentChallenge.answer)}
                style={{ minWidth: 200, fontSize: 24, padding: '16px 32px' }}
              >
                🥁 TAP
              </button>
            ) : currentChallenge.type === 'sequence' && Array.isArray(currentChallenge.answer) ? (
              /* For sequence: show numbered buttons 0-7, user must press in order */
              <>
                <p className="w-100 text-center mb-2">
                  {t('songMiniGames.sequenceHint', 'Memorize and repeat:')}
                  <strong style={{ letterSpacing: 4, fontSize: 20, marginLeft: 8 }}>
                    {(currentChallenge.answer as number[]).map(n => n + 1).join(' ')}
                  </strong>
                </p>
                {Array.from({ length: 8 }, (_, i) => (
                  <button
                    key={i}
                    className="btn btn-outline-primary btn-lg"
                    onClick={() => handleAnswer(currentChallenge.answer)}
                    style={{ width: 56, height: 56, fontSize: 20 }}
                  >
                    {i + 1}
                  </button>
                ))}
              </>
            ) : (
              /* Multiple choice */
              currentChallenge.options?.map((opt) => (
                <button
                  key={opt}
                  className="btn btn-outline-primary btn-lg"
                  onClick={() => handleAnswer(opt)}
                  style={{ minWidth: 140, flex: '1 1 140px' }}
                >
                  {opt}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════ RESULT ═══════════════════ */}
      {phase === 'result' && result && (
        <div className="text-center">
          <div
            style={{
              fontSize: 72,
              fontWeight: 900,
              color: gradeColor(result.grade),
              textShadow: `0 0 20px ${gradeColor(result.grade)}44`,
              marginBottom: 8,
            }}
          >
            {result.grade}
          </div>
          <h3>{songFile?.title} — {songFile?.artist}</h3>

          <div
            className="d-flex justify-content-center gap-4 my-3"
            style={{ fontSize: 18 }}
          >
            <div>
              <div className="text-muted small">{t('songMiniGames.score', 'Score')}</div>
              <strong>{result.score} / {result.maxScore}</strong>
            </div>
            <div>
              <div className="text-muted small">{t('songMiniGames.accuracy', 'Accuracy')}</div>
              <strong>{(result.accuracy * 100).toFixed(0)}%</strong>
            </div>
            <div>
              <div className="text-muted small">{t('songMiniGames.bestStreak', 'Best Streak')}</div>
              <strong>🔥 {result.streak}</strong>
            </div>
            <div>
              <div className="text-muted small">{t('songMiniGames.avgResponse', 'Avg Response')}</div>
              <strong>{result.avgResponseMs.toFixed(0)}ms</strong>
            </div>
          </div>

          <div className="d-flex justify-content-center gap-2 mt-4">
            <button className="btn btn-success" onClick={handleStartGame}>
              🔄 {t('songMiniGames.playAgain', 'Play Again')}
            </button>
            <button
              className="btn btn-outline-primary"
              onClick={() => setPhase('pickGame')}
            >
              🎮 {t('songMiniGames.changeGame', 'Change Game')}
            </button>
            <button
              className="btn btn-outline-secondary"
              onClick={() => { setPhase('pickSong'); setSongId(null); }}
            >
              🎵 {t('songMiniGames.changeSong', 'Change Song')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SongMiniGamesPage;
