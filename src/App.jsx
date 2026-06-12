import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react'
import './App.css'

// 200 Most Common English Words to Shuffle
const WORDS_BANK = [
  "The", "be", "to", "of", "and", "A", "in", "that", "have", "I", "It", "for", "not", "on", "with", "He", "as", "you", "do", "at",
  "This", "but", "his", "by", "from", "They", "we", "say", "her", "She", "or", "an", "will", "My", "one", "All", "would", "There",
  "Their", "What", "so", "up", "out", "if", "about", "who", "get", "Which", "go", "me", "when", "make", "can", "like", "time", "no",
  "just", "him", "know", "Take", "people", "into", "year", "Your", "good", "some", "could", "Them", "see", "other", "than", "then",
  "good morning", "new world", "think fast", "work hard", "take care", "beautiful day", "follow through", "look ahead",
  "now", "look", "only", "Come", "its", "over", "Think", "also", "back", "after", "use", "Two", "how", "our", "work", "First", "well",
  "way", "even", "New", "want", "because", "Any", "these", "give", "day", "Most", "us", "Are", "was", "were", "been", "has", "had",
  "Why", "where", "Here", "again", "Almost", "always", "Another", "answer", "around", "ask", "Beautiful", "before", "began", "begin",
  "behind", "believe", "between", "black", "blue", "Both", "boy", "bring", "Brother", "brought", "build", "busy", "buy", "call",
  "Came", "car", "Carry", "center", "Change", "child", "children", "city", "Clean", "clear", "close", "cold", "color", "Country",
  "course", "cut", "Dark", "decide", "different", "Does", "done", "door", "down", "Draw", "drink", "drive", "Each", "early", "earth",
  "east", "Easy", "eat", "education", "Egg", "eight", "end", "Enough", "ever", "every", "Example", "eye", "face", "fact", "fall",
  "family", "far", "Farm", "fast", "Father", "fear", "feel", "feet", "Few", "field", "Fight", "fill", "find", "Fine", "fire",
  "Fish", "five", "Floor", "fly", "food", "Foot", "forest", "forget", "Form", "found", "four", "Free", "friend", "Life", "world"
];



const PUNCTUATION_SYMBOLS = ['!', '-', '.', ','];
const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

const getShuffledWords = (count = 150) => {
  const result = [];
  for (let i = 0; i < count; i++) {
    const randomWord = WORDS_BANK[Math.floor(Math.random() * WORDS_BANK.length)];
    result.push(randomWord);
  }
  return result;
};

const getQuoteWords = (count = 150) => {
  const words = getShuffledWords(count);
  const result = [];
  const wordsUntilSymbol = 8; // insert a punctuation symbol after every 8 words
  let counter = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const isLastWord = i === words.length - 1;
    counter += 1;

    if (!isLastWord && counter >= wordsUntilSymbol) {
      const symbol = PUNCTUATION_SYMBOLS[Math.floor(Math.random() * PUNCTUATION_SYMBOLS.length)];
      result.push(`${word}${symbol}`);
      counter = 0;
    } else {
      result.push(word);
    }
  }

  return result;
};

const getRandomNumberString = () => {
  const length = Math.floor(Math.random() * 4) + 1; // 1 to 4 digit numbers
  let number = '';

  for (let i = 0; i < length; i++) {
    number += DIGITS[Math.floor(Math.random() * DIGITS.length)];
  }

  return number.replace(/^0+/, '') || '0';
};

const getNumberWords = (count = 150) => {
  const words = getShuffledWords(count);
  const result = [];
  const minNumbers = Math.max(1, Math.floor(count / 15));
  const maxNumbers = Math.max(minNumbers, Math.floor(count / 10));
  const numberCount = Math.floor(Math.random() * (maxNumbers - minNumbers + 1)) + minNumbers;
  const insertPositions = new Set();

  while (insertPositions.size < numberCount) {
    insertPositions.add(Math.floor(Math.random() * (words.length + 1)));
  }

  for (let i = 0; i < words.length; i++) {
    result.push(words[i]);
    if (insertPositions.has(i + 1)) {
      result.push(getRandomNumberString());
    }
  }

  return result;
};

const generateModeWords = (mode, count = 150) => {
  if (mode === 'quote') return getQuoteWords(count);
  if (mode === 'numbers') return getNumberWords(count);
  return getShuffledWords(count);
};

// Pure utilities to compute dates and timestamps outside render scope
const getTimestamp = () => Date.now();
const formatDateString = (timestamp) => {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Metric calculation helpers
const calculateCorrectChars = (targetList, historyList, current) => {
  let correctCharsCount = 0;
  historyList.forEach((typed, idx) => {
    const target = targetList[idx];
    if (!target) return;
    const min = Math.min(target.length, typed.length);
    for (let i = 0; i < min; i++) {
      if (target[i] === typed[i]) correctCharsCount++;
    }
    if (typed === target) correctCharsCount++;
  });

  if (current && targetList[historyList.length]) {
    const target = targetList[historyList.length];
    const min = Math.min(target.length, current.length);
    for (let i = 0; i < min; i++) {
      if (target[i] === current[i]) correctCharsCount++;
    }
  }
  return correctCharsCount;
};

const getStatsBreakdown = (targetList, historyList, current) => {
  let correct = 0;
  let incorrect = 0;
  let extra = 0;
  let missed = 0;

  targetList.forEach((targetWord, idx) => {
    if (idx > historyList.length) return;

    const typedWord = idx === historyList.length ? current : historyList[idx];
    if (typedWord === undefined) return;

    const targetLen = targetWord.length;
    const typedLen = typedWord.length;

    for (let i = 0; i < Math.max(targetLen, typedLen); i++) {
      if (i < targetLen && i < typedLen) {
        if (targetWord[i] === typedWord[i]) {
          correct++;
        } else {
          incorrect++;
        }
      } else if (i >= targetLen) {
        extra++;
      } else if (i >= typedLen) {
        if (idx < historyList.length) {
          missed++;
        }
      }
    }
  });

  return { correct, incorrect, extra, missed };
};

export default function App() {
  // --- Persistent Settings & States ---
  const [theme, setTheme] = useState(() => localStorage.getItem('vt-theme') || 'default');
  const [mode, setMode] = useState(() => localStorage.getItem('vt-mode') || 'time');
  const [timeLimit, setTimeLimit] = useState(() => Number(localStorage.getItem('vt-timeLimit')) || 30);
  const [wordLimit, setWordLimit] = useState(() => Number(localStorage.getItem('vt-wordLimit')) || 25);

  // --- Current Test Result ---
  const [testResult, setTestResult] = useState(null);

  // --- Core Game Running States (Loaded Lazily) ---
  const [status, setStatus] = useState('idle'); // idle, typing, completed
  const [words, setWords] = useState(() => {
    const initialMode = localStorage.getItem('vt-mode') || 'time';
    const initialWordLimit = Number(localStorage.getItem('vt-wordLimit')) || 25;
    const numWords = initialMode === 'time' ? 150 : initialWordLimit;
    return generateModeWords(initialMode, numWords);
  });
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentInput, setCurrentInput] = useState('');
  const [typedHistory, setTypedHistory] = useState([]);
  const [timeLeft, setTimeLeft] = useState(() => {
    const initialMode = localStorage.getItem('vt-mode') || 'time';
    const initialTimeLimit = Number(localStorage.getItem('vt-timeLimit')) || 30;
    return initialMode === 'time' ? initialTimeLimit : 0;
  });
  const [timeElapsed, setTimeElapsed] = useState(0);

  // --- Real-Time Analytics ---
  const [totalKeysPressed, setTotalKeysPressed] = useState(0);
  const [correctKeysPressed, setCorrectKeysPressed] = useState(0);
  const [chartData, setChartData] = useState([]);
  const [isInputFocused, setIsInputFocused] = useState(false);

  // --- Refs ---
  const inputRef = useRef(null);
  const wordsContainerRef = useRef(null);
  const caretRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const timerActionsRef = useRef({ handleFinishTest: null, handleRecordTick: null });

  // --- Reposition Caret / Blinker when index, size, or viewport changes ---
  // The caret lives inside words-container, so offsets are relative to it directly.
  // When words-container translates (scrolls), caret moves with it automatically.
  const repositionCaret = useCallback(() => {
    const container = wordsContainerRef.current;
    if (!container) return;

    const activeWordEl = container.querySelector('.word.active');
    const caret = caretRef.current;
    if (!activeWordEl || !caret) return;

    const charEls = activeWordEl.querySelectorAll('.char');
    const typedLength = currentInput.length;

    // offsetLeft/offsetTop of charEls are relative to .word (which is position:relative)
    // We need to add the word's own offset relative to .words-container
    const wordLeft = activeWordEl.offsetLeft;
    const wordTop = activeWordEl.offsetTop;

    const targetLeft = charEls.length === 0
      ? wordLeft
      : (typedLength < charEls.length
        ? wordLeft + charEls[typedLength].offsetLeft
        : wordLeft + charEls[charEls.length - 1].offsetLeft + charEls[charEls.length - 1].offsetWidth);

    const targetTop = charEls.length === 0
      ? wordTop
      : (typedLength < charEls.length
        ? wordTop + charEls[typedLength].offsetTop
        : wordTop + charEls[charEls.length - 1].offsetTop);

    caret.style.left = `${targetLeft}px`;
    caret.style.top = `${targetTop}px`;

    // Scroll words-container upward as user advances lines
    if (activeWordEl.offsetTop > 40) {
      container.style.transform = `translateY(-${activeWordEl.offsetTop - 36}px)`;
    } else {
      container.style.transform = 'translateY(0px)';
    }
  }, [currentInput]);

  // Record stats every second for the SVG graph plotting
  const handleRecordTick = useCallback((seconds) => {
    if (seconds <= 0) return;
    const currentCorrect = calculateCorrectChars(words, typedHistory, currentInput);
    const calculatedWPM = Math.round((currentCorrect / 5) / (seconds / 60));

    const { incorrect, extra } = getStatsBreakdown(words, typedHistory, currentInput);
    const errors = incorrect + extra;

    setChartData(prev => [...prev, { second: seconds, wpm: calculatedWPM, errors }]);
  }, [words, typedHistory, currentInput]);

  // Complete and log test results
  const handleFinishTest = useCallback((finalHistory = typedHistory) => {
    setStatus('completed');
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    const elapsed = mode === 'time' ? timeLimit - timeLeft : timeElapsed;
    const finalElapsed = elapsed > 0 ? elapsed : 1;

    const correctChars = calculateCorrectChars(words, finalHistory, currentInput);
    const wpm = Math.round((correctChars / 5) / (finalElapsed / 60));
    const accuracy = totalKeysPressed > 0 ? Math.round((correctKeysPressed / totalKeysPressed) * 100) : 100;
    const breakdown = getStatsBreakdown(words, finalHistory, currentInput);

    setTestResult({
      wpm,
      accuracy,
      breakdown
    });
  }, [words, typedHistory, currentInput, totalKeysPressed, correctKeysPressed, mode, timeLimit, wordLimit, timeElapsed, timeLeft]);

  useEffect(() => {
    timerActionsRef.current = {
      handleFinishTest,
      handleRecordTick
    };
  }, [handleFinishTest, handleRecordTick]);

  // Restart typing workspace with optional param override (prevents stale state dependency)
  const restartTest = useCallback((targetMode = mode, targetTime = timeLimit, targetWords = wordLimit) => {
    setStatus('idle');
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    const numWords = targetMode === 'time' ? 150 : targetWords;
    const nextWords = generateModeWords(targetMode, numWords);

    setWords(nextWords);
    setCurrentWordIndex(0);
    setCurrentInput('');
    setTypedHistory([]);
    setTimeLeft(targetMode === 'time' ? targetTime : 0);
    setTimeElapsed(0);
    setTotalKeysPressed(0);
    setCorrectKeysPressed(0);
    setChartData([]);
    setTestResult(null);

    setTimeout(() => {
      inputRef.current?.focus();
      repositionCaret();
    }, 50);
  }, [mode, timeLimit, wordLimit, repositionCaret]);

  // --- Theme Sync Effect ---
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('vt-theme', theme);
  }, [theme]);

  // --- LocalStorage Settings Sync Effect ---
  useEffect(() => {
    localStorage.setItem('vt-mode', mode);
    localStorage.setItem('vt-timeLimit', timeLimit.toString());
    localStorage.setItem('vt-wordLimit', wordLimit.toString());
  }, [mode, timeLimit, wordLimit]);

  // --- Window Resize Caret Update Effect ---
  useEffect(() => {
    repositionCaret();
    const handleResize = () => repositionCaret();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [repositionCaret, words]);

  // --- Caret reposition when typing or moving between words ---
  useLayoutEffect(() => {
    repositionCaret();
  }, [repositionCaret, currentInput, currentWordIndex, status, words]);

  // --- Focus Input Trigger Effect ---
  useEffect(() => {
    if (status !== 'completed') {
      inputRef.current?.focus();
    }
  }, [status]);

  // --- Ensure word-mode completion is handled reliably ---
  useEffect(() => {
    if (status === 'typing' && mode !== 'time' && currentWordIndex >= words.length) {
      handleFinishTest(typedHistory);
    }
  }, [status, mode, currentWordIndex, words.length, typedHistory, handleFinishTest]);

  // --- Core Game Timer Loop Effect ---
  useEffect(() => {
    if (status !== 'typing') return;

    timerIntervalRef.current = setInterval(() => {
      if (mode === 'time') {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            timerActionsRef.current.handleFinishTest();
            return 0;
          }
          const currentSecondsPassed = timeLimit - (prev - 1);
          timerActionsRef.current.handleRecordTick(currentSecondsPassed);
          return prev - 1;
        });
      } else {
        setTimeElapsed(prev => {
          const nextVal = prev + 1;
          timerActionsRef.current.handleRecordTick(nextVal);
          return nextVal;
        });
      }
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [status, mode, timeLimit]);

  // --- Settings Select Handlers ---
  const handleModeChange = (newMode) => {
    setMode(newMode);
    restartTest(newMode, timeLimit, wordLimit);
  };

  const handleTimeLimitChange = (newTime) => {
    setTimeLimit(newTime);
    restartTest(mode, newTime, wordLimit);
  };

  const handleWordLimitChange = (newWordLimit) => {
    setWordLimit(newWordLimit);
    restartTest(mode, timeLimit, newWordLimit);
  };

  // --- Inputs & Keyboard Handlers ---
  const handleInputChange = (e) => {
    const value = e.target.value;

    if (status === 'idle') {
      setStatus('typing');
      setTimeLeft(mode === 'time' ? timeLimit : 0);
      setTimeElapsed(0);
      setChartData([]);
      setTotalKeysPressed(0);
      setCorrectKeysPressed(0);
    }

    if (value.endsWith(' ')) {
      const activeTyped = value.trim();

      const nextHistory = [...typedHistory, activeTyped];
      setTypedHistory(nextHistory);
      setCurrentWordIndex(prev => prev + 1);
      setCurrentInput('');

      if (mode === 'time' && currentWordIndex + 10 >= words.length) {
        setWords(prev => [...prev, ...getShuffledWords(50)]);
      }

      if (mode !== 'time' && nextHistory.length >= words.length) {
        handleFinishTest(nextHistory);
      }
    } else {
      if (value.length > currentInput.length) {
        const lastTypedChar = value[value.length - 1];
        const targetWord = words[currentWordIndex];
        const targetChar = targetWord ? targetWord[value.length - 1] : null;

        setTotalKeysPressed(prev => prev + 1);
        if (lastTypedChar === targetChar) {
          setCorrectKeysPressed(prev => prev + 1);
        }
      }

      if (mode !== 'time' && currentWordIndex === words.length - 1 && value === words[currentWordIndex]) {
        const nextHistory = [...typedHistory, value];
        setTypedHistory(nextHistory);
        setCurrentWordIndex(prev => prev + 1);
        setCurrentInput('');
        handleFinishTest(nextHistory);
        return;
      }

      setCurrentInput(value);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      restartTest();
      return;
    }

    if (status === 'completed') return;

    if (e.key === 'Backspace' && currentInput === '' && currentWordIndex > 0) {
      e.preventDefault();
      const prevWordIndex = currentWordIndex - 1;
      const prevWordContent = typedHistory[prevWordIndex] || '';

      setTypedHistory(prev => prev.slice(0, -1));
      setCurrentWordIndex(prevWordIndex);
      setCurrentInput(prevWordContent);
    }
  };

  const handleGlobalKeyDown = useCallback((e) => {
    const inputEl = inputRef.current;
    if (!inputEl) return;

    const target = e.target;
    if (target instanceof HTMLElement) {
      const ignoredTags = ['INPUT', 'TEXTAREA', 'SELECT'];
      if (ignoredTags.includes(target.tagName) || target.isContentEditable) {
        return;
      }
    }

    if (document.activeElement !== inputEl) {
      inputEl.focus();
    }

    if (status === 'idle' && (e.key.length === 1 || e.key === 'Backspace')) {
      setStatus('typing');
      setTimeLeft(mode === 'time' ? timeLimit : 0);
      setTimeElapsed(0);
      setChartData([]);
      setTotalKeysPressed(0);
      setCorrectKeysPressed(0);
    }
  }, [mode, status, timeLimit]);

  useEffect(() => {
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);

  // --- Live Metrics calculations ---
  const currentElapsed = mode === 'time' ? timeLimit - timeLeft : timeElapsed;
  const currentCorrectCount = calculateCorrectChars(words, typedHistory, currentInput);
  const liveWPM = currentElapsed > 0 ? Math.round((currentCorrectCount / 5) / (currentElapsed / 60)) : 0;
  const liveAccuracy = totalKeysPressed > 0 ? Math.round((correctKeysPressed / totalKeysPressed) * 100) : 100;

  return (
    <div className="main-layout">
      {/* App Header */}
      <header className="app-header">
        <div className="logo-section">
          <div className="logo-icon" onClick={() => window.location.reload()}>
            ⚡ VelocityType
          </div>
          <span className="logo-sub">typing speed run</span>
        </div>

        <div className="header-settings">
          <div className="theme-toggle">
            <button
              className={`theme-toggle-btn ${theme === 'light' ? 'active' : ''}`}
              onClick={() => setTheme(theme === 'light' ? 'default' : 'light')}
              aria-label="Toggle theme"
            >
              <span className="theme-icon light-icon">☀️</span>
              <span className="theme-toggle-slider"></span>
              <span className="theme-icon dark-icon">🌙</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Pane */}
      {status !== 'completed' ? (
        <>
          {/* Config Controls Bar */}
          <div className="config-bar">
              <div className="config-group">
                <span className="config-label">mode:</span>
                <div className="config-btn-group">
                  <button
                    className={`config-btn ${mode === 'time' ? 'active' : ''}`}
                    onClick={() => handleModeChange('time')}
                  >
                    time
                  </button>
                  <button
                    className={`config-btn ${mode === 'words' ? 'active' : ''}`}
                    onClick={() => handleModeChange('words')}
                  >
                    words
                  </button>
                  <button
                    className={`config-btn ${mode === 'quote' ? 'active' : ''}`}
                    onClick={() => handleModeChange('quote')}
                  >
                    quote
                  </button>
                  <button
                    className={`config-btn ${mode === 'numbers' ? 'active' : ''}`}
                    onClick={() => handleModeChange('numbers')}
                  >
                    numbers
                  </button>
                </div>
              </div>

              <div className="config-group">
                <span className="config-label">options:</span>
                {mode === 'time' ? (
                  <div className="config-btn-group">
                    {[15, 30, 60, 120].map((t) => (
                      <button
                        key={t}
                        className={`config-btn ${timeLimit === t ? 'active' : ''}`}
                        onClick={() => handleTimeLimitChange(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="config-btn-group">
                    {[10, 25, 50, 100].map((w) => (
                      <button
                        key={w}
                        className={`config-btn ${wordLimit === w ? 'active' : ''}`}
                        onClick={() => handleWordLimitChange(w)}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

          {/* Typing Area Panel */}
          <div
            className={`typing-container-wrapper ${!isInputFocused && status !== 'completed' ? 'blurred' : ''}`}
            onClick={() => inputRef.current?.focus()}
          >
            <div className="focus-alert">
              🖱️ Click here or press any key to focus and start typing
            </div>

            <div className="typing-box">
              <div className="words-container" ref={wordsContainerRef}>
                {/* Caret lives inside words-container to share its coordinate space */}
                <div className={`caret ${(status === 'typing' || isInputFocused) ? 'typing' : ''}`} ref={caretRef}></div>
                {words.map((word, wordIdx) => {
                  const typed = typedHistory[wordIdx] || '';
                  const isActive = wordIdx === currentWordIndex;
                  const isSubmitted = wordIdx < currentWordIndex;

                  let hasErrors = false;
                  if (isSubmitted && typed !== word) {
                    hasErrors = true;
                  }

                  return (
                    <div key={wordIdx} className={`word ${isActive ? 'active' : ''} ${hasErrors ? 'error' : ''}`}>
                      {word.split('').map((char, charIdx) => {
                        let charClass = 'char';
                        const isCurrent = isActive && charIdx === currentInput.length;
                        if (isActive) {
                          if (charIdx < currentInput.length) {
                            charClass += currentInput[charIdx] === char ? ' correct' : ' incorrect';
                          } else {
                            charClass += ' untyped';
                            if (isCurrent) charClass += ' next';
                          }
                        } else if (isSubmitted) {
                          if (charIdx < typed.length) {
                            charClass += typed[charIdx] === char ? ' correct' : ' incorrect';
                          } else {
                            charClass += ' missed';
                          }
                        } else {
                          charClass += ' untyped';
                        }

                        return (
                          <span key={charIdx} className={charClass}>
                            {char}
                          </span>
                        );
                      })}

                      {/* Display Extra letters if user typed longer than word length */}
                      {isActive && currentInput.length > word.length && (
                        currentInput.slice(word.length).split('').map((extraChar, extraIdx) => (
                          <span key={`extra-${extraIdx}`} className="char extra">
                            {extraChar}
                          </span>
                        ))
                      )}

                      {/* Display Extra letters typed on completed words */}
                      {isSubmitted && typed.length > word.length && (
                        typed.slice(word.length).split('').map((extraChar, extraIdx) => (
                          <span key={`extra-${extraIdx}`} className="char extra">
                            {extraChar}
                          </span>
                        ))
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hidden Input capturing typed text */}
            <input
              type="text"
              ref={inputRef}
              className="hidden-typing-input"
              value={currentInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>

          {/* Test Running Status Bar */}
          <div className="test-footer">
            <div className="stats-ribbon">
              <div>
                wpm: <strong>{liveWPM}</strong>
              </div>
              <div>
                accuracy: <strong>{liveAccuracy}%</strong>
              </div>
              <div>
                {mode === 'time' ? (
                  <>time left: <strong>{timeLeft}s</strong></>
                ) : (
                  <>time elapsed: <strong>{timeElapsed}s</strong> / {currentWordIndex}/{words.length}</>
                )}
              </div>
            </div>

            <button className="restart-btn" onClick={() => restartTest()}>
              <svg fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
              </svg>
              <span>Restart</span>
            </button>
          </div>
        </>
      ) : (
        /* Results dashboard screen */
        <div className="glass-panel results-dashboard">
          <div className="results-summary">
            <div className="stat-card">
              <span className="label">wpm</span>
              <span className="value">
                {testResult?.wpm || 0}
              </span>
            </div>

            <div className="stat-card sub-stat">
              <span className="label">accuracy</span>
              <span className="value">
                {testResult?.accuracy || 0}%
              </span>
            </div>

            {/* Keystrokes Breakdown list */}
            <div className="results-detail-grid">
              <div className="detail-item">
                <span>Correct</span>
                <strong>{testResult?.breakdown.correct}</strong>
              </div>
              <div className="detail-item">
                <span>Wrong</span>
                <strong>{testResult?.breakdown.incorrect}</strong>
              </div>
              <div className="detail-item">
                <span>Extra</span>
                <strong>{testResult?.breakdown.extra}</strong>
              </div>
              <div className="detail-item">
                <span>Missed</span>
                <strong>{testResult?.breakdown.missed}</strong>
              </div>
            </div>

            <button className="restart-btn" style={{ width: '100%', justifyContent: 'center' }} onClick={() => restartTest()}>
              <svg fill="currentColor" viewBox="0 0 24 24" style={{ width: '1.25rem', height: '1.25rem' }}>
                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
              </svg>
              <span>Try Again</span>
            </button>
          </div>

          {/* SVG Line Chart plotting */}
          <div className="chart-panel">
            <div className="chart-header">
              <span className="chart-title">WPM over Time</span>
            </div>

            <div className="chart-svg-container">
              {chartData.length > 1 ? (
                (() => {
                  const maxX = chartData.length - 1;
                  const maxY = Math.max(...chartData.map(d => d.wpm), 40);

                  const points = chartData.map((d, index) => {
                    const x = (index / maxX) * 440 + 20;
                    const y = 160 - (d.wpm / maxY) * 130;
                    return { x, y, val: d.wpm, err: d.errors, sec: d.second };
                  });

                  const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                  const areaPath = `${linePath} L ${points[points.length - 1].x} 170 L ${points[0].x} 170 Z`;

                  return (
                    <svg viewBox="0 0 480 180" width="100%" height="100%">
                      <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--main-color)" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="var(--main-color)" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Grid Horizontal Guide lines */}
                      {[0.25, 0.5, 0.75, 1].map((r, i) => (
                        <line
                          key={i}
                          x1="10"
                          y1={170 - r * 130}
                          x2="470"
                          y2={170 - r * 130}
                          stroke="var(--border-color)"
                          strokeWidth="1"
                          strokeDasharray="4 4"
                        />
                      ))}

                      {/* Area Chart Gradient */}
                      <path d={areaPath} fill="url(#areaGrad)" />

                      {/* Main WPM Line */}
                      <path d={linePath} fill="none" stroke="var(--main-color)" strokeWidth="2.5" />

                      {/* Error Points indicators */}
                      {points.map((p, i) => {
                        const prevErr = i > 0 ? points[i - 1].err : 0;
                        const hasNewErrors = p.err > prevErr;
                        if (!hasNewErrors) return null;

                        return (
                          <g key={i}>
                            <circle cx={p.x} cy={p.y} r="3.5" fill="var(--error-color)" />
                            <text x={p.x} y={p.y - 7} fontSize="8" fill="var(--error-color)" textAnchor="middle" fontFamily="var(--font-mono)">
                              x
                            </text>
                          </g>
                        );
                      })}

                      {/* Labels and Axis */}
                      <text x="20" y="15" fontSize="9" fill="var(--sub-color)" fontFamily="var(--font-ui)">
                        WPM: {maxY} max
                      </text>
                      <text x="440" y="178" fontSize="9" fill="var(--sub-color)" fontFamily="var(--font-ui)" textAnchor="end">
                        {chartData[chartData.length - 1].second}s elapsed
                      </text>
                    </svg>
                  );
                })()
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--sub-color)', fontSize: '0.85rem' }}>
                  No enough charting data recorded. Try a longer test.
                </div>
              )}
            </div>
          </div>
        </div>
      )}



      {/* Keyboard shortcuts help panel */}
      {status !== 'typing' && (
        <footer className="shortcuts-footer">
          <div>
            press <kbd className="key-badge">Tab</kbd> to quickly restart the typing workspace
          </div>
          <div>
            •
          </div>
          <div>
            press <kbd className="key-badge">Space</kbd> to submit typed word
          </div>
        </footer>
      )}
    </div>
  )
}
