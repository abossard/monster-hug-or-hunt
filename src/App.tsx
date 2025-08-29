import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Plus, Trophy, Target, CheckCircle, Play, Pause, Square, Clock, Flower, ShoppingCart, Trash, ChartBar, TrendUp, Calendar, Timer } from '@phosphor-icons/react'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface Todo {
  id: number
  text: string
  points: number
  completed: boolean
  createdAt: Date
}

interface Flower {
  id: string
  name: string
  cost: number
  emoji: string
  color: string
  size: 'small' | 'medium' | 'large'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  growthTime: number // hours to fully grow
  pointsPerHour: number // passive point generation
  comboBonus?: string[] // flower IDs that give bonus when planted nearby
}

interface PlantedFlower {
  id: string
  flowerId: string
  x: number
  y: number
  plantedAt: Date
  growth: number // 0-100% growth level
  lastWatered?: Date
  healthBonus: number // bonus from neighboring flowers
}

interface StudySession {
  id: string
  date: string
  duration: number // in minutes
  points: number
  type: 'timer' | 'task'
  taskText?: string
}

interface GardenAchievement {
  id: string
  name: string
  description: string
  emoji: string
  requirement: {
    type: 'flowers_planted' | 'rare_flowers' | 'combo_bonus' | 'garden_value' | 'daily_care'
    count: number
    specific?: string[]
  }
  reward: number
  unlocked: boolean
}

interface DailyStats {
  date: string
  studyTime: number // in minutes
  tasksCompleted: number
  pointsEarned: number
}

const flowers: Flower[] = [
  { 
    id: 'daisy', name: 'Gänseblümchen', cost: 5, emoji: '🌼', color: '#ffffff', size: 'small',
    rarity: 'common', growthTime: 2, pointsPerHour: 0.5, comboBonus: ['tulip', 'sunflower']
  },
  { 
    id: 'tulip', name: 'Tulpe', cost: 8, emoji: '🌷', color: '#ff69b4', size: 'medium',
    rarity: 'common', growthTime: 3, pointsPerHour: 0.8, comboBonus: ['daisy', 'rose']
  },
  { 
    id: 'sunflower', name: 'Sonnenblume', cost: 12, emoji: '🌻', color: '#ffd700', size: 'large',
    rarity: 'common', growthTime: 4, pointsPerHour: 1.2, comboBonus: ['daisy']
  },
  { 
    id: 'rose', name: 'Rose', cost: 15, emoji: '🌹', color: '#ff0000', size: 'medium',
    rarity: 'rare', growthTime: 6, pointsPerHour: 2, comboBonus: ['tulip', 'lotus']
  },
  { 
    id: 'hibiscus', name: 'Hibiskus', cost: 20, emoji: '🌺', color: '#ff1493', size: 'large',
    rarity: 'rare', growthTime: 8, pointsPerHour: 2.5, comboBonus: ['orchid']
  },
  { 
    id: 'cherry', name: 'Kirschblüte', cost: 25, emoji: '🌸', color: '#ffb6c1', size: 'medium',
    rarity: 'epic', growthTime: 12, pointsPerHour: 3, comboBonus: ['lotus', 'orchid']
  },
  { 
    id: 'lotus', name: 'Lotus', cost: 30, emoji: '🪷', color: '#dda0dd', size: 'large',
    rarity: 'epic', growthTime: 16, pointsPerHour: 4, comboBonus: ['rose', 'cherry']
  },
  { 
    id: 'orchid', name: 'Orchidee', cost: 40, emoji: '🌺', color: '#da70d6', size: 'large',
    rarity: 'legendary', growthTime: 24, pointsPerHour: 6, comboBonus: ['hibiscus', 'cherry']
  },
  { 
    id: 'phoenix', name: 'Phoenix-Blume', cost: 100, emoji: '🔥', color: '#ff4500', size: 'large',
    rarity: 'legendary', growthTime: 48, pointsPerHour: 15, comboBonus: ['lotus', 'orchid']
  }
]

const gardenAchievements: GardenAchievement[] = [
  {
    id: 'first_flower',
    name: 'Erster Spross',
    description: 'Pflanze deine erste Blume',
    emoji: '🌱',
    requirement: { type: 'flowers_planted', count: 1 },
    reward: 5,
    unlocked: false
  },
  {
    id: 'flower_collector',
    name: 'Blumen-Sammler',
    description: 'Pflanze 10 verschiedene Blumen',
    emoji: '🌸',
    requirement: { type: 'flowers_planted', count: 10 },
    reward: 15,
    unlocked: false
  },
  {
    id: 'rare_gardener',
    name: 'Seltener Gärtner',
    description: 'Sammle 3 seltene oder bessere Blumen',
    emoji: '💎',
    requirement: { type: 'rare_flowers', count: 3 },
    reward: 25,
    unlocked: false
  },
  {
    id: 'combo_master',
    name: 'Combo-Meister',
    description: 'Erstelle 5 Blumen-Kombinationen',
    emoji: '⚡',
    requirement: { type: 'combo_bonus', count: 5 },
    reward: 30,
    unlocked: false
  },
  {
    id: 'garden_paradise',
    name: 'Garten-Paradies',
    description: 'Erreiche einen Gartenwert von 500 Punkten',
    emoji: '🏆',
    requirement: { type: 'garden_value', count: 500 },
    reward: 50,
    unlocked: false
  }
]

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
  const [plantedFlowers, setPlantedFlowers] = useKV<PlantedFlower[]>('garden-flowers', [])
  const [studySessions, setStudySessions] = useKV<StudySession[]>('study-sessions', [])
  const [achievements, setAchievements] = useKV<GardenAchievement[]>('garden-achievements', gardenAchievements)
  const [lastWateringDate, setLastWateringDate] = useKV<string>('last-watering-date', '')
  const [draggedFlower, setDraggedFlower] = useState<Flower | null>(null)
  
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
      // Timer finished - calculate points based on study time
      const studyTimeInMinutes = parseInt(timerMinutes)
      const pointsEarned = Math.floor((studyTimeInMinutes / 60) * 10) // 10 points per hour
      
      setIsTimerRunning(false)
      setIsTimerPaused(false)
      
      // Award points for study time
      if (pointsEarned > 0) {
        setTotalPoints(current => current + pointsEarned)
      }
      
      // Record study session
      const newSession: StudySession = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        duration: studyTimeInMinutes,
        points: pointsEarned,
        type: 'timer'
      }
      setStudySessions(current => [...current, newSession])
      
      playNotificationSound()
      const randomBreakMessage = breakMessages[Math.floor(Math.random() * breakMessages.length)]
      toast.success(randomBreakMessage, {
        description: `Zeit für eine Pause! Du hast konzentriert gelernt und ${pointsEarned} Punkte erhalten!`,
        duration: 5000,
      })
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [isTimerRunning, isTimerPaused, timeLeft, timerMinutes, setTotalPoints, setStudySessions])

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
    // Calculate points for partial study time when manually stopping
    if (isTimerRunning && timeLeft > 0) {
      const studiedTime = parseInt(timerMinutes) * 60 - timeLeft // in seconds
      const studiedMinutes = Math.floor(studiedTime / 60)
      const pointsEarned = Math.floor((studiedMinutes / 60) * 10) // 10 points per hour
      
      if (pointsEarned > 0) {
        setTotalPoints(current => current + pointsEarned)
        
        // Record partial study session
        const newSession: StudySession = {
          id: Date.now().toString(),
          date: new Date().toISOString().split('T')[0],
          duration: studiedMinutes,
          points: pointsEarned,
          type: 'timer'
        }
        setStudySessions(current => [...current, newSession])
        
        toast.success(`Lernsession beendet! 📚`, {
          description: `Du hast ${studiedMinutes} Minuten gelernt und ${pointsEarned} Punkte erhalten!`,
          duration: 4000,
        })
      }
    }
    
    setIsTimerRunning(false)
    setIsTimerPaused(false)
    setTimeLeft(0)
  }

  // Passive point generation from garden
  useEffect(() => {
    const interval = setInterval(() => {
      let passivePoints = 0
      const now = new Date()
      
      setPlantedFlowers(currentFlowers => {
        return currentFlowers.map(plantedFlower => {
          const flower = flowers.find(f => f.id === plantedFlower.flowerId)
          if (!flower) return plantedFlower
          
          // Calculate growth over time
          const hoursPlanted = (now.getTime() - plantedFlower.plantedAt.getTime()) / (1000 * 60 * 60)
          const newGrowth = Math.min(100, (hoursPlanted / flower.growthTime) * 100)
          
          // Calculate combo bonus
          const nearbyFlowers = currentFlowers.filter(other => {
            if (other.id === plantedFlower.id) return false
            const distance = Math.sqrt(
              Math.pow(other.x - plantedFlower.x, 2) + Math.pow(other.y - plantedFlower.y, 2)
            )
            return distance < 15 // Within 15% of garden space
          })
          
          let comboBonus = 0
          if (flower.comboBonus) {
            nearbyFlowers.forEach(nearby => {
              const nearbyFlower = flowers.find(f => f.id === nearby.flowerId)
              if (nearbyFlower && flower.comboBonus?.includes(nearbyFlower.id)) {
                comboBonus += 0.5
              }
            })
          }
          
          // Generate passive points if fully grown
          if (newGrowth >= 100) {
            const basePoints = flower.pointsPerHour / 60 // per minute
            const totalPoints = basePoints * (1 + comboBonus)
            passivePoints += totalPoints
          }
          
          return {
            ...plantedFlower,
            growth: newGrowth,
            healthBonus: comboBonus
          }
        })
      })
      
      // Award passive points
      if (passivePoints > 0.1) { // Only award if significant
        setTotalPoints(current => current + Math.floor(passivePoints * 10) / 10)
      }
    }, 60000) // Every minute
    
    return () => clearInterval(interval)
  }, [setPlantedFlowers, setTotalPoints])

  const waterGarden = () => {
    const today = new Date().toISOString().split('T')[0]
    if (lastWateringDate === today) {
      toast.error('Garten bereits heute gegossen! 💧')
      return
    }
    
    setLastWateringDate(today)
    const wateringBonus = Math.floor(plantedFlowers.length * 0.5)
    setTotalPoints(current => current + wateringBonus)
    
    toast.success('Garten gegossen! 🌿', {
      description: `+${wateringBonus} Punkte für die Pflege deines Gartens!`,
      duration: 3000,
    })
  }

  const checkAchievements = () => {
    setAchievements(currentAchievements => {
      return currentAchievements.map(achievement => {
        if (achievement.unlocked) return achievement
        
        let shouldUnlock = false
        
        switch (achievement.requirement.type) {
          case 'flowers_planted':
            shouldUnlock = plantedFlowers.length >= achievement.requirement.count
            break
          case 'rare_flowers':
            const rareCount = plantedFlowers.filter(pf => {
              const flower = flowers.find(f => f.id === pf.flowerId)
              return flower && ['rare', 'epic', 'legendary'].includes(flower.rarity)
            }).length
            shouldUnlock = rareCount >= achievement.requirement.count
            break
          case 'combo_bonus':
            const combos = plantedFlowers.filter(pf => pf.healthBonus > 0).length
            shouldUnlock = combos >= achievement.requirement.count
            break
          case 'garden_value':
            const gardenValue = plantedFlowers.reduce((sum, pf) => {
              const flower = flowers.find(f => f.id === pf.flowerId)
              return sum + (flower ? flower.cost : 0)
            }, 0)
            shouldUnlock = gardenValue >= achievement.requirement.count
            break
        }
        
        if (shouldUnlock) {
          setTotalPoints(current => current + achievement.reward)
          toast.success(`Achievement erhalten! ${achievement.emoji}`, {
            description: `${achievement.name}: +${achievement.reward} Punkte!`,
            duration: 4000,
          })
          return { ...achievement, unlocked: true }
        }
        
        return achievement
      })
    })
  }

  // Check achievements when garden changes
  useEffect(() => {
    checkAchievements()
  }, [plantedFlowers])

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
          
          // Record task completion session
          const newSession: StudySession = {
            id: Date.now().toString(),
            date: new Date().toISOString().split('T')[0],
            duration: 0, // Tasks don't have duration
            points: todo.points,
            type: 'task',
            taskText: todo.text
          }
          setStudySessions(current => [...current, newSession])
          
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

  const buyFlower = (flower: Flower) => {
    if (totalPoints >= flower.cost) {
      setTotalPoints(current => current - flower.cost)
      toast.success(`${flower.name} gekauft! 🌸`, {
        description: `Du kannst sie jetzt in deinen Garten pflanzen!`,
        duration: 3000,
      })
    } else {
      toast.error('Nicht genug Punkte!', {
        description: `Du brauchst ${flower.cost - totalPoints} weitere Punkte.`,
        duration: 3000,
      })
    }
  }

  const handleDragStart = (flower: Flower) => {
    setDraggedFlower(flower)
  }

  const handleGardenDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (!draggedFlower) return

    if (totalPoints < draggedFlower.cost) {
      toast.error('Nicht genug Punkte für diese Blume!')
      setDraggedFlower(null)
      return
    }

    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    // Ensure flower stays within bounds
    const clampedX = Math.max(5, Math.min(95, x))
    const clampedY = Math.max(5, Math.min(95, y))

    const newPlantedFlower: PlantedFlower = {
      id: Date.now().toString(),
      flowerId: draggedFlower.id,
      x: clampedX,
      y: clampedY,
      plantedAt: new Date(),
      growth: 0,
      healthBonus: 0
    }

    setPlantedFlowers(current => [...current, newPlantedFlower])
    setTotalPoints(current => current - draggedFlower.cost)
    setDraggedFlower(null)

    toast.success(`${draggedFlower.name} gepflanzt! 🌱`, {
      description: `Dein Garten wird immer schöner!`,
      duration: 3000,
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const removeFlowerFromGarden = (plantedFlowerId: string) => {
    setPlantedFlowers(current => current.filter(flower => flower.id !== plantedFlowerId))
  }

  const resetGarden = () => {
    setPlantedFlowers([])
    toast.success('Garten zurückgesetzt! 🌱', {
      description: 'Dein Garten ist jetzt bereit für neue Blumen!',
      duration: 3000,
    })
  }

  // Statistics calculations
  const calculateDailyStats = (): DailyStats[] => {
    const stats: { [key: string]: DailyStats } = {}
    
    // Initialize with last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      stats[dateStr] = {
        date: dateStr,
        studyTime: 0,
        tasksCompleted: 0,
        pointsEarned: 0
      }
    }
    
    // Add data from study sessions
    studySessions.forEach(session => {
      if (stats[session.date]) {
        stats[session.date].pointsEarned += session.points
        if (session.type === 'timer') {
          stats[session.date].studyTime += session.duration
        } else {
          stats[session.date].tasksCompleted += 1
        }
      }
    })
    
    return Object.values(stats).sort((a, b) => a.date.localeCompare(b.date))
  }

  const getWeeklyTotals = () => {
    const dailyStats = calculateDailyStats()
    return {
      totalStudyTime: dailyStats.reduce((sum, day) => sum + day.studyTime, 0),
      totalTasks: dailyStats.reduce((sum, day) => sum + day.tasksCompleted, 0),
      totalPoints: dailyStats.reduce((sum, day) => sum + day.pointsEarned, 0),
      averageDaily: dailyStats.reduce((sum, day) => sum + day.studyTime, 0) / 7
    }
  }

  const getStudyStreaks = () => {
    const dailyStats = calculateDailyStats()
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0
    
    // Calculate current streak (from today backwards)
    for (let i = dailyStats.length - 1; i >= 0; i--) {
      if (dailyStats[i].studyTime > 0 || dailyStats[i].tasksCompleted > 0) {
        if (i === dailyStats.length - 1) currentStreak++
        else if (currentStreak === dailyStats.length - 1 - i) currentStreak++
        else break
      } else if (i === dailyStats.length - 1) {
        break
      }
    }
    
    // Calculate longest streak
    dailyStats.forEach(day => {
      if (day.studyTime > 0 || day.tasksCompleted > 0) {
        tempStreak++
        longestStreak = Math.max(longestStreak, tempStreak)
      } else {
        tempStreak = 0
      }
    })
    
    return { currentStreak, longestStreak }
  }

  const getActivityDistribution = () => {
    const timerSessions = studySessions.filter(s => s.type === 'timer').length
    const taskSessions = studySessions.filter(s => s.type === 'task').length
    
    return [
      { name: 'Timer Sessions', value: timerSessions, color: '#8b5cf6' },
      { name: 'Aufgaben erledigt', value: taskSessions, color: '#06d6a0' }
    ]
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-600'
      case 'rare': return 'text-blue-600'
      case 'epic': return 'text-purple-600'
      case 'legendary': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800'
      case 'rare': return 'bg-blue-100 text-blue-800'
      case 'epic': return 'bg-purple-100 text-purple-800'
      case 'legendary': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getGardenStats = () => {
    const totalValue = plantedFlowers.reduce((sum, pf) => {
      const flower = flowers.find(f => f.id === pf.flowerId)
      return sum + (flower ? flower.cost : 0)
    }, 0)
    
    const passiveIncome = plantedFlowers.reduce((sum, pf) => {
      const flower = flowers.find(f => f.id === pf.flowerId)
      if (!flower || pf.growth < 100) return sum
      return sum + flower.pointsPerHour * (1 + pf.healthBonus)
    }, 0)
    
    return { totalValue, passiveIncome }
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

        {/* Main Tabs */}
        <Tabs defaultValue="study" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="study" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Lernen
            </TabsTrigger>
            <TabsTrigger value="garden" className="flex items-center gap-2">
              <Flower className="w-4 h-4" />
              Garten
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <ChartBar className="w-4 h-4" />
              Statistiken
            </TabsTrigger>
          </TabsList>

          {/* Study Tab */}
          <TabsContent value="study" className="space-y-6">
            {/* Study Timer */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Lerntimer
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  ⏰ Erhalte 10 Punkte pro Stunde Lernzeit!
                </p>
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
                    {/* Points info */}
                    <div className="mt-2 text-xs text-muted-foreground">
                      💰 {Math.floor((parseInt(timerMinutes) / 60) * 10)} Punkte für diese Session
                    </div>
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
          </TabsContent>

          {/* Garden Tab */}
          <TabsContent value="garden" className="space-y-6">
            {/* Garden Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Flower className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{plantedFlowers.length}</p>
                      <p className="text-xs text-muted-foreground">Gepflanzte Blumen</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Trophy className="w-5 h-5 text-accent" />
                    <div>
                      <p className="text-2xl font-bold">{getGardenStats().totalValue}</p>
                      <p className="text-xs text-muted-foreground">Gartenwert</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <TrendUp className="w-5 h-5 text-secondary" />
                    <div>
                      <p className="text-2xl font-bold">{getGardenStats().passiveIncome.toFixed(1)}/h</p>
                      <p className="text-xs text-muted-foreground">Passive Punkte</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Daily Garden Care */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    💧 Garten gießen
                  </span>
                  <Button
                    onClick={waterGarden}
                    disabled={lastWateringDate === new Date().toISOString().split('T')[0]}
                    variant={lastWateringDate === new Date().toISOString().split('T')[0] ? "secondary" : "default"}
                  >
                    {lastWateringDate === new Date().toISOString().split('T')[0] ? '✓ Gegossen' : '💧 Gießen'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Gieße deinen Garten täglich für Bonus-Punkte! ({Math.floor(plantedFlowers.length * 0.5)} Punkte heute)
                </p>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🏆 Garten-Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {achievements.map(achievement => (
                    <div
                      key={achievement.id}
                      className={`p-3 border rounded-lg flex items-center gap-3 ${
                        achievement.unlocked 
                          ? 'bg-secondary/20 border-secondary' 
                          : 'bg-muted/30'
                      }`}
                    >
                      <div className="text-2xl">{achievement.emoji}</div>
                      <div className="flex-1">
                        <p className={`font-medium ${achievement.unlocked ? 'text-secondary' : 'text-foreground'}`}>
                          {achievement.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{achievement.description}</p>
                      </div>
                      <Badge variant={achievement.unlocked ? "secondary" : "outline"}>
                        +{achievement.reward}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Flower Shop */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Blumenladen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {flowers.map(flower => (
                    <div
                      key={flower.id}
                      className="flex flex-col items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      draggable
                      onDragStart={() => handleDragStart(flower)}
                    >
                      <div className={`text-4xl mb-2 ${flower.size === 'large' ? 'text-5xl' : flower.size === 'medium' ? 'text-4xl' : 'text-3xl'}`}>
                        {flower.emoji}
                      </div>
                      <span className="text-sm font-medium text-center mb-1">{flower.name}</span>
                      <Badge className={`text-xs mb-2 ${getRarityBadge(flower.rarity)}`}>
                        {flower.rarity}
                      </Badge>
                      <div className="text-xs text-muted-foreground mb-2 text-center">
                        🕒 {flower.growthTime}h | ⚡ {flower.pointsPerHour}/h
                      </div>
                      <Badge 
                        variant={totalPoints >= flower.cost ? "default" : "secondary"}
                        className="mb-2"
                      >
                        {flower.cost} Punkte
                      </Badge>
                      <Button
                        size="sm"
                        onClick={() => buyFlower(flower)}
                        disabled={totalPoints < flower.cost}
                        className="w-full"
                      >
                        Kaufen
                      </Button>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  💡 Ziehe Blumen per Drag & Drop in deinen Garten! • 🌟 Seltene Blumen haben bessere Boni • ✨ Kombiniere passende Blumen für Synergien
                </p>
              </CardContent>
            </Card>

            {/* Garden */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Flower className="w-5 h-5" />
                    Mein Garten
                  </CardTitle>
                  {plantedFlowers.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetGarden}
                      className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                    >
                      <Trash className="w-4 h-4 mr-2" />
                      Garten zurücksetzen
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div
                  className="relative w-full h-96 bg-gradient-to-b from-sky-200 to-green-300 rounded-lg border-2 border-dashed border-muted-foreground/30 overflow-hidden"
                  onDrop={handleGardenDrop}
                  onDragOver={handleDragOver}
                  style={{
                    backgroundImage: `
                      radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
                      radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.4) 0%, transparent 50%),
                      radial-gradient(circle at 40% 40%, rgba(120, 219, 226, 0.2) 0%, transparent 50%)
                    `
                  }}
                >
                  {/* Sun */}
                  <div className="absolute top-4 right-4 text-4xl">☀️</div>
                  
                  {/* Clouds */}
                  <div className="absolute top-6 left-8 text-2xl opacity-70">☁️</div>
                  <div className="absolute top-4 left-1/3 text-xl opacity-50">☁️</div>
                  
                  {/* Ground grass pattern */}
                  <div className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-green-400 to-transparent"></div>
                  
                  {/* Planted flowers */}
                  {plantedFlowers.map(plantedFlower => {
                    const flower = flowers.find(f => f.id === plantedFlower.flowerId)
                    if (!flower) return null
                    
                    return (
                      <div
                        key={plantedFlower.id}
                        className="absolute cursor-pointer hover:scale-110 transition-transform group"
                        style={{
                          left: `${plantedFlower.x}%`,
                          top: `${plantedFlower.y}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                        onClick={() => removeFlowerFromGarden(plantedFlower.id)}
                      >
                        {/* Growth indicator */}
                        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white"
                             style={{ 
                               backgroundColor: plantedFlower.growth < 100 ? '#fbbf24' : '#10b981'
                             }}
                        />
                        
                        {/* Combo bonus indicator */}
                        {plantedFlower.healthBonus > 0 && (
                          <div className="absolute -top-1 -left-1 text-xs">✨</div>
                        )}
                        
                        <div className={`${flower.size === 'large' ? 'text-4xl' : flower.size === 'medium' ? 'text-3xl' : 'text-2xl'}`}
                             style={{
                               filter: plantedFlower.growth < 100 ? 'grayscale(50%)' : 'none',
                               opacity: plantedFlower.growth < 30 ? 0.5 : 1
                             }}>
                          {flower.emoji}
                        </div>
                        
                        {/* Enhanced tooltip */}
                        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-3 py-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          <div className="font-medium">{flower.name}</div>
                          <div>Wachstum: {Math.floor(plantedFlower.growth)}%</div>
                          {plantedFlower.healthBonus > 0 && (
                            <div className="text-green-300">Bonus: +{(plantedFlower.healthBonus * 100).toFixed(0)}%</div>
                          )}
                          <div className="text-xs opacity-75">Klicken zum Entfernen</div>
                        </div>
                      </div>
                    )
                  })}
                  
                  {/* Empty state message */}
                  {plantedFlowers.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-white bg-black/50 p-6 rounded-lg">
                        <Flower className="w-12 h-12 mx-auto mb-2 opacity-70" />
                        <p className="text-lg font-medium mb-1">Dein Garten wartet auf dich!</p>
                        <p className="text-sm opacity-80">Ziehe Blumen hierher, um sie zu pflanzen</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {plantedFlowers.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-4 text-center">
                    🌸 Du hast {plantedFlowers.length} {plantedFlowers.length === 1 ? 'Blume' : 'Blumen'} in deinem Garten!
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="stats" className="space-y-6">
            {studySessions.length > 0 ? (
              <>
                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-2">
                        <Timer className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-2xl font-bold">{Math.floor(getWeeklyTotals().totalStudyTime / 60)}h {getWeeklyTotals().totalStudyTime % 60}m</p>
                          <p className="text-xs text-muted-foreground">Lernzeit (7 Tage)</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-secondary" />
                        <div>
                          <p className="text-2xl font-bold">{getWeeklyTotals().totalTasks}</p>
                          <p className="text-xs text-muted-foreground">Aufgaben erledigt</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-2">
                        <Trophy className="w-5 h-5 text-accent" />
                        <div>
                          <p className="text-2xl font-bold">{getWeeklyTotals().totalPoints}</p>
                          <p className="text-xs text-muted-foreground">Punkte erhalten</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-2">
                        <TrendUp className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-2xl font-bold">{getStudyStreaks().currentStreak}</p>
                          <p className="text-xs text-muted-foreground">Aktuelle Serie</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Daily Study Time Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Tägliche Lernzeit (7 Tage)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={{
                          studyTime: {
                            label: "Lernzeit (Min)",
                            color: "hsl(var(--primary))",
                          },
                        }}
                        className="h-[200px]"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={calculateDailyStats()}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis 
                              dataKey="date" 
                              stroke="hsl(var(--muted-foreground))"
                              fontSize={12}
                              tickFormatter={(value) => {
                                const date = new Date(value)
                                return date.toLocaleDateString('de-DE', { weekday: 'short' })
                              }}
                            />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <ChartTooltip 
                              content={<ChartTooltipContent />}
                              labelFormatter={(value) => {
                                const date = new Date(value)
                                return date.toLocaleDateString('de-DE', { 
                                  weekday: 'long',
                                  day: 'numeric',
                                  month: 'short' 
                                })
                              }}
                            />
                            <Bar 
                              dataKey="studyTime" 
                              fill="hsl(var(--primary))" 
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  {/* Points Progress Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="w-5 h-5" />
                        Punkte-Verlauf
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={{
                          pointsEarned: {
                            label: "Punkte",
                            color: "hsl(var(--accent))",
                          },
                        }}
                        className="h-[200px]"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={calculateDailyStats()}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis 
                              dataKey="date" 
                              stroke="hsl(var(--muted-foreground))"
                              fontSize={12}
                              tickFormatter={(value) => {
                                const date = new Date(value)
                                return date.toLocaleDateString('de-DE', { weekday: 'short' })
                              }}
                            />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <ChartTooltip 
                              content={<ChartTooltipContent />}
                              labelFormatter={(value) => {
                                const date = new Date(value)
                                return date.toLocaleDateString('de-DE', { 
                                  weekday: 'long',
                                  day: 'numeric',
                                  month: 'short' 
                                })
                              }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="pointsEarned" 
                              stroke="hsl(var(--accent))" 
                              strokeWidth={3}
                              dot={{ fill: "hsl(var(--accent))", strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6, stroke: "hsl(var(--accent))", strokeWidth: 2 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  {/* Activity Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ChartBar className="w-5 h-5" />
                        Aktivitäts-Verteilung
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={{
                          timerSessions: {
                            label: "Timer Sessions",
                            color: "#8b5cf6",
                          },
                          taskSessions: {
                            label: "Aufgaben erledigt", 
                            color: "#06d6a0",
                          },
                        }}
                        className="h-[200px]"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={getActivityDistribution()}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              dataKey="value"
                              label={({ name, value }) => `${name}: ${value}`}
                            >
                              {getActivityDistribution().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <ChartTooltip content={<ChartTooltipContent />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  {/* Study Streaks */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendUp className="w-5 h-5" />
                        Lern-Serien
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div>
                          <p className="text-sm text-muted-foreground">Aktuelle Serie</p>
                          <p className="text-2xl font-bold text-primary">{getStudyStreaks().currentStreak} Tage</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Längste Serie</p>
                          <p className="text-xl font-semibold text-accent">{getStudyStreaks().longestStreak} Tage</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Wochenübersicht</p>
                        <div className="flex gap-1">
                          {calculateDailyStats().map((day, index) => {
                            const hasActivity = day.studyTime > 0 || day.tasksCompleted > 0
                            const date = new Date(day.date)
                            return (
                              <div
                                key={day.date}
                                className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-medium transition-colors ${
                                  hasActivity 
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'bg-muted text-muted-foreground'
                                }`}
                                title={`${date.toLocaleDateString('de-DE', { weekday: 'short' })}: ${day.studyTime}min, ${day.tasksCompleted} Aufgaben`}
                              >
                                {date.getDate()}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Sessions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Letzte Lernsessions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {studySessions.slice(-10).reverse().map((session) => (
                        <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            {session.type === 'timer' ? (
                              <Timer className="w-4 h-4 text-primary" />
                            ) : (
                              <CheckCircle className="w-4 h-4 text-secondary" />
                            )}
                            <div>
                              <p className="font-medium">
                                {session.type === 'timer' 
                                  ? `${session.duration} Minuten Lernsession`
                                  : session.taskText || 'Aufgabe erledigt'
                                }
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(session.date).toLocaleDateString('de-DE', {
                                  weekday: 'long',
                                  day: 'numeric',
                                  month: 'short'
                                })}
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary">
                            +{session.points} Punkte
                          </Badge>
                        </div>
                      ))}
                      {studySessions.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">
                          Noch keine Lernsessions aufgezeichnet
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              /* Empty Stats State */
              <Card>
                <CardContent className="py-12 text-center space-y-4">
                  <ChartBar className="w-16 h-16 text-muted-foreground mx-auto" />
                  <h3 className="text-xl font-semibold text-foreground">
                    Noch keine Statistiken verfügbar
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Beginne mit dem Lernen oder erledige Aufgaben, um deine ersten Statistiken zu sehen!
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default App