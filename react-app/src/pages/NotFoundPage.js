// src/pages/NotFoundPage.js
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom'; // For navigation back home

// Import MUI components
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Link from '@mui/material/Link'; // MUI Link for styling consistency

// --- Game Configuration Constants ---
const GRAVITY = 0.6;
const JUMP_FORCE = -10;
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 40;
const OBSTACLE_WIDTH = 20;
const OBSTACLE_MIN_HEIGHT = 30;
const OBSTACLE_MAX_HEIGHT = 55; // Keep the reduced height
const OBSTACLE_SPEED = 4;
const OBSTACLE_SPAWN_RATE_MIN = 80;
const OBSTACLE_SPAWN_RATE_MAX = 150;
const INITIAL_PLAYER_X = 50; // Player's fixed X position

function NotFoundPage() {
  // --- Refs ---
  const canvasRef = useRef(null); // Ref to access the canvas DOM element
  const gameLoopRef = useRef(null); // Ref to store the animation frame request ID
  const playerImageRef = useRef(null); // Ref to store the loaded Image object
  const obstaclesRef = useRef([]); // Ref to store the obstacles array
  const playerStateRef = useRef({ // Ref to store player state variables
    y: 0, // Initial y will be set based on canvas height
    velocityY: 0,
    isJumping: false,
  });
  const gameStateRef = useRef({ // Ref to store game state variables
      score: 0,
      frameCount: 0,
      nextObstacleFrame: OBSTACLE_SPAWN_RATE_MAX,
      gameOver: false,
      playerImageLoaded: false,
  });

  // --- State ---
  // State is used primarily to trigger re-renders for things the user sees changing
  // (like score and game over status/button visibility)
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 300 }); // Default size

  // --- Image Loading ---
  useEffect(() => {
    playerImageRef.current = new Image();
    const img = playerImageRef.current;
    img.onload = () => {
      console.log("Player image loaded!");
      gameStateRef.current.playerImageLoaded = true;
    };
    img.onerror = () => {
      console.error("Failed to load player image. Using fallback rectangle.");
      gameStateRef.current.playerImageLoaded = false;
    };
    // *** IMPORTANT: Place your image in the `public/assets` folder ***
    // Reference it starting with '/'
    img.src = '/assets/HutchinsFace.png'; // <-- UPDATE WITH YOUR IMAGE FILENAME
    // img.src = 'https://placehold.co/40x40/ffcc00/000000?text=FACE'; // Placeholder if needed
  }, []); // Run only once on mount

  // --- Game Logic Functions (using useCallback to memoize if needed) ---

  const drawPlayer = useCallback((ctx) => {
    if (!ctx) return;
    const { y } = playerStateRef.current;
    if (gameStateRef.current.playerImageLoaded && playerImageRef.current) {
      ctx.drawImage(playerImageRef.current, INITIAL_PLAYER_X, y, PLAYER_WIDTH, PLAYER_HEIGHT);
    } else {
      ctx.fillStyle = '#ffcc00'; // Fallback color
      ctx.fillRect(INITIAL_PLAYER_X, y, PLAYER_WIDTH, PLAYER_HEIGHT);
    }
  }, []);

  const drawObstacles = useCallback((ctx) => {
    if (!ctx) return;
    ctx.fillStyle = '#ff0000';
    obstaclesRef.current.forEach(obstacle => {
      ctx.fillRect(obstacle.x, obstacle.y, OBSTACLE_WIDTH, obstacle.height);
    });
  }, []);

  const updatePlayer = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const state = playerStateRef.current;
    state.velocityY += GRAVITY;
    state.y += state.velocityY;

    const floorPosition = canvas.height - PLAYER_HEIGHT - 10;
    if (state.y > floorPosition) {
      state.y = floorPosition;
      state.velocityY = 0;
      state.isJumping = false;
    }
    if (state.y < 0) {
      state.y = 0;
      state.velocityY = 0;
    }
  }, []);

  const updateObstacles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const obstacles = obstaclesRef.current;
    const gameState = gameStateRef.current;

    // Move existing obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      obstacles[i].x -= OBSTACLE_SPEED;
      if (obstacles[i].x + OBSTACLE_WIDTH < 0) {
        obstacles.splice(i, 1);
        gameState.score++;
        setScore(gameState.score); // Update React state to re-render score display
      }
    }

    // Spawn new obstacles
    if (gameState.frameCount >= gameState.nextObstacleFrame) {
      const height = Math.random() * (OBSTACLE_MAX_HEIGHT - OBSTACLE_MIN_HEIGHT) + OBSTACLE_MIN_HEIGHT;
      const y = canvas.height - height - 10;
      obstacles.push({ x: canvas.width, y: y, height: height });

      gameState.frameCount = 0;
      gameState.nextObstacleFrame = Math.floor(Math.random() * (OBSTACLE_SPAWN_RATE_MAX - OBSTACLE_SPAWN_RATE_MIN + 1)) + OBSTACLE_SPAWN_RATE_MIN;
    }
  }, []);

  const checkCollision = useCallback(() => {
    const player = playerStateRef.current;
    const playerRect = {
      x: INITIAL_PLAYER_X,
      y: player.y,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT
    };

    for (const obstacle of obstaclesRef.current) {
      const obstacleRect = {
        x: obstacle.x,
        y: obstacle.y,
        width: OBSTACLE_WIDTH,
        height: obstacle.height
      };

      if (
        playerRect.x < obstacleRect.x + obstacleRect.width &&
        playerRect.x + playerRect.width > obstacleRect.x &&
        playerRect.y < obstacleRect.y + obstacleRect.height &&
        playerRect.y + playerRect.height > obstacleRect.y
      ) {
        return true; // Collision
      }
    }
    return false; // No collision
  }, []);

  const jump = useCallback(() => {
    const state = playerStateRef.current;
    if (!state.isJumping && !gameStateRef.current.gameOver) {
      state.velocityY = JUMP_FORCE;
      state.isJumping = true;
    }
  }, []);

  const resetGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    console.log("Resetting game");

    // Reset player state
    playerStateRef.current.y = canvas.height - PLAYER_HEIGHT - 10;
    playerStateRef.current.velocityY = 0;
    playerStateRef.current.isJumping = false;

    // Reset game state
    gameStateRef.current.score = 0;
    gameStateRef.current.frameCount = 0;
    gameStateRef.current.nextObstacleFrame = OBSTACLE_SPAWN_RATE_MAX;
    gameStateRef.current.gameOver = false;

    // Reset obstacles
    obstaclesRef.current = [];

    // Update React state
    setScore(0);
    setIsGameOver(false);

    // Restart game loop if it was stopped
    if (gameLoopRef.current === null) {
        gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
  }, []); // Empty dependency array for resetGame

  // --- Game Loop ---
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const gameState = gameStateRef.current;

    if (!ctx || gameState.gameOver) {
        // If game over, ensure the loop stops requesting new frames
        if (gameLoopRef.current) {
            cancelAnimationFrame(gameLoopRef.current);
            gameLoopRef.current = null; // Indicate loop is stopped
        }
        return;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update
    updatePlayer();
    updateObstacles();

    // Draw
    drawPlayer(ctx);
    drawObstacles(ctx);

    // Check Collision
    if (checkCollision()) {
      console.log("Game Over!");
      gameState.gameOver = true;
      setIsGameOver(true); // Update React state to show button/message
      // Stop the loop here by not requesting the next frame
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
      return;
    }

    gameState.frameCount++;

    // Continue loop
    gameLoopRef.current = requestAnimationFrame(gameLoop);

  }, [updatePlayer, updateObstacles, drawPlayer, drawObstacles, checkCollision]); // Add dependencies

  // --- Canvas Resizing ---
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    if (canvas && container) {
        const newWidth = Math.min(container.clientWidth * 0.95, 800); // Max width 800px
        const newHeight = newWidth / 2; // Maintain aspect ratio
        if (canvas.width !== newWidth || canvas.height !== newHeight) {
            canvas.width = newWidth;
            canvas.height = newHeight;
            setCanvasSize({ width: newWidth, height: newHeight }); // Update state if needed elsewhere
            // Reset player Y position based on new height
            playerStateRef.current.y = canvas.height - PLAYER_HEIGHT - 10;
            console.log(`Canvas resized to: ${newWidth}x${newHeight}`);
            // Optional: Redraw immediately after resize if needed,
            // but the game loop will handle it on the next frame.
        }
    }
  }, []);

  // --- Effects ---

  // Effect for initializing canvas and starting game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      // Initialize player position based on initial canvas size
      playerStateRef.current.y = canvas.height - PLAYER_HEIGHT - 10;
      // Start the game loop
      resetGame(); // Reset ensures clean start
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }

    // Cleanup function to stop the loop when component unmounts
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameLoop, resetGame]); // Add resetGame dependency

  // Effect for handling keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault(); // Prevent page scrolling
        if (gameStateRef.current.gameOver) {
          resetGame();
        } else {
          jump();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    // Cleanup listener
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jump, resetGame]); // Add dependencies

  // Effect for handling touch input
  useEffect(() => {
    const canvas = canvasRef.current;
    const handleTouchStart = (e) => {
        e.preventDefault();
         if (gameStateRef.current.gameOver) {
          resetGame();
        } else {
          jump();
        }
    };
    canvas?.addEventListener('touchstart', handleTouchStart);
    // Cleanup listener
    return () => canvas?.removeEventListener('touchstart', handleTouchStart);
  }, [jump, resetGame]); // Add dependencies

  // Effect for handling resize
  useEffect(() => {
    // Initial resize
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    // Cleanup listener
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  // --- Render Component ---
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 64px)', // Adjust 64px based on TopBar height
        p: 3,
        textAlign: 'center',
        backgroundColor: '#f0f0f0', // Match background from HTML version
      }}
    >
      <Paper elevation={3} sx={{ p: 4, maxWidth: 'md', width: '90%' }}>
        <Typography variant="h4" component="h1" gutterBottom color="error">
          404 - Page Not Found
        </Typography>
        <Typography variant="body1" gutterBottom>
          Oops! Looks like that page took a wrong turn.
        </Typography>
        <Typography variant="body1" gutterBottom sx={{ mb: 3 }}>
          Why not play a game? (Press SPACE or TAP to Jump)
        </Typography>

        {/* Canvas for the game */}
        <canvas
          ref={canvasRef}
          width={canvasSize.width} // Controlled width
          height={canvasSize.height} // Controlled height
          style={{
            border: '2px solid #333',
            backgroundColor: '#fff',
            display: 'block',
            margin: '0 auto', // Center canvas
            maxWidth: '100%', // Ensure canvas doesn't overflow container
            aspectRatio: '2 / 1', // Maintain aspect ratio
          }}
        />

        {/* Score Display */}
        <Typography variant="h6" component="div" sx={{ mt: 2 }}>
          Score: {score}
        </Typography>

        {/* Restart Button - Shown only when game is over */}
        {isGameOver && (
          <Button variant="contained" onClick={resetGame} sx={{ mt: 2 }}>
            Restart Game
          </Button>
        )}

        {/* Link back home */}
        <Box sx={{ mt: 4 }}>
          <Link component={RouterLink} to="/" underline="hover">
            &larr; Go back home
          </Link>
        </Box>
      </Paper>
    </Box>
  );
}

export default NotFoundPage;
