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
  category: 'flowers' | 'fruits' | 'vegetables' | 'herbs' | 'trees'
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

interface WeatherCondition {
  id: string
  name: string
  emoji: string
  growthMultiplier: number
  pointsMultiplier: number
  duration: number // hours
  description: string
  rarity: 'common' | 'rare' | 'epic'
}

interface CurrentWeather {
  condition: WeatherCondition
  startTime: Date
  endTime: Date
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
  // Blumen
  { 
    id: 'daisy', name: 'Gänseblümchen', cost: 5, emoji: '🌼', color: '#ffffff', size: 'small',
    rarity: 'common', growthTime: 2, pointsPerHour: 0.5, comboBonus: ['tulip', 'sunflower'], category: 'flowers'
  },
  { 
    id: 'tulip', name: 'Tulpe', cost: 8, emoji: '🌷', color: '#ff69b4', size: 'medium',
    rarity: 'common', growthTime: 3, pointsPerHour: 0.8, comboBonus: ['daisy', 'rose'], category: 'flowers'
  },
  { 
    id: 'sunflower', name: 'Sonnenblume', cost: 12, emoji: '🌻', color: '#ffd700', size: 'large',
    rarity: 'common', growthTime: 4, pointsPerHour: 1.2, comboBonus: ['daisy'], category: 'flowers'
  },
  { 
    id: 'rose', name: 'Rose', cost: 15, emoji: '🌹', color: '#ff0000', size: 'medium',
    rarity: 'rare', growthTime: 6, pointsPerHour: 2, comboBonus: ['tulip', 'lotus'], category: 'flowers'
  },
  { 
    id: 'hibiscus', name: 'Hibiskus', cost: 20, emoji: '🌺', color: '#ff1493', size: 'large',
    rarity: 'rare', growthTime: 8, pointsPerHour: 2.5, comboBonus: ['orchid'], category: 'flowers'
  },
  { 
    id: 'cherry', name: 'Kirschblüte', cost: 25, emoji: '🌸', color: '#ffb6c1', size: 'medium',
    rarity: 'epic', growthTime: 12, pointsPerHour: 3, comboBonus: ['lotus', 'orchid'], category: 'flowers'
  },
  { 
    id: 'lotus', name: 'Lotus', cost: 30, emoji: '🪷', color: '#dda0dd', size: 'large',
    rarity: 'epic', growthTime: 16, pointsPerHour: 4, comboBonus: ['rose', 'cherry'], category: 'flowers'
  },
  { 
    id: 'orchid', name: 'Orchidee', cost: 40, emoji: '🌺', color: '#da70d6', size: 'large',
    rarity: 'legendary', growthTime: 24, pointsPerHour: 6, comboBonus: ['hibiscus', 'cherry'], category: 'flowers'
  },
  { 
    id: 'phoenix', name: 'Phoenix-Blume', cost: 100, emoji: '🔥', color: '#ff4500', size: 'large',
    rarity: 'legendary', growthTime: 48, pointsPerHour: 15, comboBonus: ['lotus', 'orchid'], category: 'flowers'
  },
  
  // Obst
  { 
    id: 'apple', name: 'Apfelbaum', cost: 18, emoji: '🍎', color: '#ff0000', size: 'large',
    rarity: 'common', growthTime: 8, pointsPerHour: 1.8, comboBonus: ['cherry_tree', 'pear'], category: 'trees'
  },
  { 
    id: 'cherry_tree', name: 'Kirschbaum', cost: 22, emoji: '🍒', color: '#dc143c', size: 'large',
    rarity: 'rare', growthTime: 10, pointsPerHour: 2.2, comboBonus: ['apple', 'peach'], category: 'trees'
  },
  { 
    id: 'pear', name: 'Birnenbaum', cost: 16, emoji: '🍐', color: '#90ee90', size: 'large',
    rarity: 'common', growthTime: 7, pointsPerHour: 1.6, comboBonus: ['apple', 'grape'], category: 'trees'
  },
  { 
    id: 'peach', name: 'Pfirsichbaum', cost: 25, emoji: '🍑', color: '#ffb347', size: 'large',
    rarity: 'rare', growthTime: 12, pointsPerHour: 2.8, comboBonus: ['cherry_tree', 'plum'], category: 'trees'
  },
  { 
    id: 'grape', name: 'Weinrebe', cost: 35, emoji: '🍇', color: '#800080', size: 'medium',
    rarity: 'epic', growthTime: 15, pointsPerHour: 4.5, comboBonus: ['pear', 'strawberry'], category: 'fruits'
  },
  { 
    id: 'strawberry', name: 'Erdbeeren', cost: 14, emoji: '🍓', color: '#ff1493', size: 'small',
    rarity: 'common', growthTime: 5, pointsPerHour: 1.4, comboBonus: ['grape', 'blueberry'], category: 'fruits'
  },
  { 
    id: 'blueberry', name: 'Heidelbeeren', cost: 19, emoji: '🫐', color: '#4169e1', size: 'small',
    rarity: 'rare', growthTime: 6, pointsPerHour: 2.1, comboBonus: ['strawberry', 'raspberry'], category: 'fruits'
  },
  { 
    id: 'raspberry', name: 'Himbeeren', cost: 17, emoji: '🍰', color: '#e30b5c', size: 'small',
    rarity: 'common', growthTime: 5, pointsPerHour: 1.7, comboBonus: ['blueberry', 'strawberry'], category: 'fruits'
  },
  { 
    id: 'mango', name: 'Mangobaum', cost: 45, emoji: '🥭', color: '#ffa500', size: 'large',
    rarity: 'epic', growthTime: 20, pointsPerHour: 5.5, comboBonus: ['coconut', 'pineapple'], category: 'trees'
  },
  { 
    id: 'coconut', name: 'Kokospalme', cost: 60, emoji: '🥥', color: '#8b4513', size: 'large',
    rarity: 'legendary', growthTime: 30, pointsPerHour: 8, comboBonus: ['mango', 'pineapple'], category: 'trees'
  },
  { 
    id: 'pineapple', name: 'Ananas', cost: 50, emoji: '🍍', color: '#ffd700', size: 'medium',
    rarity: 'epic', growthTime: 18, pointsPerHour: 6, comboBonus: ['mango', 'coconut'], category: 'fruits'
  },
  
  // Gemüse
  { 
    id: 'carrot', name: 'Karotten', cost: 10, emoji: '🥕', color: '#ff8c00', size: 'small',
    rarity: 'common', growthTime: 3, pointsPerHour: 1, comboBonus: ['potato', 'radish'], category: 'vegetables'
  },
  { 
    id: 'potato', name: 'Kartoffeln', cost: 12, emoji: '🥔', color: '#deb887', size: 'small',
    rarity: 'common', growthTime: 4, pointsPerHour: 1.2, comboBonus: ['carrot', 'onion'], category: 'vegetables'
  },
  { 
    id: 'tomato', name: 'Tomaten', cost: 15, emoji: '🍅', color: '#ff6347', size: 'medium',
    rarity: 'common', growthTime: 6, pointsPerHour: 1.8, comboBonus: ['bell_pepper', 'eggplant'], category: 'vegetables'
  },
  { 
    id: 'bell_pepper', name: 'Paprika', cost: 18, emoji: '🫑', color: '#32cd32', size: 'medium',
    rarity: 'rare', growthTime: 7, pointsPerHour: 2.2, comboBonus: ['tomato', 'chili'], category: 'vegetables'
  },
  { 
    id: 'eggplant', name: 'Aubergine', cost: 20, emoji: '🍆', color: '#800080', size: 'medium',
    rarity: 'rare', growthTime: 8, pointsPerHour: 2.5, comboBonus: ['tomato', 'zucchini'], category: 'vegetables'
  },
  { 
    id: 'corn', name: 'Mais', cost: 22, emoji: '🌽', color: '#ffd700', size: 'large',
    rarity: 'rare', growthTime: 9, pointsPerHour: 2.8, comboBonus: ['pumpkin', 'cucumber'], category: 'vegetables'
  },
  { 
    id: 'pumpkin', name: 'Kürbis', cost: 28, emoji: '🎃', color: '#ff8c00', size: 'large',
    rarity: 'epic', growthTime: 12, pointsPerHour: 3.5, comboBonus: ['corn', 'squash'], category: 'vegetables'
  },
  { 
    id: 'cucumber', name: 'Gurken', cost: 16, emoji: '🥒', color: '#90ee90', size: 'medium',
    rarity: 'common', growthTime: 5, pointsPerHour: 1.6, comboBonus: ['corn', 'zucchini'], category: 'vegetables'
  },
  { 
    id: 'zucchini', name: 'Zucchini', cost: 19, emoji: '🥒', color: '#228b22', size: 'medium',
    rarity: 'rare', growthTime: 6, pointsPerHour: 2.1, comboBonus: ['eggplant', 'cucumber'], category: 'vegetables'
  },
  { 
    id: 'lettuce', name: 'Salat', cost: 8, emoji: '🥬', color: '#90ee90', size: 'small',
    rarity: 'common', growthTime: 2, pointsPerHour: 0.8, comboBonus: ['spinach', 'cabbage'], category: 'vegetables'
  },
  { 
    id: 'spinach', name: 'Spinat', cost: 11, emoji: '🥬', color: '#006400', size: 'small',
    rarity: 'common', growthTime: 3, pointsPerHour: 1.1, comboBonus: ['lettuce', 'kale'], category: 'vegetables'
  },
  { 
    id: 'cabbage', name: 'Kohl', cost: 14, emoji: '🥬', color: '#90ee90', size: 'medium',
    rarity: 'common', growthTime: 5, pointsPerHour: 1.4, comboBonus: ['lettuce', 'broccoli'], category: 'vegetables'
  },
  { 
    id: 'broccoli', name: 'Brokkoli', cost: 17, emoji: '🥦', color: '#228b22', size: 'medium',
    rarity: 'rare', growthTime: 6, pointsPerHour: 2, comboBonus: ['cabbage', 'cauliflower'], category: 'vegetables'
  },
  { 
    id: 'cauliflower', name: 'Blumenkohl', cost: 19, emoji: '🥬', color: '#f5f5dc', size: 'medium',
    rarity: 'rare', growthTime: 7, pointsPerHour: 2.3, comboBonus: ['broccoli', 'radish'], category: 'vegetables'
  },
  { 
    id: 'radish', name: 'Rettich', cost: 9, emoji: '🥬', color: '#ff69b4', size: 'small',
    rarity: 'common', growthTime: 2, pointsPerHour: 0.9, comboBonus: ['carrot', 'cauliflower'], category: 'vegetables'
  },
  { 
    id: 'onion', name: 'Zwiebeln', cost: 13, emoji: '🧅', color: '#dda0dd', size: 'small',
    rarity: 'common', growthTime: 4, pointsPerHour: 1.3, comboBonus: ['potato', 'garlic'], category: 'vegetables'
  },
  { 
    id: 'garlic', name: 'Knoblauch', cost: 15, emoji: '🧄', color: '#f5f5dc', size: 'small',
    rarity: 'rare', growthTime: 5, pointsPerHour: 1.8, comboBonus: ['onion', 'herbs'], category: 'vegetables'
  },
  { 
    id: 'chili', name: 'Chili', cost: 24, emoji: '🌶️', color: '#ff0000', size: 'small',
    rarity: 'epic', growthTime: 8, pointsPerHour: 3.2, comboBonus: ['bell_pepper', 'herbs'], category: 'vegetables'
  },
  
  // Kräuter & Spezialitäten
  { 
    id: 'herbs', name: 'Kräutergarten', cost: 26, emoji: '🌿', color: '#90ee90', size: 'medium',
    rarity: 'epic', growthTime: 10, pointsPerHour: 3.8, comboBonus: ['garlic', 'chili'], category: 'herbs'
  },
  { 
    id: 'mushroom', name: 'Pilze', cost: 32, emoji: '🍄', color: '#8b4513', size: 'small',
    rarity: 'epic', growthTime: 14, pointsPerHour: 4.2, comboBonus: ['truffle', 'herbs'], category: 'herbs'
  },
  { 
    id: 'truffle', name: 'Trüffel', cost: 80, emoji: '🍄', color: '#2f4f4f', size: 'small',
    rarity: 'legendary', growthTime: 36, pointsPerHour: 12, comboBonus: ['mushroom', 'herbs'], category: 'herbs'
  },
  { 
    id: 'bamboo', name: 'Bambus', cost: 38, emoji: '🎋', color: '#90ee90', size: 'large',
    rarity: 'epic', growthTime: 16, pointsPerHour: 4.8, comboBonus: ['herbs', 'tea'], category: 'trees'
  },
  { 
    id: 'tea', name: 'Tee-Strauch', cost: 42, emoji: '🍃', color: '#90ee90', size: 'medium',
    rarity: 'epic', growthTime: 18, pointsPerHour: 5.2, comboBonus: ['bamboo', 'herbs'], category: 'herbs'
  },
  { 
    id: 'cactus', name: 'Kaktus', cost: 35, emoji: '🌵', color: '#90ee90', size: 'medium',
    rarity: 'epic', growthTime: 24, pointsPerHour: 4, comboBonus: [], category: 'herbs' // Kaktus ist unabhängig
  },
  { 
    id: 'bonsai', name: 'Bonsai-Baum', cost: 120, emoji: '🌳', color: '#228b22', size: 'small',
    rarity: 'legendary', growthTime: 72, pointsPerHour: 18, comboBonus: ['bamboo', 'tea'], category: 'trees'
  }
]

const gardenAchievements: GardenAchievement[] = [
  {
    id: 'first_flower',
    name: 'Erster Spross',
    description: 'Pflanze deine erste Pflanze',
    emoji: '🌱',
    requirement: { type: 'flowers_planted', count: 1 },
    reward: 5,
    unlocked: false
  },
  {
    id: 'flower_collector',
    name: 'Pflanzen-Sammler',
    description: 'Pflanze 10 verschiedene Pflanzen',
    emoji: '🌸',
    requirement: { type: 'flowers_planted', count: 10 },
    reward: 15,
    unlocked: false
  },
  {
    id: 'rare_gardener',
    name: 'Seltener Gärtner',
    description: 'Sammle 3 seltene oder bessere Pflanzen',
    emoji: '💎',
    requirement: { type: 'rare_flowers', count: 3 },
    reward: 25,
    unlocked: false
  },
  {
    id: 'combo_master',
    name: 'Combo-Meister',
    description: 'Erstelle 5 Pflanzen-Kombinationen',
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

const weatherConditions: WeatherCondition[] = [
  {
    id: 'sunny',
    name: 'Sonnenschein',
    emoji: '☀️',
    growthMultiplier: 1.5,
    pointsMultiplier: 1.2,
    duration: 8,
    description: 'Perfektes Wetter für Pflanzenwachstum!',
    rarity: 'common'
  },
  {
    id: 'cloudy',
    name: 'Bewölkt',
    emoji: '☁️',
    growthMultiplier: 1.0,
    pointsMultiplier: 1.0,
    duration: 6,
    description: 'Normales Wachstum bei bewölktem Himmel.',
    rarity: 'common'
  },
  {
    id: 'rainy',
    name: 'Regnerisch',
    emoji: '🌧️',
    growthMultiplier: 1.8,
    pointsMultiplier: 1.4,
    duration: 4,
    description: 'Regen beschleunigt das Wachstum erheblich!',
    rarity: 'rare'
  },
  {
    id: 'storm',
    name: 'Gewitter',
    emoji: '⛈️',
    growthMultiplier: 0.5,
    pointsMultiplier: 0.8,
    duration: 2,
    description: 'Sturm verlangsamt das Wachstum.',
    rarity: 'common'
  },
  {
    id: 'rainbow',
    name: 'Regenbogen',
    emoji: '🌈',
    growthMultiplier: 2.5,
    pointsMultiplier: 2.0,
    duration: 1,
    description: 'Magisches Wetter! Extremer Wachstumsbonus!',
    rarity: 'epic'
  },
  {
    id: 'snow',
    name: 'Schnee',
    emoji: '❄️',
    growthMultiplier: 0.3,
    pointsMultiplier: 0.7,
    duration: 12,
    description: 'Winterwetter verlangsamt das Wachstum stark.',
    rarity: 'rare'
  },
  {
    id: 'fog',
    name: 'Nebel',
    emoji: '🌫️',
    growthMultiplier: 0.8,
    pointsMultiplier: 0.9,
    duration: 4,
    description: 'Nebel reduziert das Wachstum leicht.',
    rarity: 'common'
  },
  {
    id: 'windy',
    name: 'Windig',
    emoji: '💨',
    growthMultiplier: 1.2,
    pointsMultiplier: 1.1,
    duration: 6,
    description: 'Wind hilft bei der Bestäubung!',
    rarity: 'common'
  },
  {
    id: 'aurora',
    name: 'Polarlicht',
    emoji: '🌌',
    growthMultiplier: 3.0,
    pointsMultiplier: 2.5,
    duration: 3,
    description: 'Mystisches Polarlicht verstärkt magische Energien!',
    rarity: 'epic'
  }
]

// Helper function to format time in mm:ss format
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

// Helper function to get weather-based visual filter
const getWeatherFilter = (weatherId: string): string => {
  switch (weatherId) {
    case 'sunny':
      return 'brightness(1.2) contrast(1.1)'
    case 'cloudy':
      return 'brightness(0.9) contrast(0.9)'
    case 'rainy':
      return 'brightness(0.8) saturate(1.2) hue-rotate(10deg)'
    case 'storm':
      return 'brightness(0.6) contrast(1.3) saturate(0.8)'
    case 'rainbow':
      return 'brightness(1.3) saturate(1.5) contrast(1.2)'
    case 'snow':
      return 'brightness(1.1) saturate(0.7) hue-rotate(-10deg)'
    case 'fog':
      return 'brightness(0.7) contrast(0.8) blur(1px)'
    case 'windy':
      return 'brightness(1.1) contrast(1.1)'
    case 'aurora':
      return 'brightness(1.2) saturate(1.4) hue-rotate(90deg)'
    default:
      return 'none'
  }
}

// Helper function to ensure currentWeather has proper Date objects
const normalizeWeather = (weather: CurrentWeather | null): CurrentWeather | null => {
  if (!weather) return null
  return {
    ...weather,
    startTime: new Date(weather.startTime),
    endTime: new Date(weather.endTime)
  }
}

function App() {
  const [newTodoText, setNewTodoText] = useState('')
  const [newTodoPoints, setNewTodoPoints] = useState('1')
  const [todos, setTodos] = useKV<Todo[]>('study-todos', [])
  const [totalPoints, setTotalPoints] = useKV<number>('study-total-points', 0)
  const [plantedFlowers, setPlantedFlowers] = useKV<PlantedFlower[]>('garden-flowers', [])
  const [studySessions, setStudySessions] = useKV<StudySession[]>('study-sessions', [])
  const [achievements, setAchievements] = useKV<GardenAchievement[]>('garden-achievements', gardenAchievements)
  const [lastWateringDate, setLastWateringDate] = useKV<string>('last-watering-date', '')
  const [currentWeather, setCurrentWeather] = useKV<CurrentWeather | null>('current-weather', null)
  const [draggedFlower, setDraggedFlower] = useState<Flower | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  
  // Gardener state
  const [gardenerPosition, setGardenerPosition] = useState({ x: 50, y: 80 })
  const [gardenerDirection, setGardenerDirection] = useState(1) // 1 for right, -1 for left
  
  // Timer state
  const [timerMinutes, setTimerMinutes] = useState('25')
  const [timeLeft, setTimeLeft] = useState(0) // in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [isTimerPaused, setIsTimerPaused] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  // Weather system
  const generateRandomWeather = (): CurrentWeather => {
    const rarityRoll = Math.random()
    let availableWeather: WeatherCondition[]
    
    if (rarityRoll < 0.05) { // 5% chance for epic weather
      availableWeather = weatherConditions.filter(w => w.rarity === 'epic')
    } else if (rarityRoll < 0.25) { // 20% chance for rare weather
      availableWeather = weatherConditions.filter(w => w.rarity === 'rare')
    } else { // 75% chance for common weather
      availableWeather = weatherConditions.filter(w => w.rarity === 'common')
    }
    
    const randomCondition = availableWeather[Math.floor(Math.random() * availableWeather.length)]
    const startTime = new Date()
    const endTime = new Date(startTime.getTime() + randomCondition.duration * 60 * 60 * 1000)
    
    return {
      condition: randomCondition,
      startTime,
      endTime
    }
  }

  const updateWeather = () => {
    const now = new Date()
    
    // Ensure endTime is a Date object
    const normalizedWeather = normalizeWeather(currentWeather)
    
    if (!normalizedWeather || now >= normalizedWeather.endTime) {
      const newWeather = generateRandomWeather()
      setCurrentWeather(newWeather)
      
      toast.success(`Wetteränderung! ${newWeather.condition.emoji}`, {
        description: `${newWeather.condition.name}: ${newWeather.condition.description}`,
        duration: 4000,
      })
    }
  }

  // Check weather updates every 30 seconds
  useEffect(() => {
    updateWeather() // Initial weather check
    const interval = setInterval(updateWeather, 30000)
    return () => clearInterval(interval)
  }, [currentWeather])
  useEffect(() => {
    const interval = setInterval(() => {
      setGardenerPosition(prev => {
        let newX = prev.x + (gardenerDirection * 0.5)
        let newDirection = gardenerDirection
        
        // Bounce off walls
        if (newX >= 95) {
          newX = 95
          newDirection = -1
          setGardenerDirection(-1)
        } else if (newX <= 5) {
          newX = 5
          newDirection = 1
          setGardenerDirection(1)
        }
        
        // Random Y movement
        const newY = Math.max(75, Math.min(90, prev.y + (Math.random() - 0.5) * 2))
        
        return { x: newX, y: newY }
      })
    }, 100) // Update every 100ms for smooth animation
    
    return () => clearInterval(interval)
  }, [gardenerDirection])

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
        setTotalPoints(current => (current || 0) + pointsEarned)
      }
      
      // Record study session
      const newSession: StudySession = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        duration: studyTimeInMinutes,
        points: pointsEarned,
        type: 'timer'
      }
      setStudySessions(current => [...(current || []), newSession])
      
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
        setTotalPoints(current => (current || 0) + pointsEarned)
        
        // Record partial study session
        const newSession: StudySession = {
          id: Date.now().toString(),
          date: new Date().toISOString().split('T')[0],
          duration: studiedMinutes,
          points: pointsEarned,
          type: 'timer'
        }
        setStudySessions(current => [...(current || []), newSession])
        
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

  // Passive point generation from garden with weather effects
  useEffect(() => {
    const interval = setInterval(() => {
      let passivePoints = 0
      const now = new Date()
      
      // Get current weather multiplier with proper date handling
      const normalizedWeather = normalizeWeather(currentWeather)
      const weatherMultiplier = normalizedWeather && now < normalizedWeather.endTime
        ? normalizedWeather.condition.pointsMultiplier 
        : 1.0
      
      setPlantedFlowers(currentFlowers => {
        if (!currentFlowers) return []
        return currentFlowers.map(plantedFlower => {
          const flower = flowers.find(f => f.id === plantedFlower.flowerId)
          if (!flower) return plantedFlower
          
          // Calculate growth over time with weather effects
          const hoursPlanted = (now.getTime() - new Date(plantedFlower.plantedAt).getTime()) / (1000 * 60 * 60)
          const weatherGrowthMultiplier = normalizedWeather && now < normalizedWeather.endTime
            ? normalizedWeather.condition.growthMultiplier 
            : 1.0
          const adjustedGrowthTime = flower.growthTime / weatherGrowthMultiplier
          const newGrowth = Math.min(100, (hoursPlanted / adjustedGrowthTime) * 100)
          
          // Calculate combo bonus
          const nearbyFlowers = (currentFlowers || []).filter(other => {
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
          
          // Generate passive points if fully grown with weather bonus
          if (newGrowth >= 100) {
            const basePoints = flower.pointsPerHour / 60 // per minute
            const totalPoints = basePoints * (1 + comboBonus) * weatherMultiplier
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
        setTotalPoints(current => (current || 0) + Math.floor(passivePoints * 10) / 10)
      }
    }, 60000) // Every minute
    
    return () => clearInterval(interval)
  }, [setPlantedFlowers, setTotalPoints, currentWeather])

  const waterGarden = () => {
    const today = new Date().toISOString().split('T')[0]
    if (lastWateringDate === today) {
      toast.error('Garten bereits heute gegossen! 💧')
      return
    }
    
    setLastWateringDate(today)
    const wateringBonus = Math.floor((plantedFlowers || []).length * 0.5)
    setTotalPoints(current => (current || 0) + wateringBonus)
    
    toast.success('Garten gegossen! 🌿', {
      description: `+${wateringBonus} Punkte für die Pflege deines Gartens!`,
      duration: 3000,
    })
  }

  const checkAchievements = () => {
    setAchievements(currentAchievements => {
      if (!currentAchievements) return gardenAchievements // fallback to default
      return currentAchievements.map(achievement => {
        if (achievement.unlocked) return achievement
        
        let shouldUnlock = false
        
        switch (achievement.requirement.type) {
          case 'flowers_planted':
            shouldUnlock = (plantedFlowers || []).length >= achievement.requirement.count
            break
          case 'rare_flowers':
            const rareCount = (plantedFlowers || []).filter(pf => {
              const flower = flowers.find(f => f.id === pf.flowerId)
              return flower && ['rare', 'epic', 'legendary'].includes(flower.rarity)
            }).length
            shouldUnlock = rareCount >= achievement.requirement.count
            break
          case 'combo_bonus':
            const combos = (plantedFlowers || []).filter(pf => pf.healthBonus > 0).length
            shouldUnlock = combos >= achievement.requirement.count
            break
          case 'garden_value':
            const gardenValue = (plantedFlowers || []).reduce((sum, pf) => {
              const flower = flowers.find(f => f.id === pf.flowerId)
              return sum + (flower ? flower.cost : 0)
            }, 0)
            shouldUnlock = gardenValue >= achievement.requirement.count
            break
        }
        
        if (shouldUnlock) {
          setTotalPoints(current => (current || 0) + achievement.reward)
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

    setTodos(currentTodos => [...(currentTodos || []), newTodo])
    setNewTodoText('')
    setNewTodoPoints('1')
  }

  const completeTodo = (todoId: number) => {
    setTodos(currentTodos => {
      if (!currentTodos) return []
      const updatedTodos = currentTodos.map(todo => {
        if (todo.id === todoId && !todo.completed) {
          // Add points when completing the task
          setTotalPoints(currentPoints => (currentPoints || 0) + todo.points)
          
          // Record task completion session
          const newSession: StudySession = {
            id: Date.now().toString(),
            date: new Date().toISOString().split('T')[0],
            duration: 0, // Tasks don't have duration
            points: todo.points,
            type: 'task',
            taskText: todo.text
          }
          setStudySessions(current => [...(current || []), newSession])
          
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
    setTodos(currentTodos => (currentTodos || []).filter(todo => todo.id !== todoId))
  }

  const buyPlant = (plant: Flower) => {
    if ((totalPoints || 0) >= plant.cost) {
      setTotalPoints(current => (current || 0) - plant.cost)
      toast.success(`${plant.name} gekauft! 🌱`, {
        description: `Du kannst es jetzt in deinen Garten pflanzen!`,
        duration: 3000,
      })
    } else {
      toast.error('Nicht genug Punkte!', {
        description: `Du brauchst ${plant.cost - (totalPoints || 0)} weitere Punkte.`,
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

    if ((totalPoints || 0) < draggedFlower.cost) {
      toast.error('Nicht genug Punkte für diese Pflanze!')
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

    setPlantedFlowers(current => [...(current || []), newPlantedFlower])
    setTotalPoints(current => (current || 0) - draggedFlower.cost)
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
    setPlantedFlowers(current => (current || []).filter(flower => flower.id !== plantedFlowerId))
  }

  const resetGarden = () => {
    setPlantedFlowers([])
    toast.success('Garten zurückgesetzt! 🌱', {
      description: 'Dein Garten ist jetzt bereit für neue Pflanzen!',
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
    ;(studySessions || []).forEach(session => {
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
    const timerSessions = (studySessions || []).filter(s => s.type === 'timer').length
    const taskSessions = (studySessions || []).filter(s => s.type === 'task').length
    
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
    const totalValue = (plantedFlowers || []).reduce((sum, pf) => {
      const flower = flowers.find(f => f.id === pf.flowerId)
      return sum + (flower ? flower.cost : 0)
    }, 0)
    
    // Calculate passive income with current weather effects
    const now = new Date()
    const normalizedWeather = normalizeWeather(currentWeather)
    const weatherMultiplier = normalizedWeather && now < normalizedWeather.endTime
      ? normalizedWeather.condition.pointsMultiplier 
      : 1.0
    
    const passiveIncome = (plantedFlowers || []).reduce((sum, pf) => {
      const flower = flowers.find(f => f.id === pf.flowerId)
      if (!flower || pf.growth < 100) return sum
      return sum + flower.pointsPerHour * (1 + pf.healthBonus) * weatherMultiplier
    }, 0)
    
    return { totalValue, passiveIncome }
  }

  // Category filter utilities
  const getFilteredFlowers = () => {
    if (selectedCategory === 'all') return flowers
    return flowers.filter(flower => flower.category === selectedCategory)
  }

  const getCategoryStats = () => {
    const categories = ['flowers', 'fruits', 'vegetables', 'herbs', 'trees'] as const
    return categories.map(category => ({
      id: category,
      name: category === 'flowers' ? 'Blumen' :
            category === 'fruits' ? 'Obst' :
            category === 'vegetables' ? 'Gemüse' :
            category === 'herbs' ? 'Kräuter' :
            'Bäume',
      emoji: category === 'flowers' ? '🌸' :
             category === 'fruits' ? '🍎' :
             category === 'vegetables' ? '🥕' :
             category === 'herbs' ? '🌿' :
             '🌳',
      count: flowers.filter(f => f.category === category).length
    }))
  }

  const pendingTodos = (todos || []).filter(todo => !todo.completed)
  const completedTodos = (todos || []).filter(todo => todo.completed)
  
  // Normalize weather data for consistent usage
  const normalizedCurrentWeather = normalizeWeather(currentWeather)

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
              <span className="text-3xl font-bold text-primary">{totalPoints || 0}</span>
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
            {(todos || []).length === 0 && (
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
            {/* Current Weather Display - Full Width */}
            {normalizedCurrentWeather && (
              <Card className="border-2 border-accent/50 bg-accent/10">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="text-2xl">{normalizedCurrentWeather.condition.emoji}</span>
                      <span>Aktuelles Wetter: {normalizedCurrentWeather.condition.name}</span>
                    </span>
                    <div className="text-right text-sm">
                      <div className="text-muted-foreground">
                        Noch {Math.ceil((normalizedCurrentWeather.endTime.getTime() - new Date().getTime()) / (1000 * 60 * 60))}h
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newWeather = generateRandomWeather()
                          setCurrentWeather(newWeather)
                          toast.success(`Wetter geändert! ${newWeather.condition.emoji}`, {
                            description: `${newWeather.condition.name}: ${newWeather.condition.description}`,
                            duration: 3000,
                          })
                        }}
                        className="mt-1"
                      >
                        🔄 Wetter ändern
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Beschreibung</p>
                      <p className="font-medium">{normalizedCurrentWeather.condition.description}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Wachstums-Effekt</p>
                      <p className={`font-bold ${normalizedCurrentWeather.condition.growthMultiplier > 1 ? 'text-green-600' : normalizedCurrentWeather.condition.growthMultiplier < 1 ? 'text-red-600' : 'text-gray-600'}`}>
                        {normalizedCurrentWeather.condition.growthMultiplier > 1 ? '+' : ''}
                        {((normalizedCurrentWeather.condition.growthMultiplier - 1) * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Punkte-Effekt</p>
                      <p className={`font-bold ${normalizedCurrentWeather.condition.pointsMultiplier > 1 ? 'text-green-600' : normalizedCurrentWeather.condition.pointsMultiplier < 1 ? 'text-red-600' : 'text-gray-600'}`}>
                        {normalizedCurrentWeather.condition.pointsMultiplier > 1 ? '+' : ''}
                        {((normalizedCurrentWeather.condition.pointsMultiplier - 1) * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                  
                  {/* Weather Rarity Indicator */}
                  <div className="mt-4 flex items-center justify-center">
                    <Badge 
                      variant="outline" 
                      className={`${
                        normalizedCurrentWeather.condition.rarity === 'epic' ? 'border-purple-500 text-purple-600' :
                        normalizedCurrentWeather.condition.rarity === 'rare' ? 'border-blue-500 text-blue-600' :
                        'border-gray-500 text-gray-600'
                      }`}
                    >
                      {normalizedCurrentWeather.condition.rarity === 'epic' ? '⭐ Episch' :
                       normalizedCurrentWeather.condition.rarity === 'rare' ? '💎 Selten' :
                       '🌿 Normal'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Main Garden Layout - Split into two columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[900px]">
              
              {/* Left Column - Fixed Garden View */}
              <div className="lg:order-2">
                <Card className="h-full">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Flower className="w-5 h-5" />
                        Mein Garten
                      </CardTitle>
                      {(plantedFlowers || []).length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={resetGarden}
                          className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                        >
                          <Trash className="w-4 h-4 mr-2" />
                          Reset
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="h-full pb-6">
                    <div
                      className="relative w-full h-full min-h-[600px] bg-gradient-to-b from-sky-200 to-green-300 rounded-lg border-2 border-dashed border-muted-foreground/30 overflow-hidden"
                      onDrop={handleGardenDrop}
                      onDragOver={handleDragOver}
                      style={{
                        backgroundImage: `
                          radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
                          radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.4) 0%, transparent 50%),
                          radial-gradient(circle at 40% 40%, rgba(120, 219, 226, 0.2) 0%, transparent 50%)
                        `,
                        filter: normalizedCurrentWeather ? getWeatherFilter(normalizedCurrentWeather.condition.id) : 'none'
                      }}
                    >
                      {/* Weather Effects Overlay */}
                      {normalizedCurrentWeather && (
                        <div className="absolute inset-0 pointer-events-none">
                          {normalizedCurrentWeather.condition.id === 'rainy' && (
                            <div className="absolute inset-0 bg-gradient-to-b from-blue-200/30 to-transparent animate-pulse">
                              <div className="absolute top-2 left-4 text-blue-400 animate-bounce">💧</div>
                              <div className="absolute top-8 left-12 text-blue-400 animate-bounce delay-200">💧</div>
                              <div className="absolute top-6 left-20 text-blue-400 animate-bounce delay-500">💧</div>
                              <div className="absolute top-10 left-32 text-blue-400 animate-bounce delay-300">💧</div>
                            </div>
                          )}
                          {normalizedCurrentWeather.condition.id === 'snow' && (
                            <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent">
                              <div className="absolute top-4 left-8 text-white animate-bounce">❄️</div>
                              <div className="absolute top-12 left-16 text-white animate-bounce delay-300">❄️</div>
                              <div className="absolute top-8 left-24 text-white animate-bounce delay-600">❄️</div>
                            </div>
                          )}
                          {normalizedCurrentWeather.condition.id === 'storm' && (
                            <div className="absolute inset-0 bg-gradient-to-b from-gray-400/30 to-transparent animate-pulse">
                              <div className="absolute top-6 left-16 text-yellow-300 animate-ping">⚡</div>
                              <div className="absolute top-10 left-28 text-yellow-300 animate-ping delay-500">⚡</div>
                            </div>
                          )}
                          {normalizedCurrentWeather.condition.id === 'rainbow' && (
                            <div className="absolute inset-0 bg-gradient-to-r from-red-200/20 via-yellow-200/20 via-green-200/20 via-blue-200/20 to-purple-200/20 animate-pulse">
                              <div className="absolute top-4 right-8 text-2xl animate-bounce">🌈</div>
                            </div>
                          )}
                          {normalizedCurrentWeather.condition.id === 'aurora' && (
                            <div className="absolute inset-0 bg-gradient-to-b from-purple-300/30 via-green-300/20 to-transparent animate-pulse">
                              <div className="absolute top-2 left-1/2 text-purple-400 animate-ping">✨</div>
                              <div className="absolute top-8 left-1/3 text-green-400 animate-ping delay-300">✨</div>
                              <div className="absolute top-6 right-1/3 text-blue-400 animate-ping delay-600">✨</div>
                            </div>
                          )}
                          {normalizedCurrentWeather.condition.id === 'windy' && (
                            <div className="absolute inset-0">
                              <div className="absolute top-8 left-8 text-gray-400 animate-bounce">💨</div>
                              <div className="absolute top-12 left-20 text-gray-400 animate-bounce delay-200">💨</div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Sun */}
                      <div className={`absolute top-4 right-4 text-4xl transition-all duration-1000 ${
                        normalizedCurrentWeather?.condition.id === 'sunny' ? 'animate-pulse scale-110' : 
                        normalizedCurrentWeather?.condition.id === 'cloudy' || normalizedCurrentWeather?.condition.id === 'fog' ? 'opacity-50' :
                        normalizedCurrentWeather?.condition.id === 'rainy' || normalizedCurrentWeather?.condition.id === 'storm' || normalizedCurrentWeather?.condition.id === 'snow' ? 'opacity-30' : ''
                      }`}>☀️</div>
                      
                      {/* Clouds */}
                      <div className={`absolute top-6 left-8 text-2xl transition-all duration-1000 ${
                        normalizedCurrentWeather?.condition.id === 'cloudy' || normalizedCurrentWeather?.condition.id === 'fog' ? 'opacity-100 scale-110' : 
                        normalizedCurrentWeather?.condition.id === 'sunny' ? 'opacity-30' : 'opacity-70'
                      }`}>☁️</div>
                      <div className={`absolute top-4 left-1/3 text-xl transition-all duration-1000 ${
                        normalizedCurrentWeather?.condition.id === 'cloudy' || normalizedCurrentWeather?.condition.id === 'fog' ? 'opacity-80 scale-105' : 
                        normalizedCurrentWeather?.condition.id === 'sunny' ? 'opacity-20' : 'opacity-50'
                      }`}>☁️</div>
                      
                      {/* Ground grass pattern */}
                      <div className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-green-400 to-transparent"></div>
                      
                      {/* Planted flowers */}
                      {(plantedFlowers || []).map(plantedFlower => {
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
                            
                            {/* Enhanced tooltip with weather effects */}
                            <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-3 py-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                              <div className="font-medium">{flower.name}</div>
                              <div>Wachstum: {Math.floor(plantedFlower.growth)}%</div>
                              {plantedFlower.healthBonus > 0 && (
                                <div className="text-green-300">Kombo-Bonus: +{(plantedFlower.healthBonus * 100).toFixed(0)}%</div>
                              )}
                              {normalizedCurrentWeather && new Date() < normalizedCurrentWeather.endTime && (
                                <div className="text-blue-300">
                                  Wetter-Bonus: {normalizedCurrentWeather.condition.growthMultiplier > 1 ? '+' : ''}
                                  {((normalizedCurrentWeather.condition.growthMultiplier - 1) * 100).toFixed(0)}% Wachstum
                                </div>
                              )}
                              <div className="text-xs opacity-75">Klicken zum Entfernen</div>
                            </div>
                          </div>
                        )
                      })}
                      
                      {/* Walking Gardener */}
                      <div
                        className="absolute transition-all duration-100 ease-linear z-20"
                        style={{
                          left: `${gardenerPosition.x}%`,
                          top: `${gardenerPosition.y}%`,
                          transform: `translate(-50%, -50%) scaleX(${gardenerDirection})`,
                        }}
                      >
                        <div className="text-2xl hover:scale-110 transition-transform cursor-pointer"
                             title="Die fleißige Gärtnerin kümmert sich um deinen Garten! 👩‍🌾">
                          👩‍🌾
                        </div>
                        {/* Gardener's shadow */}
                        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-4 h-2 bg-black/20 rounded-full"></div>
                      </div>
                      
                      {/* Empty state message */}
                      {(plantedFlowers || []).length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center text-white bg-black/50 p-6 rounded-lg">
                            <Flower className="w-12 h-12 mx-auto mb-2 opacity-70" />
                            <p className="text-lg font-medium mb-1">Dein Garten wartet auf dich!</p>
                            <p className="text-sm opacity-80">Ziehe Pflanzen hierher, um sie zu pflanzen</p>
                            <p className="text-xs opacity-60 mt-1">
                              Die Gärtnerin hilft beim Pflegen! 👩‍🌾
                              {normalizedCurrentWeather && (
                                <span className="block mt-1">
                                  Aktuelles Wetter: {normalizedCurrentWeather.condition.name} {normalizedCurrentWeather.condition.emoji}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {(plantedFlowers || []).length > 0 && (
                      <p className="text-xs text-muted-foreground mt-3 text-center">
                        🌱 Du hast {(plantedFlowers || []).length} {(plantedFlowers || []).length === 1 ? 'Pflanze' : 'Pflanzen'} in deinem Garten! 
                        Die Gärtnerin kümmert sich um sie. 👩‍🌾
                        {normalizedCurrentWeather && new Date() < normalizedCurrentWeather.endTime && (
                          <span className="block mt-1">
                            🌤️ Aktuell: {normalizedCurrentWeather.condition.name} {normalizedCurrentWeather.condition.emoji} 
                            (Wachstum: {normalizedCurrentWeather.condition.growthMultiplier > 1 ? '+' : ''}
                            {((normalizedCurrentWeather.condition.growthMultiplier - 1) * 100).toFixed(0)}%)
                          </span>
                        )}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {/* Right Column - Scrollable Shop & Controls */}
              <div className="space-y-4 overflow-y-auto pr-2 lg:order-1" style={{ maxHeight: '900px' }}>
                
                {/* Garden Stats */}
                <div className="grid grid-cols-1 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-2">
                        <Flower className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-xl font-bold">{(plantedFlowers || []).length}</p>
                          <p className="text-xs text-muted-foreground">Gepflanzte Pflanzen</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-2">
                        <Trophy className="w-5 h-5 text-accent" />
                        <div>
                          <p className="text-xl font-bold">{getGardenStats().totalValue}</p>
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
                          <p className="text-xl font-bold flex items-center gap-1">
                            {getGardenStats().passiveIncome.toFixed(1)}/h
                            {normalizedCurrentWeather && new Date() < normalizedCurrentWeather.endTime && normalizedCurrentWeather.condition.pointsMultiplier !== 1.0 && (
                              <span className={`text-xs ${normalizedCurrentWeather.condition.pointsMultiplier > 1 ? 'text-green-600' : 'text-red-600'}`}>
                                {normalizedCurrentWeather.condition.emoji}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Passive Punkte
                            {normalizedCurrentWeather && new Date() < normalizedCurrentWeather.endTime && normalizedCurrentWeather.condition.pointsMultiplier !== 1.0 && (
                              <span className={`ml-1 ${normalizedCurrentWeather.condition.pointsMultiplier > 1 ? 'text-green-600' : 'text-red-600'}`}>
                                ({normalizedCurrentWeather.condition.pointsMultiplier > 1 ? '+' : ''}
                                {((normalizedCurrentWeather.condition.pointsMultiplier - 1) * 100).toFixed(0)}%)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Weather Forecast - Compact */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      🌤️ Wettervorhersage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2">
                      {weatherConditions.slice(0, 6).map((condition, index) => (
                        <div 
                          key={condition.id}
                          className={`text-center p-2 rounded border transition-all cursor-pointer hover:bg-muted/50 ${
                            normalizedCurrentWeather?.condition.id === condition.id ? 'border-accent bg-accent/20' : 'border-muted'
                          }`}
                          onClick={() => {
                            const newWeather: CurrentWeather = {
                              condition,
                              startTime: new Date(),
                              endTime: new Date(Date.now() + condition.duration * 60 * 60 * 1000)
                            }
                            setCurrentWeather(newWeather)
                            toast.success(`Wetter manuell geändert! ${condition.emoji}`, {
                              description: `${condition.name}: ${condition.description}`,
                              duration: 3000,
                            })
                          }}
                        >
                          <div className="text-xl mb-1">{condition.emoji}</div>
                          <div className="text-xs font-medium mb-1">{condition.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {condition.duration}h
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      💡 Klicke auf ein Wetter-Symbol!
                    </p>
                  </CardContent>
                </Card>

                {/* Garden Care */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center justify-between text-lg">
                      <span className="flex items-center gap-2">
                        💧 Garten gießen
                      </span>
                      <Button
                        onClick={waterGarden}
                        disabled={lastWateringDate === new Date().toISOString().split('T')[0]}
                        variant={lastWateringDate === new Date().toISOString().split('T')[0] ? "secondary" : "default"}
                        size="sm"
                      >
                        {lastWateringDate === new Date().toISOString().split('T')[0] ? '✓ Gegossen' : '💧 Gießen'}
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground text-center">
                      Gieße täglich für Bonus-Punkte! ({Math.floor((plantedFlowers || []).length * 0.5)} Punkte heute)
                    </p>
                  </CardContent>
                </Card>

                {/* Achievements - Compact */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      🏆 Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(achievements || []).map(achievement => (
                        <div
                          key={achievement.id}
                          className={`p-2 border rounded-lg flex items-center gap-2 ${
                            achievement.unlocked 
                              ? 'bg-secondary/20 border-secondary' 
                              : 'bg-muted/30'
                          }`}
                        >
                          <div className="text-lg">{achievement.emoji}</div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${achievement.unlocked ? 'text-secondary' : 'text-foreground'}`}>
                              {achievement.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{achievement.description}</p>
                          </div>
                          <Badge variant={achievement.unlocked ? "secondary" : "outline"} className="text-xs">
                            +{achievement.reward}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Garden Shop */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <ShoppingCart className="w-5 h-5" />
                      Garten-Shop
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Category Filter Tabs */}
                    <div className="mb-6">
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Button
                          variant={selectedCategory === 'all' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedCategory('all')}
                          className="text-xs"
                        >
                          🌱 Alle ({flowers.length})
                        </Button>
                        {getCategoryStats().map(category => (
                          <Button
                            key={category.id}
                            variant={selectedCategory === category.id ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedCategory(category.id)}
                            className="text-xs"
                          >
                            {category.emoji} {category.name} ({category.count})
                          </Button>
                        ))}
                      </div>
                      
                      {/* Category Description */}
                      <div className="text-xs text-muted-foreground text-center p-2 bg-muted/30 rounded">
                        {selectedCategory === 'all' && "🌱 Alle verfügbaren Pflanzen im Shop"}
                        {selectedCategory === 'flowers' && "🌸 Wunderschöne Blumen für einen farbenfrohen Garten"}
                        {selectedCategory === 'fruits' && "🍎 Süße Früchte für leckere Erträge"}
                        {selectedCategory === 'vegetables' && "🥕 Gesundes Gemüse für den täglichen Bedarf"}
                        {selectedCategory === 'herbs' && "🌿 Aromatische Kräuter und besondere Pflanzen"}
                        {selectedCategory === 'trees' && "🌳 Majestätische Bäume für langfristige Investitionen"}
                      </div>
                    </div>

                    {/* Plant Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
                      {getFilteredFlowers().map(flower => (
                        <div
                          key={flower.id}
                          className="flex flex-col items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                          draggable
                          onDragStart={() => handleDragStart(flower)}
                        >
                          <div className={`mb-2 ${flower.size === 'large' ? 'text-3xl' : flower.size === 'medium' ? 'text-2xl' : 'text-xl'}`}>
                            {flower.emoji}
                          </div>
                          <span className="text-sm font-medium text-center mb-2 leading-tight">{flower.name}</span>
                          
                          {/* Rarity and Category Badges */}
                          <div className="flex gap-1 mb-2">
                            <Badge className={`text-xs ${getRarityBadge(flower.rarity)}`}>
                              {flower.rarity}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {flower.category === 'flowers' ? '🌸' :
                               flower.category === 'fruits' ? '🍎' :
                               flower.category === 'vegetables' ? '🥕' :
                               flower.category === 'herbs' ? '🌿' :
                               '🌳'}
                            </Badge>
                          </div>
                          
                          <div className="text-xs text-muted-foreground mb-2 text-center">
                            🕒 {flower.growthTime}h | ⚡ {flower.pointsPerHour}/h
                          </div>
                          
                          {/* Combo Bonus Info */}
                          {flower.comboBonus && flower.comboBonus.length > 0 && (
                            <div className="text-xs text-blue-600 mb-2 text-center">
                              ✨ Kombo-Bonus möglich
                            </div>
                          )}
                          
                          <Badge 
                            variant={totalPoints && totalPoints >= flower.cost ? "default" : "secondary"}
                            className="mb-2 text-xs"
                          >
                            {flower.cost} P
                          </Badge>
                          <Button
                            size="sm"
                            onClick={() => buyPlant(flower)}
                            disabled={!totalPoints || totalPoints < flower.cost}
                            className="w-full text-xs py-2 h-auto"
                          >
                            Kaufen
                          </Button>
                        </div>
                      ))}
                    </div>
                    
                    {/* Empty Category State */}
                    {getFilteredFlowers().length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Keine Pflanzen in dieser Kategorie verfügbar</p>
                      </div>
                    )}
                    
                    <div className="mt-4 space-y-2">
                      <p className="text-xs text-muted-foreground text-center">
                        💡 Ziehe Pflanzen per Drag & Drop in deinen Garten!
                      </p>
                      <p className="text-xs text-muted-foreground text-center">
                        🌟 Verschiedene Kategorien bieten unterschiedliche Vorteile
                      </p>
                      
                      {/* Quick Stats for Selected Category */}
                      {selectedCategory !== 'all' && (
                        <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                          <div className="text-center p-2 bg-muted/30 rounded">
                            <div className="font-medium">
                              {getFilteredFlowers().filter(f => f.rarity === 'common').length}
                            </div>
                            <div className="text-muted-foreground">Gewöhnlich</div>
                          </div>
                          <div className="text-center p-2 bg-muted/30 rounded">
                            <div className="font-medium">
                              {getFilteredFlowers().filter(f => ['rare', 'epic'].includes(f.rarity)).length}
                            </div>
                            <div className="text-muted-foreground">Selten+</div>
                          </div>
                          <div className="text-center p-2 bg-muted/30 rounded">
                            <div className="font-medium">
                              {Math.round(getFilteredFlowers().reduce((sum, f) => sum + f.cost, 0) / getFilteredFlowers().length)}P
                            </div>
                            <div className="text-muted-foreground">Ø Kosten</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

            </div>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="stats" className="space-y-6">
            {(studySessions || []).length > 0 ? (
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
                      {(studySessions || []).slice(-10).reverse().map((session) => (
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
                      {(studySessions || []).length === 0 && (
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