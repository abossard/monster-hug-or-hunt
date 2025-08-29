import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Trophy, Target, CheckCircle, Play, Pause, Square, Clock } from '@phosphor-icons/react'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'

interface Todo {
  id: number
  text: string
  points: number
  completed: boolean
  createdAt: Date
}

const motivationalMessages = [
  "Großartig! Du machst echte Fortschritte! 🎉",
  "Super gemacht! Weiter so! ⭐",
  "Fantastisch! Du bist auf dem richtigen Weg! 🚀",
  "Excellent! Dein Fleiß zahlt sich aus! 💪",
  "Perfekt! Du rockst dein Studium! 🎯",
  "Bravo! Schritt für Schritt zum Erfolg! 🏆",
  "Wunderbar! Du bist unstoppable! ✨",
  "Klasse! Deine Disziplin beeindruckt! 🌟"
]

const breakMessages = [
  "Zeit für eine wohlverdiente Pause! 🌸",
  "Pause Zeit! Dein Gehirn braucht Erholung 🧠",
  "Super Lernzeit! Jetzt erstmal entspannen ☕",
  "Perfekt gelernt! Gönn dir eine Pause 🎯",
  "Zeit zum Durchatmen! Du hast es dir verdient 🌟",
  "Lernziel erreicht! Jetzt relaxen 😌",
  "Fantastische Session! Pause ist angesagt 🚀",
  "Auszeit! Lass dein Wissen sacken ✨"
]

function App() {
  const [newTodoText, setNewTodoText] = useState('')
  const [newTodoPoints, setNewTodoPoints] = useState('1')
  const [todos, setTodos] = useKV<Todo[]>('study-todos', [])
  const [totalPoints, setTotalPoints] = useKV<number>('study-total-points', 0)
  
  // Timer state
  const [timerMinutes, setTimerMinutes] = useState('25')
  const [timeLeft, setTimeLeft] = useState(0) // in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [isTimerPaused, setIsTimerPaused] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Timer effect
  useEffect(() => {
    if (isTimerRunning && !isTimerPaused && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && isTimerRunning) {
      // Timer finished
      setIsTimerRunning(false)
      setIsTimerPaused(false)
      playNotificationSound()
      const randomBreakMessage = breakMessages[Math.floor(Math.random() * breakMessages.length)]
      toast.success(randomBreakMessage, {
        description: 'Zeit für eine Pause! Du hast konzentriert gelernt.',
        duration: 5000,
      })
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [isTimerRunning, isTimerPaused, timeLeft])

  const playNotificationSound = () => {
    if (!audioContextRef.current) return
    
    try {
      const oscillator = audioContextRef.current.createOscillator()
      const gainNode = audioContextRef.current.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContextRef.current.destination)
      
      oscillator.frequency.setValueAtTime(800, audioContextRef.current.currentTime)
      oscillator.frequency.setValueAtTime(600, audioContextRef.current.currentTime + 0.1)
      oscillator.frequency.setValueAtTime(800, audioContextRef.current.currentTime + 0.2)
      
      gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.3)
      
      oscillator.start(audioContextRef.current.currentTime)
      oscillator.stop(audioContextRef.current.currentTime + 0.3)
    } catch (error) {
      console.log('Audio playback not available')
    }
  }

  const startTimer = () => {
    if (!isTimerRunning) {
      setTimeLeft(parseInt(timerMinutes) * 60)
    }
    setIsTimerRunning(true)
    setIsTimerPaused(false)
  }

  const pauseTimer = () => {
    setIsTimerPaused(true)
  }

  const resumeTimer = () => {
    setIsTimerPaused(false)
  }

  const stopTimer = () => {
    setIsTimerRunning(false)
    setIsTimerPaused(false)
    setTimeLeft(0)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const addTodo = () => {
    if (!newTodoText.trim()) return

    const newTodo: Todo = {
      id: Date.now(),
      text: newTodoText.trim(),
      points: parseInt(newTodoPoints),
      completed: false,
      createdAt: new Date()
    }

    setTodos(currentTodos => [...currentTodos, newTodo])
    setNewTodoText('')
    setNewTodoPoints('1')
  }

  const completeTodo = (todoId: number) => {
    setTodos(currentTodos => {
      const updatedTodos = currentTodos.map(todo => {
        if (todo.id === todoId && !todo.completed) {
          // Add points when completing the task
          setTotalPoints(currentPoints => currentPoints + todo.points)
          
          // Show motivational message
          const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]
          toast.success(randomMessage, {
            description: `+${todo.points} Punkte erhalten!`,
            duration: 3000,
          })

          return { ...todo, completed: true }
        }
        return todo
      })
      return updatedTodos
    })
  }

  const deleteTodo = (todoId: number) => {
    setTodos(currentTodos => currentTodos.filter(todo => todo.id !== todoId))
  }

  const pendingTodos = todos.filter(todo => !todo.completed)
  const completedTodos = todos.filter(todo => todo.completed)

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTodo()
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground flex items-center justify-center gap-3">
            <Target className="w-10 h-10 text-primary" />
            Study Reward Tracker
          </h1>
          <p className="text-muted-foreground">
            Belohne dich für jeden Lernfortschritt!
          </p>
        </div>

        {/* Points Display */}
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Trophy className="w-8 h-8 text-accent" />
              <span className="text-3xl font-bold text-primary">{totalPoints}</span>
              <span className="text-xl text-muted-foreground">Punkte</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Dein bisheriger Erfolg im Studium
            </p>
          </CardContent>
        </Card>

        {/* Study Timer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Lerntimer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Timer Display */}
              <div className="text-center">
                <div className="text-6xl font-bold text-primary mb-2">
                  {timeLeft > 0 ? formatTime(timeLeft) : formatTime(parseInt(timerMinutes) * 60)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {isTimerRunning ? (isTimerPaused ? 'Pausiert' : 'Läuft...') : 'Bereit zum Lernen'}
                </p>
              </div>

              {/* Timer Controls */}
              <div className="flex items-center gap-3">
                {!isTimerRunning ? (
                  <>
                    <Select value={timerMinutes} onValueChange={setTimerMinutes}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[20, 25, 30, 35, 40, 45, 50, 55, 60].map(minutes => (
                          <SelectItem key={minutes} value={minutes.toString()}>
                            {minutes} Minuten
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={startTimer} className="flex-1">
                      <Play className="w-4 h-4 mr-2" />
                      Start
                    </Button>
                  </>
                ) : (
                  <div className="flex gap-2 w-full">
                    {isTimerPaused ? (
                      <Button onClick={resumeTimer} className="flex-1">
                        <Play className="w-4 h-4 mr-2" />
                        Fortsetzen
                      </Button>
                    ) : (
                      <Button onClick={pauseTimer} variant="secondary" className="flex-1">
                        <Pause className="w-4 h-4 mr-2" />
                        Pause
                      </Button>
                    )}
                    <Button onClick={stopTimer} variant="destructive">
                      <Square className="w-4 h-4 mr-2" />
                      Stop
                    </Button>
                  </div>
                )}
              </div>

              {/* Timer Progress Bar */}
              {isTimerRunning && (
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-1000 ease-linear"
                    style={{ 
                      width: `${((parseInt(timerMinutes) * 60 - timeLeft) / (parseInt(timerMinutes) * 60)) * 100}%` 
                    }}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Add Todo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Neue Aufgabe hinzufügen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="Was möchtest du heute lernen?"
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Select value={newTodoPoints} onValueChange={setNewTodoPoints}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(points => (
                    <SelectItem key={points} value={points.toString()}>
                      {points} {points === 1 ? 'Punkt' : 'Punkte'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={addTodo} disabled={!newTodoText.trim()}>
                <Plus className="w-4 h-4 mr-2" />
                Hinzufügen
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pending Todos */}
        {pendingTodos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Anstehende Aufgaben</span>
                <Badge variant="secondary">
                  {pendingTodos.length} {pendingTodos.length === 1 ? 'Aufgabe' : 'Aufgaben'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingTodos.map(todo => (
                <div 
                  key={todo.id} 
                  className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    checked={false}
                    onCheckedChange={() => completeTodo(todo.id)}
                  />
                  <span className="flex-1 text-foreground">{todo.text}</span>
                  <Badge className="bg-accent text-accent-foreground">
                    {todo.points} {todo.points === 1 ? 'Punkt' : 'Punkte'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteTodo(todo.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    ✕
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Completed Todos */}
        {completedTodos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-secondary" />
                  Erledigte Aufgaben
                </span>
                <Badge variant="outline">
                  {completedTodos.length} {completedTodos.length === 1 ? 'erledigt' : 'erledigt'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {completedTodos.slice(-5).map(todo => (
                <div 
                  key={todo.id} 
                  className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30"
                >
                  <CheckCircle className="w-5 h-5 text-secondary" />
                  <span className="flex-1 text-muted-foreground line-through">{todo.text}</span>
                  <Badge variant="secondary">
                    +{todo.points} {todo.points === 1 ? 'Punkt' : 'Punkte'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteTodo(todo.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    ✕
                  </Button>
                </div>
              ))}
              {completedTodos.length > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  ... und {completedTodos.length - 5} weitere erledigte Aufgaben
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {todos.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <Target className="w-16 h-16 text-muted-foreground mx-auto" />
              <h3 className="text-xl font-semibold text-foreground">
                Bereit für deine erste Aufgabe?
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Füge oben deine erste Lernaufgabe hinzu und sammle Punkte für jeden Erfolg!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default App