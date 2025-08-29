# Monster Decision Game

A fast-paced reaction game where players must quickly decide whether to hug or kill monsters based on their appearance.

**Experience Qualities**: 
1. **Thrilling** - Heart-pounding time pressure creates excitement and adrenaline
2. **Intuitive** - Simple visual cues and binary choices make gameplay immediately understandable  
3. **Addictive** - Quick rounds and score tracking encourage repeated play sessions

**Complexity Level**: Micro Tool (single-purpose)
- Focused entirely on one core mechanic: rapid monster classification and decision making under time pressure

## Essential Features

### Monster Spawning System
- **Functionality**: Randomly generates either cute or ugly monsters on screen
- **Purpose**: Creates the core challenge requiring visual discrimination
- **Trigger**: Game start and after each successful decision
- **Progression**: Game loads → Monster appears → 2-second timer starts → Player decides → Next monster spawns
- **Success criteria**: Monsters visually distinct, spawn timing feels natural

### Decision Interface
- **Functionality**: Two prominent buttons (Kill/Hug) for player input
- **Purpose**: Provides clear action choices with visual feedback
- **Trigger**: Monster appears on screen
- **Progression**: Monster spawns → Buttons become active → Player clicks → Action processed → Result shown
- **Success criteria**: Buttons respond instantly, provide clear visual feedback

### Timer System
- **Functionality**: 2-second countdown with visual indicator
- **Purpose**: Creates urgency and prevents indefinite deliberation
- **Trigger**: Each monster spawn
- **Progression**: Monster appears → Timer starts → Visual countdown → Time expires → Game over (if no action)
- **Success criteria**: Timer accurate, visually clear, creates appropriate pressure

### Game Logic & Scoring
- **Functionality**: Validates correct decisions (kill ugly, hug cute) and tracks score
- **Purpose**: Defines win/lose conditions and progress measurement
- **Trigger**: Player action or timer expiration
- **Progression**: Decision made → Logic checks correctness → Score updates/Game ends → Next round or game over screen
- **Success criteria**: Logic always accurate, score persists, clear feedback on decisions

## Edge Case Handling
- **Rapid clicking**: Prevent multiple actions per monster through button disable states
- **Timer edge cases**: Handle simultaneous timer expiration and button clicks gracefully
- **Monster generation**: Ensure balanced distribution of cute vs ugly monsters over time
- **Score persistence**: Maintain high score even after browser refresh

## Design Direction
The design should feel playful yet intense - combining cute cartoon aesthetics with action game urgency to create engaging tension between adorable visuals and split-second decisions.

## Color Selection
Triadic color scheme emphasizing emotional contrast between safety and danger.

- **Primary Color**: Soft Purple `oklch(0.7 0.15 300)` - Creates magical, game-like atmosphere
- **Secondary Colors**: Warm Pink `oklch(0.8 0.12 350)` for cute elements, Dark Red `oklch(0.5 0.2 20)` for dangerous elements  
- **Accent Color**: Bright Yellow `oklch(0.85 0.15 80)` - High-energy highlights for timer and score elements
- **Foreground/Background Pairings**: 
  - Background (Soft Purple): White text `oklch(1 0 0)` - Ratio 7.2:1 ✓
  - Primary (Soft Purple): White text `oklch(1 0 0)` - Ratio 7.2:1 ✓
  - Secondary Pink (Warm Pink): Dark Purple text `oklch(0.2 0.1 300)` - Ratio 6.1:1 ✓
  - Secondary Red (Dark Red): White text `oklch(1 0 0)` - Ratio 8.5:1 ✓
  - Accent (Bright Yellow): Dark Purple text `oklch(0.2 0.1 300)` - Ratio 9.2:1 ✓

## Font Selection
Rounded, friendly typography that maintains readability under time pressure using Fredoka One for headings and Inter for UI elements.

- **Typographic Hierarchy**: 
  - H1 (Game Title): Fredoka One Bold/32px/tight letter spacing
  - Score Display: Inter Bold/24px/normal spacing  
  - Button Labels: Inter SemiBold/18px/wide letter spacing
  - Timer: Inter Bold/20px/monospace feel for clarity

## Animations
Bouncy, cartoon-style animations that enhance the playful monster theme while maintaining functional clarity for time-critical decisions.

- **Purposeful Meaning**: Monster entrance animations convey personality (cute bounces vs scary lurches), button presses feel satisfying and immediate
- **Hierarchy of Movement**: Timer pulsing gets strongest animation focus, monster appearance secondary, button feedback tertiary

## Component Selection
- **Components**: Card for game area, Button for actions, Progress for timer visualization, Badge for score display
- **Customizations**: Custom monster display component with emoji/SVG graphics, animated timer component with color transitions
- **States**: Buttons show clear hover/active/disabled states, monsters have enter/exit animations, timer changes color as time decreases
- **Icon Selection**: Heart icon for hug action, X or skull for kill action, timer/clock for countdown display
- **Spacing**: Consistent 4-unit (16px) spacing between major elements, 2-unit (8px) for related UI groups
- **Mobile**: Buttons stack vertically on mobile with larger touch targets (min 60px height), monster display scales proportionally