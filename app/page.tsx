'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import styles from './page.module.css';

// Level configuration with progressive difficulty
interface LevelConfig {
  level: number;
  name: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  itemCount: number;
  baseScale: number;
  timeLimit: number | null;
  description: string;
}

const LEVELS: LevelConfig[] = [
  { level: 1, name: "Cupid's Garden", difficulty: 'Easy', itemCount: 3, baseScale: 1.2, timeLimit: null, description: 'Start your journey!' },
  { level: 2, name: 'Rose Pathway', difficulty: 'Easy', itemCount: 4, baseScale: 1.0, timeLimit: null, description: 'Find the hidden roses!' },
  { level: 3, name: 'Love Arbor', difficulty: 'Medium', itemCount: 5, baseScale: 0.9, timeLimit: 60, description: 'Look among the vines!' },
  { level: 4, name: 'Cafe Terrace', difficulty: 'Medium', itemCount: 6, baseScale: 0.8, timeLimit: 55, description: 'Search the cozy cafe!' },
  { level: 5, name: 'Moonlit Path', difficulty: 'Medium', itemCount: 7, baseScale: 0.75, timeLimit: 50, description: 'Find love under the stars!' },
  { level: 6, name: 'Garden Fountain', difficulty: 'Hard', itemCount: 7, baseScale: 0.65, timeLimit: 50, description: 'Around the fountain!' },
  { level: 7, name: 'Secret Gazebo', difficulty: 'Hard', itemCount: 8, baseScale: 0.6, timeLimit: 45, description: 'Hidden in the gazebo!' },
  { level: 8, name: 'Champagne Bar', difficulty: 'Hard', itemCount: 8, baseScale: 0.55, timeLimit: 45, description: 'Among the bubbles!' },
  { level: 9, name: 'Starlight Bridge', difficulty: 'Expert', itemCount: 9, baseScale: 0.5, timeLimit: 40, description: 'Cross the bridge!' },
  { level: 10, name: 'Romantic Maze', difficulty: 'Expert', itemCount: 10, baseScale: 0.45, timeLimit: 40, description: 'Navigate the maze!' },
  { level: 11, name: 'Ultimate Love', difficulty: 'Expert', itemCount: 12, baseScale: 0.4, timeLimit: 35, description: 'Find all the love!' },
];

// All available Valentine items
const ALL_ITEMS = [
  { id: 'heart', name: 'Heart', category: 'classic' },
  { id: 'rose', name: 'Rose', category: 'flower' },
  { id: 'arrow', name: "Cupid's Arrow", category: 'cupid' },
  { id: 'letter', name: 'Love Letter', category: 'romantic' },
  { id: 'chocolate', name: 'Chocolates', category: 'gift' },
  { id: 'teddy', name: 'Teddy Bear', category: 'gift' },
  { id: 'champagne', name: 'Champagne', category: 'drink' },
  { id: 'ring', name: 'Diamond Ring', category: 'romantic' },
  { id: 'perfume', name: 'Perfume', category: 'gift' },
  { id: 'ticket', name: 'Movie Ticket', category: 'date' },
  { id: 'frame', name: 'Photo Frame', category: 'romantic' },
  { id: 'music', name: 'Love Song', category: 'music' },
  { id: 'truffle', name: 'Truffle', category: 'food' },
  { id: 'bouquet', name: 'Flower Bouquet', category: 'flower' },
  { id: 'hug', name: 'Hug', category: 'emoji' },
  { id: 'kiss', name: 'Kiss', category: 'emoji' },
  { id: 'cushion', name: 'Heart Cushion', category: 'home' },
  { id: 'candle', name: 'Romantic Candle', category: 'home' },
  { id: 'poem', name: 'Love Poem', category: 'romantic' },
  { id: 'giftbox', name: 'Gift Box', category: 'gift' },
  { id: 'balloon', name: 'Heart Balloon', category: 'decoration' },
  { id: 'cupid', name: 'Little Cupid', category: 'cupid' },
  { id: 'necklace', name: 'Necklace', category: 'gift' },
  { id: 'wedding', name: 'Wedding Rings', category: 'romantic' },
];

// Predefined positions for different areas of the scene
const POSITIONS = [
  // Sky area
  { top: '8%', left: '10%' }, { top: '12%', left: '25%' }, { top: '6%', left: '40%' },
  { top: '10%', left: '55%' }, { top: '8%', left: '70%' }, { top: '14%', left: '85%' },
  { top: '5%', left: '90%' },
  // Cafe awning area
  { top: '18%', left: '15%' }, { top: '22%', left: '75%' }, { top: '20%', left: '45%' },
  { top: '16%', left: '60%' },
  // Window area
  { top: '32%', left: '20%' }, { top: '35%', left: '70%' }, { top: '30%', left: '50%' },
  { top: '38%', left: '35%' }, { top: '33%', left: '85%' },
  // Arbor area
  { top: '42%', left: '8%' }, { top: '45%', left: '25%' }, { top: '48%', left: '55%' },
  { top: '44%', left: '80%' }, { top: '50%', left: '92%' }, { top: '47%', left: '70%' },
  // Path area
  { top: '58%', left: '15%' }, { top: '62%', left: '40%' }, { top: '55%', left: '65%' },
  { top: '60%', left: '88%' }, { top: '65%', left: '25%' }, { top: '58%', left: '75%' },
  // Grass area - keep items above bottom panel
  { top: '68%', left: '10%' }, { top: '70%', left: '35%' }, { top: '66%', left: '55%' },
  { top: '68%', left: '80%' }, { top: '65%', left: '95%' }, { top: '72%', left: '20%' },
  { top: '67%', left: '65%' }, { top: '70%', left: '85%' },
  // Lower grass - still above panel
  { top: '73%', left: '15%' }, { top: '71%', left: '45%' }, { top: '69%', left: '70%' },
  { top: '74%', left: '30%' }, { top: '72%', left: '90%' },
];

// Get items for a specific level
function getLevelItems(level: number, levelConfig: LevelConfig): typeof ALL_ITEMS {
  const shuffled = [...ALL_ITEMS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, levelConfig.itemCount);
}

// Generate positions for items in a level
function getLevelPositions(count: number, levelConfig: LevelConfig): { top: string; left: string }[] {
  const shuffled = [...POSITIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(pos => ({
    top: pos.top,
    left: pos.left,
  }));
}

export default function Home() {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [foundItems, setFoundItems] = useState<string[]>([]);
  const [levelItems, setLevelItems] = useState<typeof ALL_ITEMS>([]);
  const [itemPositions, setItemPositions] = useState<{ top: string; left: string }[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [levelTransition, setLevelTransition] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);

  const currentLevelConfig = LEVELS[currentLevel];
  const progress = levelItems.length > 0 ? (foundItems.length / levelItems.length) * 100 : 0;

  // Audio context for sound effects
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  useEffect(() => {
    const initAudio = () => {
      if (!audioContext) {
        const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        setAudioContext(ctx);
      }
    };

    window.addEventListener('click', initAudio, { once: true });
    return () => window.removeEventListener('click', initAudio);
  }, [audioContext]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Timer effect
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || showModal || showIntro) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          // Time's up - continue without penalty
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, showModal, showIntro]);

  // Initialize level
  const initLevel = useCallback((levelIndex: number) => {
    const config = LEVELS[levelIndex];
    const items = getLevelItems(levelIndex, config);
    const positions = getLevelPositions(items.length, config);
    
    setLevelItems(items);
    setItemPositions(positions);
    setFoundItems([]);
    setHasWon(false);
    setShowModal(false);
    setTimeRemaining(config.timeLimit);
    setLevelTransition(true);
    
    setTimeout(() => setLevelTransition(false), 500);
  }, []);

  // Start game
  const startGame = () => {
    setShowIntro(false);
    initLevel(0);
  };

  // Next level
  const nextLevel = () => {
    if (currentLevel < LEVELS.length - 1) {
      const nextLevelIndex = currentLevel + 1;
      setCurrentLevel(nextLevelIndex);
      initLevel(nextLevelIndex);
    } else {
      setGameComplete(true);
      setShowModal(true);
    }
  };

  // Play sound
  const playSound = useCallback((type: 'collect' | 'win' | 'level') => {
    if (isMuted || !audioContext) return;

    const ctx = audioContext;
    
    if (type === 'collect') {
      // Gentle pop sound
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.frequency.setValueAtTime(523.25, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.1);
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);
    } else if (type === 'win') {
      // Celebratory chord
      const frequencies = [523.25, 659.25, 783.99, 1046.5];
      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + 1.2);
      });
    } else if (type === 'level') {
      // Level up sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    }
  }, [isMuted, audioContext]);

  // Trigger confetti
  const triggerConfetti = useCallback((intensity: 'normal' | 'big' = 'normal') => {
    
    const heartShape = () => {
      confetti({
        particleCount: 1,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF69B4', '#FF1493', '#DC143C', '#FFB6C1'],
        shapes: ['circle'],
        scalar: 1.2,
      });
    };

    const particleCount = intensity === 'big' ? 200 : 100;
    
    confetti({
      particleCount,
      spread: 100,
      origin: { y: 0.5 },
      colors: ['#FF69B4', '#FF1493', '#DC143C', '#FFD700', '#FFB6C1'],
      startVelocity: 25,
      decay: 0.9,
      gravity: 0.8,
      ticks: 150,
    });

    setTimeout(() => {
      confetti({
        particleCount: intensity === 'big' ? 150 : 80,
        spread: 90,
        origin: { y: 0.4 },
        colors: ['#FF69B4', '#FFB6C1', '#FFD700'],
      });
    }, 150);

    for (let i = 0; i < (intensity === 'big' ? 8 : 4); i++) {
      setTimeout(() => heartShape(), 400 + i * 120);
    }
  }, []);

  // Handle item click
  const handleItemClick = useCallback((itemId: string) => {
    if (foundItems.includes(itemId) || hasWon || showIntro) return;

    const newFound = [...foundItems, itemId];
    setFoundItems(newFound);
    playSound('collect');

    if (newFound.length === levelItems.length) {
      setHasWon(true);
      playSound('win');
      
      if (currentLevel === LEVELS.length - 1) {
        triggerConfetti('big');
      } else {
        triggerConfetti('normal');
      }
      
      setTimeout(() => setShowModal(true), 600);
    }
  }, [foundItems, hasWon, showIntro, levelItems.length, currentLevel, playSound, triggerConfetti]);

  // Get item scale based on level and item index
  const getItemScale = (itemIndex: number) => {
    // Keep items always visible and easy to click
    return 1;
  };

  // Copy coupon code
  const copyToClipboard = () => {
    navigator.clipboard.writeText('LOVE2026');
    alert('Coupon code copied: LOVE2026');
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return '#4CAF50';
      case 'Medium': return '#FF9800';
      case 'Hard': return '#f44336';
      case 'Expert': return '#9C27B0';
      default: return '#FF69B4';
    }
  };

  if (showIntro) {
    return (
      <main className={styles.container}>
        <svg className={styles.background} viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="introSkyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFE4E1" />
              <stop offset="100%" stopColor="#FFB6C1" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="1200" height="800" fill="url(#introSkyGradient)" />
          
          {/* Decorative elements */}
          {[...Array(20)].map((_, i) => (
            <text key={i} x={50 + (i % 5) * 200} y={100 + Math.floor(i / 5) * 120} 
              fontSize="40" fill="#FFB6C1" opacity="0.3">
              ❤️
            </text>
          ))}
        </svg>

        <div className={styles.introContainer}>
          <div className={styles.introContent}>
            <h1 className={styles.introTitle}>💕 Valentine's Day 💕</h1>
            <h2 className={styles.introSubtitle}>Scavenger Hunt</h2>
            <p className={styles.introDescription}>
              Embark on a romantic journey through 11 magical levels! 
              Find hidden love tokens and prove your love for Valentine's Day.
            </p>
            
            <div className={styles.levelPreview}>
              <h3>Adventure Highlights:</h3>
              <ul>
                <li>🌹 11 Progressive Levels</li>
                <li>💝 Up to 12 Items per Level</li>
                <li>⏱️ Timed Challenges</li>
                <li>🎁 Secret Coupon Code</li>
              </ul>
            </div>

            <button className={styles.startButton} onClick={startGame}>
              Start Adventure ❤️
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={`${styles.container} ${levelTransition ? styles.transitioning : ''}`}>
      {/* Background SVG Scene */}
      <svg className={styles.background} viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFE4E1" />
            <stop offset="100%" stopColor="#FFB6C1" />
          </linearGradient>
          <linearGradient id="grassGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#98FB98" />
            <stop offset="100%" stopColor="#90EE90" />
          </linearGradient>
          <linearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#DEB887" />
            <stop offset="100%" stopColor="#D2B48C" />
          </linearGradient>
        </defs>

        {/* Sky */}
        <rect x="0" y="0" width="1200" height="600" fill="url(#skyGradient)" />

        {/* Floating hearts in sky */}
        <g className={styles.floatingHearts}>
          <path d="M100 50 C90 40, 80 50, 100 70 C120 50, 110 40, 100 50" fill="#FFB6C1" opacity="0.5">
            <animate attributeName="cy" values="50;45;50" dur="3s" repeatCount="indefinite" />
          </path>
          <path d="M300 80 C290 70, 280 80, 300 100 C320 80, 310 70, 300 80" fill="#FF69B4" opacity="0.4">
            <animate attributeName="cy" values="80;75;80" dur="4s" repeatCount="indefinite" />
          </path>
          <path d="M900 60 C890 50, 880 60, 900 80 C920 60, 910 50, 900 60" fill="#FFB6C1" opacity="0.5">
            <animate attributeName="cy" values="60;55;60" dur="3.5s" repeatCount="indefinite" />
          </path>
          <path d="M1100 100 C1090 90, 1080 100, 1100 120 C1120 100, 1110 90, 1100 100" fill="#FF1493" opacity="0.3">
            <animate attributeName="cy" values="100;95;100" dur="4.5s" repeatCount="indefinite" />
          </path>
        </g>

        {/* Distant trees/bushes */}
        <ellipse cx="100" cy="550" rx="80" ry="60" fill="#228B22" opacity="0.6" />
        <ellipse cx="200" cy="560" rx="100" ry="70" fill="#2E8B57" opacity="0.5" />
        <ellipse cx="450" cy="555" rx="70" ry="50" fill="#228B22" opacity="0.6" />
        <ellipse cx="750" cy="565" rx="90" ry="60" fill="#2E8B57" opacity="0.5" />
        <ellipse cx="1000" cy="550" rx="75" ry="55" fill="#228B22" opacity="0.6" />
        <ellipse cx="1150" cy="560" rx="60" ry="45" fill="#2E8B57" opacity="0.5" />

        {/* Cafe/Patio Structure */}
        <path d="M400 200 L500 140 L800 140 L900 200 L850 200 L800 160 L500 160 L450 200 Z" fill="#FF6B6B" stroke="#DC143C" strokeWidth="2" />
        <path d="M500 160 L520 200" stroke="#FFD700" strokeWidth="8" fill="none" />
        <path d="M560 148 L580 200" stroke="#FFD700" strokeWidth="8" fill="none" />
        <path d="M620 145 L640 200" stroke="#FFD700" strokeWidth="8" fill="none" />
        <path d="M680 145 L700 200" stroke="#FFD700" strokeWidth="8" fill="none" />

        {/* Cafe window */}
        <rect x="500" y="220" width="300" height="150" rx="5" fill="#FFE4B5" stroke="#8B4513" strokeWidth="4" />
        <line x1="650" y1="220" x2="650" y2="370" stroke="#8B4513" strokeWidth="3" />
        <line x1="500" y1="295" x2="800" y2="295" stroke="#8B4513" strokeWidth="3" />
        <rect x="510" y="230" width="130" height="55" rx="3" fill="#FFF8DC" opacity="0.8" />
        <rect x="660" y="230" width="130" height="55" rx="3" fill="#FFF8DC" opacity="0.8" />

        {/* Door */}
        <rect x="620" y="380" width="80" height="120" rx="3" fill="#DEB887" stroke="#8B4513" strokeWidth="3" />
        <circle cx="685" cy="440" r="5" fill="#FFD700" />

        {/* Cafe table */}
        <ellipse cx="580" cy="300" rx="25" ry="15" fill="#8B4513" />
        <rect x="575" y="315" width="10" height="30" fill="#8B4513" />
        <ellipse cx="580" cy="350" rx="20" ry="8" fill="#8B4513" />

        {/* Lattice/Arbor */}
        <rect x="150" y="300" width="8" height="200" fill="#8B4513" />
        <rect x="280" y="300" width="8" height="200" fill="#8B4513" />
        <rect x="920" y="300" width="8" height="200" fill="#8B4513" />
        <rect x="1050" y="300" width="8" height="200" fill="#8B4513" />
        {[320, 360, 400, 440, 480].map((y, i) => (
          <rect key={i} x="150" y={y} width="138" height="6" fill="#A0522D" />
        ))}
        {[320, 360, 400, 440, 480].map((y, i) => (
          <rect key={i} x="920" y={y} width="138" height="6" fill="#A0522D" />
        ))}
        {/* Rose vines */}
        <circle cx="160" cy="340" r="8" fill="#FF69B4" />
        <circle cx="270" cy="380" r="8" fill="#FF1493" />
        <circle cx="160" cy="420" r="8" fill="#DC143C" />
        <circle cx="270" cy="460" r="8" fill="#FF69B4" />
        <circle cx="930" cy="350" r="8" fill="#FF1493" />
        <circle cx="1040" cy="400" r="8" fill="#DC143C" />
        <circle cx="930" cy="450" r="8" fill="#FF69B4" />

        {/* Path */}
        <ellipse cx="600" cy="700" rx="350" ry="80" fill="#DEB887" />

        {/* Grass */}
        <rect x="0" y="550" width="1200" height="250" fill="url(#grassGradient)" />

        {/* Flowers */}
        {[50, 150, 250, 350, 450, 550, 650, 750, 850, 950, 1050, 1150].map((x, i) => (
          <g key={i} transform={`translate(${x}, ${580 + (i % 3) * 30})`}>
            <circle cx="0" cy="0" r="8" fill={['#FF69B4', '#FF1493', '#FFD700', '#FFB6C1', '#DC143C'][i % 5]} />
            <circle cx="0" cy="0" r="3" fill="#FFD700" />
          </g>
        ))}

        {/* Bush with hearts */}
        <ellipse cx="300" cy="620" rx="60" ry="40" fill="#228B22" />
        <path d="M280 610 C270 600, 260 610, 280 630 C300 610, 290 600, 280 610" fill="#FF1493" />
        <path d="M320 615 C310 605, 300 615, 320 635 C340 615, 330 605, 320 615" fill="#FF69B4" />

        {/* Stone bench */}
        <rect x="850" y="580" width="120" height="30" rx="5" fill="#A9A9A9" stroke="#808080" strokeWidth="2" />
        <rect x="860" y="610" width="15" height="20" fill="#808080" />
        <rect x="945" y="610" width="15" height="20" fill="#808080" />
        <rect x="845" y="575" width="130" height="8" fill="#BEBEBE" />

        {/* Lamp post */}
        <rect x="100" y="450" width="8" height="150" fill="#2F4F4F" />
        <circle cx="104" cy="440" r="25" fill="#FFE4B5" stroke="#2F4F4F" strokeWidth="3" opacity="0.9" />
        <circle cx="104" cy="440" r="15" fill="#FFFACD" />
      </svg>

      {/* HUD */}
      <div className={styles.hud}>
        <div className={styles.hudLeft}>
          <button 
            className={styles.muteButton}
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
        
        <div className={styles.hudCenter}>
          <div className={styles.levelIndicator}>
            <span className={styles.levelNumber}>Level {currentLevel + 1}</span>
            <span className={styles.levelName}>{currentLevelConfig.name}</span>
          </div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className={styles.itemCounter}>
            <span>💝 {foundItems.length}/{levelItems.length}</span>
            {timeRemaining !== null && (
              <span className={`${styles.timer} ${timeRemaining < 10 ? styles.timerWarning : ''}`}>
                ⏱️ {timeRemaining}s
              </span>
            )}
          </div>
        </div>
        
        <div className={styles.hudRight}>
          <div 
            className={styles.difficultyBadge}
            style={{ backgroundColor: getDifficultyColor(currentLevelConfig.difficulty) }}
          >
            {currentLevelConfig.difficulty}
          </div>
        </div>
      </div>

      {/* Level Title */}
      <div className={styles.levelTitle}>
        <h1>{currentLevelConfig.name}</h1>
        <p>{currentLevelConfig.description}</p>
      </div>

      {/* Hidden Items */}
      {levelItems.map((item, index) => (
        <button
          key={item.id}
          className={`${styles.hiddenItem} ${foundItems.includes(item.id) ? styles.found : ''}`}
          style={{
            top: itemPositions[index]?.top || '50%',
            left: itemPositions[index]?.left || '50%',
            transform: `scale(${getItemScale(index)})`,
          }}
          onClick={() => handleItemClick(item.id)}
          disabled={foundItems.includes(item.id)}
          aria-label={`Find the ${item.name}`}
        >
          <ItemIcon id={item.id} />
        </button>
      ))}

      {/* Items to Find Panel */}
      <div className={styles.itemsPanel}>
        <h3>Find These:</h3>
        <div className={styles.itemsList}>
          {levelItems.map((item) => (
            <div 
              key={item.id} 
              className={`${styles.itemCard} ${foundItems.includes(item.id) ? styles.foundCard : ''}`}
            >
              <div className={styles.itemCardIcon}>
                <MiniIcon id={item.id} />
              </div>
              <span>{item.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Level Complete Modal */}
      {showModal && !gameComplete && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <div className={styles.heartsDecoration}>
                <span>💕</span>
                <span>💗</span>
                <span>💖</span>
              </div>
              
              <h2 className={styles.modalTitle}>Level Complete!</h2>
              <p className={styles.modalText}>
                You found all {levelItems.length} items!
              </p>
              
              <div className={styles.levelStats}>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{currentLevel + 1}</span>
                  <span className={styles.statLabel}>Level</span>
                </div>
                {timeRemaining !== null && (
                  <div className={styles.stat}>
                    <span className={styles.statValue}>{timeRemaining > 0 ? '✓' : '⏰'}</span>
                    <span className={styles.statLabel}>Time Left</span>
                  </div>
                )}
              </div>
              
              <button 
                className={styles.nextButton}
                onClick={nextLevel}
              >
                {currentLevel < LEVELS.length - 1 ? 'Next Level ➜' : 'See Final Reward!'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Complete Modal */}
      {showModal && gameComplete && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modal} ${styles.finalModal}`}>
            <div className={styles.modalContent}>
              <div className={styles.heartsDecoration}>
                <span>💕</span>
                <span>💗</span>
                <span>💖</span>
                <span>💗</span>
                <span>💕</span>
              </div>
              
              <h2 className={styles.modalTitle}>🎉 Congratulations! 🎉</h2>
              <p className={styles.modalText}>
                You completed all 11 levels and proved your love! 
                Here&apos;s your reward:
              </p>
              
              <div className={styles.couponContainer}>
                <span className={styles.couponLabel}>Your Exclusive Code:</span>
                <div className={styles.couponCode} onClick={copyToClipboard}>
                  LOVE2026
                </div>
                <span className={styles.couponHint}>Click to copy!</span>
              </div>
              
              <div className={styles.achievements}>
                <h3>🏆 Achievements Unlocked:</h3>
                <div className={styles.achievementList}>
                  <span>💝 Love Finder</span>
                  <span>🌹 Rose Master</span>
                  <span>🏅 Cupid&apos;s Arrow</span>
                  <span>👑 Ultimate Love</span>
                </div>
              </div>
              
              <button 
                className={styles.closeButton}
                onClick={() => window.location.reload()}
              >
                Play Again
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// Item Icon Components
function ItemIcon({ id }: { id: string }) {
  switch (id) {
    case 'heart':
      return (
        <svg viewBox="0 0 100 100" className={styles.itemIcon}>
          <path d="M50 90 C20 60, 0 40, 20 25 C35 15, 50 30, 50 30 C50 30, 65 15, 80 25 C100 40, 80 60, 50 90 Z" fill="#FF1493" stroke="#DC143C" strokeWidth="3" />
          <path d="M50 75 C35 55, 25 45, 35 38 C42 34, 50 42, 50 42 C50 42, 58 34, 65 38 C75 45, 65 55, 50 75 Z" fill="#FF69B4" />
        </svg>
      );
    case 'rose':
      return (
        <svg viewBox="0 0 100 100" className={styles.itemIcon}>
          <path d="M50 100 Q45 80, 50 60" stroke="#228B22" strokeWidth="4" fill="none" />
          <ellipse cx="35" cy="80" rx="15" ry="8" fill="#228B22" transform="rotate(-30, 35, 80)" />
          <ellipse cx="65" cy="75" rx="15" ry="8" fill="#228B22" transform="rotate(30, 65, 75)" />
          <circle cx="50" cy="35" r="25" fill="#DC143C" />
          <path d="M50 15 Q60 25, 50 35 Q40 25, 50 15" fill="#FF1493" />
          <path d="M30 35 Q40 30, 50 35 Q40 40, 30 35" fill="#FF1493" />
          <path d="M50 35 Q60 30, 70 35 Q60 40, 50 35" fill="#FF1493" />
          <path d="M50 35 Q40 45, 35 50 Q45 55, 50 35" fill="#FF1493" />
          <path d="M50 35 Q60 45, 65 50 Q55 55, 50 35" fill="#FF1493" />
        </svg>
      );
    case 'arrow':
      return (
        <svg viewBox="0 0 100 100" className={styles.itemIcon}>
          <rect x="45" y="20" width="10" height="60" rx="2" fill="#8B4513" />
          <polygon points="50,85 35,55 65,55" fill="#FFD700" stroke="#DAA520" strokeWidth="2" />
          <path d="M50 25 C45 20, 40 25, 40 30 C40 35, 50 45, 50 45 C50 45, 60 35, 60 30 C60 25, 55 20, 50 25 Z" fill="#FF1493" />
          <path d="M45 25 L30 15 L45 30" fill="#FF69B4" />
          <path d="M55 25 L70 15 L55 30" fill="#FF69B4" />
        </svg>
      );
    case 'letter':
      return (
        <svg viewBox="0 0 100 100" className={styles.itemIcon}>
          <rect x="15" y="25" width="70" height="50" rx="5" fill="#FFF8DC" stroke="#DEB887" strokeWidth="2" />
          <path d="M15 25 L50 50 L85 25" stroke="#DEB887" strokeWidth="2" fill="none" />
          <circle cx="50" cy="55" r="12" fill="#FF1493" />
          <path d="M50 48 C46 44, 42 48, 42 52 C42 56, 50 63, 50 63 C50 63, 58 56, 58 52 C58 48, 54 44, 50 48 Z" fill="#FF69B4" />
        </svg>
      );
    case 'chocolate':
      return (
        <svg viewBox="0 0 100 100" className={styles.itemIcon}>
          <rect x="20" y="40" width="60" height="35" rx="3" fill="#8B4513" stroke="#5D3A1A" strokeWidth="2" />
          <rect x="20" y="35" width="60" height="10" rx="3" fill="#A0522D" stroke="#5D3A1A" strokeWidth="2" />
          <rect x="45" y="35" width="10" height="40" fill="#FF1493" />
          <circle cx="50" cy="32" r="8" fill="#FF1493" />
          <ellipse cx="42" cy="30" rx="10" ry="6" fill="#FF69B4" />
          <ellipse cx="58" cy="30" rx="10" ry="6" fill="#FF69B4" />
          <circle cx="30" cy="55" r="5" fill="#3D2314" />
          <circle cx="45" cy="55" r="5" fill="#5D3A1A" />
          <circle cx="60" cy="55" r="5" fill="#3D2314" />
          <circle cx="30" cy="65" r="5" fill="#5D3A1A" />
          <circle cx="45" cy="65" r="5" fill="#3D2314" />
          <circle cx="60" cy="65" r="5" fill="#5D3A1A" />
        </svg>
      );
    case 'teddy':
      return (
        <svg viewBox="0 0 100 100" className={styles.itemIcon}>
          <circle cx="50" cy="35" r="25" fill="#D2691E" />
          <circle cx="40" cy="30" r="5" fill="#000" />
          <circle cx="60" cy="30" r="5" fill="#000" />
          <ellipse cx="50" cy="42" rx="6" ry="4" fill="#FFB6C1" />
          <path d="M25 60 Q20 50, 25 40" stroke="#D2691E" strokeWidth="8" fill="none" strokeLinecap="round" />
          <path d="M75 60 Q80 50, 75 40" stroke="#D2691E" strokeWidth="8" fill="none" strokeLinecap="round" />
          <ellipse cx="50" cy="70" rx="20" ry="25" fill="#D2691E" />
          <circle cx="25" cy="75" r="8" fill="#D2691E" />
          <circle cx="75" cy="75" r="8" fill="#D2691E" />
          <ellipse cx="50" cy="90" rx="15" ry="8" fill="#D2691E" />
        </svg>
      );
    case 'champagne':
      return (
        <svg viewBox="0 0 100 100" className={styles.itemIcon}>
          <path d="M30 90 L35 50 L65 50 L70 90 Z" fill="#FFD700" opacity="0.5" />
          <path d="M35 50 L40 30 L60 30 L65 50 Z" fill="rgba(255,255,200,0.7)" />
          <circle cx="50" cy="25" r="8" fill="#FFF8DC" opacity="0.8" />
          <ellipse cx="50" cy="88" rx="22" ry="6" fill="#C0C0C0" />
          <path d="M38 35 Q50 45, 62 35" stroke="#FFF" strokeWidth="2" fill="none" opacity="0.5" />
        </svg>
      );
    case 'ring':
      return (
        <svg viewBox="0 0 100 100" className={styles.itemIcon}>
          <circle cx="50" cy="55" r="25" fill="none" stroke="#FFD700" strokeWidth="6" />
          <circle cx="50" cy="30" r="12" fill="#E0E0E0" stroke="#C0C0C0" strokeWidth="2" />
          <circle cx="50" cy="30" r="6" fill="#87CEEB" opacity="0.8" />
          <ellipse cx="35" cy="75" rx="8" ry="4" fill="#FFD700" opacity="0.5" />
          <ellipse cx="65" cy="75" rx="8" ry="4" fill="#FFD700" opacity="0.5" />
        </svg>
      );
    case 'perfume':
      return (
        <svg viewBox="0 0 100 100" className={styles.itemIcon}>
          <rect x="35" y="45" width="30" height="45" rx="3" fill="#FF69B4" />
          <rect x="40" y="35" width="20" height="15" fill="#FFD700" />
          <circle cx="50" cy="35" r="8" fill="#FFF" opacity="0.8" />
          <ellipse cx="50" cy="70" rx="18" ry="5" fill="#FF1493" opacity="0.5" />
        </svg>
      );
    case 'ticket':
      return (
        <svg viewBox="0 0 100 100" className={styles.itemIcon}>
          <rect x="15" y="30" width="70" height="45" rx="3" fill="#FF6B6B" />
          <circle cx="25" cy="52" r="8" fill="#FFF" opacity="0.5" />
          <circle cx="75" cy="52" r="8" fill="#FFF" opacity="0.5" />
          <text x="50" y="48" textAnchor="middle" fill="#FFF" fontSize="12" fontWeight="bold">VALENTINE</text>
          <text x="50" y="65" textAnchor="middle" fill="#FFF" fontSize="10">LOVE 2026</text>
        </svg>
      );
    case 'frame':
      return (
        <svg viewBox="0 0 100 100" className={styles.itemIcon}>
          <rect x="20" y="25" width="60" height="50" rx="2" fill="#8B4513" stroke="#5D3A1A" strokeWidth="3" />
          <rect x="28" y="33" width="44" height="34" fill="#FFF8DC" />
          <path d="M35 40 L45 55 L35 70" stroke="#FF1493" strokeWidth="3" fill="none" />
          <path d="M45 40 L55 55 L45 70" stroke="#FF1493" strokeWidth="3" fill="none" />
          <path d="M55 40 L65 55 L55 70" stroke="#FF1493" strokeWidth="3" fill="none" />
        </svg>
      );
    case 'music':
      return (
        <svg viewBox="0 0 100 100" className={styles.itemIcon}>
          <path d="M25 85 L25 40 Q25 30, 35 30 L75 30 Q85 30, 85 40 L85 85" fill="none" stroke="#FF1493" strokeWidth="4" />
          <circle cx="30" cy="85" r="12" fill="#FF69B4" />
          <circle cx="80" cy="85" r="12" fill="#FF69B4" />
          <path d="M35 40 Q50 50, 65 40 Q80 50, 75 85" fill="#FFB6C1" opacity="0.5" />
          <path d="M40 45 L45 50 L50 45" stroke="#FF1493" strokeWidth="2" fill="none" />
          <path d="M55 45 L60 50 L65 45" stroke="#FF1493" strokeWidth="2" fill="none" />
        </svg>
      );
    case 'truffle':
      return (
        <svg viewBox="0 0 100 100" className={styles.itemIcon}>
          <ellipse cx="50" cy="55" rx="30" ry="20" fill="#3D2314" />
          <ellipse cx="40" cy="50" rx="8" ry="6" fill="#5D3A1A" />
          <ellipse cx="60" cy="50" rx="8" ry="6" fill="#5D3A1A" />
          <ellipse cx="50" cy="58" rx="6" ry="4" fill="#5D3A1A" />
          <path d="M30 45 Q35 35, 40 45" stroke="#FFD700" strokeWidth="2" fill="none" />
        </svg>
      );
    case 'bouquet':
      return (
        <svg viewBox="0 0 100 100" className={styles.itemIcon}>
          <path d="M45 90 L45 55" stroke="#228B22" strokeWidth="4" />
          <path d="M55 90 L55 58" stroke="#228B22" strokeWidth="4" />
          <circle cx="40" cy="45" r="12" fill="#FF1493" />
          <circle cx="50" cy="40" r="12" fill="#DC143C" />
          <circle cx="60" cy="45" r="12" fill="#FF69B4" />
          <circle cx="45" cy="52" r="10" fill="#FF1493" />
          <circle cx="55" cy="52" r="10" fill="#DC143C" />
          <ellipse cx="35" cy="60" rx="15" ry="8" fill="#228B22" transform="rotate(-20, 35, 60)" />
          <ellipse cx="65" cy="60" rx="15" ry="8" fill="#228B22" transform="rotate(20, 65, 60)" />
        </svg>
      );
    case 'hug':
      return (
        <svg viewBox="0 0 100 100" className={styles.itemIcon}>
          <text x="50" y="70" textAnchor="middle" fontSize="50">🤗</text>
          <path d="M30 40 Q50 30, 70 40" stroke="#FF69B4" strokeWidth="3" fill="none" />
        </svg>
      );
    case 'kiss':
      return (
        <svg viewBox="0 0 100 100" className={styles.itemIcon}>
          <text x="50" y="70" textAnchor="middle" fontSize="50">💋</text>
        </svg>
      );
    case 'cushion':
      return (
        <svg viewBox="0 0 100 100" className={styles.itemIcon}>
          <path d="M20 50 Q50 35, 80 50 Q85 65, 80 75 Q50 85, 20 75 Q15 65, 20 50 Z" fill="#FF6B6B" />
          <path d="M30 50 Q50 45, 70 50" stroke="#FF1493" strokeWidth="2" fill="none" />
          <path d="M30 60 Q50 55, 70 60" stroke="#FF1493" strokeWidth="2" fill="none" />
          <path d="M30 70 Q50 65, 70 70" stroke="#FF1493" strokeWidth="2" fill="none" />
        </svg>
      );
    case 'candle':
      return (
        <svg viewBox="0 0 100 100" className={styles.itemIcon}>
          <rect x="42" y="50" width="16" height="40" fill="#FFF8DC" />
          <ellipse cx="50" cy="50" rx="10" ry="3" fill="#FFF" />
          <path d="M45 40 L50 25 L55 40 Z" fill="#FFD700" opacity="0.8" />
          <ellipse cx="50" cy="38" rx="5" ry="8" fill="#FF6B6B" opacity="0.6" />
          <ellipse cx="50" cy="95" rx="15" ry="5" fill="#8B4513" />
        </svg>
      );
    case 'poem':
      return (
        <svg viewBox="0 0 100 100" className={styles.itemIcon}>
          <rect x="25" y="20" width="50" height="65" rx="2" fill="#FFF8DC" stroke="#DEB887" strokeWidth="2" />
          <line x1="32" y1="35" x2="68" y2="35" stroke="#FF69B4" strokeWidth="2" />
          <line x1="32" y1="45" x2="65" y2="45" stroke="#FF69B4" strokeWidth="2" />
          <line x1="32" y1="55" x2="68" y2="55" stroke="#FF69B4" strokeWidth="2" />
          <line x1="32" y1="65" x2="60" y2="65" stroke="#FF69B4" strokeWidth="2" />
          <line x1="32" y1="75" x2="55" y2="75" stroke="#FF69B4" strokeWidth="2" />
          <path d="M60 25 L65 20 L70 25" stroke="#FF1493" strokeWidth="3" fill="none" />
        </svg>
      );
    case 'giftbox':
      return (
        <svg viewBox="0 0 100 100" className={styles.itemIcon}>
          <rect x="20" y="45" width="60" height="45" rx="3" fill="#FF6B6B" />
          <rect x="18" y="40" width="64" height="10" rx="2" fill="#FF5252" />
          <rect x="47" y="40" width="6" height="50" fill="#FFD700" />
          <path d="M40 30 Q50 20, 60 30 Q50 40, 40 30" fill="#FFD700" />
          <ellipse cx="42" cy="32" rx="5" ry="3" fill="#FFF" opacity="0.5" />
          <ellipse cx="58" cy="32" rx="5" ry="3" fill="#FFF" opacity="0.5" />
        </svg>
      );
    case 'balloon':
      return (
        <svg viewBox="0 0 100 100" className={styles.itemIcon}>
          <ellipse cx="50" cy="40" rx="25" ry="30" fill="#FF1493" />
          <path d="M50 70 L50 95" stroke="#8B4513" strokeWidth="2" />
          <ellipse cx="50" cy="35" rx="8" ry="12" fill="#FF69B4" opacity="0.5" />
          <path d="M45 25 Q50 20, 55 25" stroke="#FFD700" strokeWidth="2" fill="none" />
        </svg>
      );
    case 'cupid':
      return (
        <svg viewBox="0 0 100 100" className={styles.itemIcon}>
          <circle cx="50" cy="30" r="18" fill="#FFE4C4" />
          <circle cx="45" cy="28" r="3" fill="#000" />
          <circle cx="55" cy="28" r="3" fill="#000" />
          <path d="M45 38 Q50 42, 55 38" stroke="#FF69B4" strokeWidth="2" fill="none" />
          <path d="M25 45 Q20 55, 25 65" stroke="#FFE4C4" strokeWidth="6" fill="none" />
          <path d="M75 45 Q80 55, 75 65" stroke="#FFE4C4" strokeWidth="6" fill="none" />
          <ellipse cx="50" cy="60" rx="12" ry="15" fill="#FFE4C4" />
          <path d="M35 50 L65 50" stroke="#FFB6C1" strokeWidth="3" />
          <path d="M50 25 L50 10" stroke="#FFD700" strokeWidth="3" />
          <ellipse cx="50" cy="8" rx="8" ry="4" fill="#FFD700" />
        </svg>
      );
    case 'necklace':
      return (
        <svg viewBox="0 0 100 100" className={styles.itemIcon}>
          <path d="M25 30 Q50 55, 75 30" fill="none" stroke="#FFD700" strokeWidth="3" />
          <circle cx="50" cy="52" r="10" fill="#E0E0E0" stroke="#C0C0C0" strokeWidth="2" />
          <circle cx="50" cy="52" r="5" fill="#FF1493" />
        </svg>
      );
    case 'wedding':
      return (
        <svg viewBox="0 0 100 100" className={styles.itemIcon}>
          <circle cx="35" cy="50" r="15" fill="none" stroke="#FFD700" strokeWidth="5" />
          <circle cx="65" cy="50" r="15" fill="none" stroke="#FFD700" strokeWidth="5" />
          <path d="M35 35 L50 50 L65 35" fill="#FFF" opacity="0.8" />
          <text x="50" y="80" textAnchor="middle" fill="#FF1493" fontSize="12">♥</text>
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 100 100" className={styles.itemIcon}>
          <path d="M50 90 C20 60, 0 40, 20 25 C35 15, 50 30, 50 30 C50 30, 65 15, 80 25 C100 40, 80 60, 50 90 Z" fill="#FF1493" />
        </svg>
      );
  }
}

// Mini icon for item panel
function MiniIcon({ id }: { id: string }) {
  return (
    <div style={{ width: 30, height: 30 }}>
      <ItemIcon id={id} />
    </div>
  );
}
