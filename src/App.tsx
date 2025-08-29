import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Heart, X } from '@phosphor-icons/react'
import { useKV } from '@github/spark/hooks'

interface Monster {
  id: number
  type: 'cute' | 'ugly'
  emoji: string
}

const CUTE_MONSTERS = ['🐱', '🐶', '🐰', '🐨', '🐼', '🦊', '🐹', '🐯']
const UGLY_MONSTERS = ['👹', '👺', '🧟', '👻', '🦇', '🕷️', '🐍', '🦂']

const GAME_DURATION = 2000 // 2 seconds

function App() {
  const [currentMonster, setCurrentMonster] = useState<Monster | null>(null)
  const [score, setScore] = useKV('monster-game-score', 0)
  const [highScore, setHighScore] = useKV('monster-game-high-score', 0)
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'gameOver'>('waiting')
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [isAnimating, setIsAnimating] = useState(false)
  
  const gameTimerRef = useRef<NodeJS.Timeout>()
  const progressTimerRef = useRef<NodeJS.Timeout>()

  const generateMonster = (): Monster => {
    const isCute = Math.random() > 0.5
    const monsterList = isCute ? CUTE_MONSTERS : UGLY_MONSTERS
    const emoji = monsterList[Math.floor(Math.random() * monsterList.length)]
    
    return {
      id: Date.now(),
      type: isCute ? 'cute' : 'ugly',
      emoji
    }
  }

  const startGame = () => {
    setScore(0)
    setGameState('playing')
    spawnNextMonster()
  }

  const spawnNextMonster = () => {
    setIsAnimating(true)
    setCurrentMonster(null)
    
    setTimeout(() => {
      const monster = generateMonster()
      setCurrentMonster(monster)
      setTimeLeft(GAME_DURATION)
      setIsAnimating(false)
      startTimer()
    }, 300)
  }

  const startTimer = () => {
    if (gameTimerRef.current) clearTimeout(gameTimerRef.current)
    if (progressTimerRef.current) clearInterval(progressTimerRef.current)

    const startTime = Date.now()
    
    progressTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, GAME_DURATION - elapsed)
      setTimeLeft(remaining)
      
      if (remaining <= 0) {
        gameOver()
      }
    }, 16) // ~60fps updates

    gameTimerRef.current = setTimeout(() => {
      gameOver()
    }, GAME_DURATION)
  }

  const makeDecision = (decision: 'hug' | 'kill') => {
    if (!currentMonster || gameState !== 'playing') return

    clearTimeout(gameTimerRef.current!)
    clearInterval(progressTimerRef.current!)

    const correct = 
      (decision === 'hug' && currentMonster.type === 'cute') ||
      (decision === 'kill' && currentMonster.type === 'ugly')

    if (correct) {
      const newScore = score + 1
      setScore(newScore)
      if (newScore > highScore) {
        setHighScore(newScore)
      }
      spawnNextMonster()
    } else {
      gameOver()
    }
  }

  const gameOver = () => {
    clearTimeout(gameTimerRef.current!)
    clearInterval(progressTimerRef.current!)
    setGameState('gameOver')
    setCurrentMonster(null)
  }

  useEffect(() => {
    return () => {
      clearTimeout(gameTimerRef.current!)
      clearInterval(progressTimerRef.current!)
    }
  }, [])

  const progressPercentage = (timeLeft / GAME_DURATION) * 100
  const isDangerZone = timeLeft < 500

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="game-title text-3xl font-bold text-foreground">
            Monster Decision
          </h1>
          <div className="flex justify-center gap-4">
            <Badge variant="secondary" className="text-lg px-3 py-1">
              Score: {score}
            </Badge>
            <Badge variant="outline" className="text-lg px-3 py-1">
              Best: {highScore}
            </Badge>
          </div>
        </div>

        {gameState === 'waiting' && (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="text-6xl">🎮</div>
              <p className="text-foreground/80">
                Quick! Hug the cute monsters and kill the ugly ones!
              </p>
              <p className="text-sm text-foreground/60">
                You have 2 seconds to decide for each monster
              </p>
            </div>
            <Button 
              onClick={startGame}
              size="lg" 
              className="w-full text-lg font-semibold"
            >
              Start Game
            </Button>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="space-y-6">
            <div className="relative">
              <Progress 
                value={progressPercentage} 
                className={`h-3 ${isDangerZone ? 'timer-danger' : 'timer-pulse'}`}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-white drop-shadow">
                  {Math.ceil(timeLeft / 1000)}s
                </span>
              </div>
            </div>

            <div className="monster-display h-32 flex items-center justify-center">
              {currentMonster && (
                <div 
                  key={currentMonster.id}
                  className={`text-8xl ${isAnimating ? 'monster-exit' : 'monster-enter'}`}
                >
                  {currentMonster.emoji}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => makeDecision('hug')}
                disabled={!currentMonster}
                className="h-16 text-lg font-semibold bg-secondary hover:bg-secondary/80 text-secondary-foreground"
              >
                <Heart className="w-6 h-6 mr-2" />
                Hug
              </Button>
              <Button
                onClick={() => makeDecision('kill')}
                disabled={!currentMonster}
                variant="destructive"
                className="h-16 text-lg font-semibold"
              >
                <X className="w-6 h-6 mr-2" />
                Kill
              </Button>
            </div>
          </div>
        )}

        {gameState === 'gameOver' && (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="text-6xl">💀</div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Game Over!</h2>
                <p className="text-foreground/80">
                  You survived {score} monsters
                </p>
                {score === highScore && score > 0 && (
                  <p className="text-accent font-semibold">New High Score! 🎉</p>
                )}
              </div>
            </div>
            <Button 
              onClick={startGame}
              size="lg" 
              className="w-full text-lg font-semibold"
            >
              Play Again
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}

export default App