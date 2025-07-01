"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { RotateCcw, X, Circle, CheckCircle, AlertCircle, Trash2 } from "lucide-react"
import ThemeToggle from "./ThemeToggle"

type Player = "X" | "O" | null

interface GameState {
  board: Player[]
  currentPlayer: "X" | "O"
  winner: Player
  isDraw: boolean
  gameOver: boolean
}

interface Score {
  X: number
  O: number
  draws: number
}

interface Toast {
  id: string
  message: string
  type: "success" | "warning"
  visible: boolean
}

const TicTacToe = () => {
  const [gameState, setGameState] = useState<GameState>({
    board: Array(9).fill(null),
    currentPlayer: "X",
    winner: null,
    isDraw: false,
    gameOver: false,
  })

  const [toast, setToast] = useState<Toast | null>(null)
  const [score, setScore] = useState<Score>({
    X: 0,
    O: 0,
    draws: 0,
  })

  const [isMuted, setIsMuted] = useState(false)
  const boardRefs = useRef<(HTMLButtonElement | null)[]>([])

  const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6] // Diagonals
  ]

  // Sound effects
  const playSound = (frequency: number, duration: number = 200) => {
    if (isMuted) return
    
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + duration / 1000)
    } catch {
      console.log('Audio not supported')
    }
  }

  const playMoveSound = () => playSound(800, 150)
  const playWinSound = useCallback(() => playSound(1200, 500), [])
  const playDrawSound = useCallback(() => playSound(600, 300), [])

  const showToast = (message: string, type: "success" | "warning") => {
    const newToast: Toast = {
      id: Date.now().toString(),
      message,
      type,
      visible: true,
    }
    setToast(newToast)

    // Auto-hide toast after 3 seconds
    setTimeout(() => {
      setToast(null)
    }, 3000)
  }

  const checkWinner = (board: Player[]): Player => {
    for (const combination of winningCombinations) {
      const [a, b, c] = combination
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a]
      }
    }
    return null
  }

  const checkDraw = (board: Player[]): boolean => {
    return board.every(cell => cell !== null)
  }

  const handleCellClick = (index: number) => {
    if (gameState.board[index] || gameState.gameOver) return

    const newBoard = [...gameState.board]
    newBoard[index] = gameState.currentPlayer

    const winner = checkWinner(newBoard)
    const isDraw = checkDraw(newBoard)
    const gameOver = winner !== null || isDraw

    // Play move sound
    playMoveSound()

    setGameState({
      board: newBoard,
      currentPlayer: gameState.currentPlayer === "X" ? "O" : "X",
      winner,
      isDraw,
      gameOver,
    })
  }

  // Show toast when game ends and update score
  useEffect(() => {
    if (gameState.winner) {
      showToast(`Player ${gameState.winner} wins!`, "success")
      playWinSound()
      setScore(prev => ({
        ...prev,
        [gameState.winner!]: prev[gameState.winner!] + 1
      }))
    } else if (gameState.isDraw) {
      showToast("It's a draw!", "warning")
      playDrawSound()
      setScore(prev => ({
        ...prev,
        draws: prev.draws + 1
      }))
    }
  }, [gameState.winner, gameState.isDraw, playWinSound, playDrawSound])

  const resetGame = () => {
    setGameState({
      board: Array(9).fill(null),
      currentPlayer: "X",
      winner: null,
      isDraw: false,
      gameOver: false,
    })
    setToast(null) // Clear any existing toast
  }

  const resetScore = () => {
    setScore({
      X: 0,
      O: 0,
      draws: 0,
    })
    showToast("Score reset!", "warning")
  }



  // Find winning line
  const getWinningLine = (board: Player[]): number[] | null => {
    for (const combination of winningCombinations) {
      const [a, b, c] = combination
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return combination
      }
    }
    return null
  }

  const winningLine = gameState.winner ? getWinningLine(gameState.board) : null

  // Keyboard navigation
  const handleCellKeyDown = (e: React.KeyboardEvent, index: number) => {
    const row = Math.floor(index / 3)
    const col = index % 3
    let nextIndex = index
    if (e.key === "ArrowRight") nextIndex = col < 2 ? index + 1 : index - 2
    if (e.key === "ArrowLeft") nextIndex = col > 0 ? index - 1 : index + 2
    if (e.key === "ArrowDown") nextIndex = row < 2 ? index + 3 : index - 6
    if (e.key === "ArrowUp") nextIndex = row > 0 ? index - 3 : index + 6
    if (nextIndex !== index) {
      e.preventDefault()
      boardRefs.current[nextIndex]?.focus()
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      handleCellClick(index)
    }
  }

  const renderCell = (value: Player, index: number) => {
    const isWinning = winningLine?.includes(index)
    return (
      <button
        key={index}
        ref={el => { boardRefs.current[index] = el }}
        onClick={() => handleCellClick(index)}
        onKeyDown={e => handleCellKeyDown(e, index)}
        tabIndex={gameState.gameOver || value !== null ? -1 : 0}
        aria-label={
          value
            ? `Cell ${index + 1}, ${value}`
            : `Cell ${index + 1}, empty, press to place ${gameState.currentPlayer}`
        }
        disabled={gameState.gameOver || value !== null}
        className={`
          w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24
          border-2 border-gray-300 dark:border-gray-600
          flex items-center justify-center
          text-2xl sm:text-3xl lg:text-4xl font-bold
          transition-all duration-200
          hover:bg-gray-100 dark:hover:bg-gray-800
          disabled:cursor-not-allowed
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:z-10
          ${value === "X" ? "text-blue-600" : ""}
          ${value === "O" ? "text-red-600" : ""}
          ${gameState.gameOver ? "opacity-75" : ""}
          ${isWinning ? "bg-green-100 dark:bg-green-900 animate-pulse" : ""}
        `}
      >
        {value === "X" && <X className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10" />}
        {value === "O" && <Circle className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10" />}
      </button>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      {/* Responsive Layout: Stack on mobile, horizontal on larger screens */}
      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between w-full max-w-6xl mx-auto gap-4 mt-4 lg:mt-4">
        {/* Title */}
        <div className="flex-1 flex items-center justify-center lg:justify-start w-full lg:w-auto">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 dark:text-white text-center lg:text-left">Tic Tac Toe</h1>
        </div>
        {/* Game Card */}
        <div className="flex-1 flex justify-center w-full lg:w-auto">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 w-full max-w-sm sm:max-w-md">
            {/* Player Indicator */}
            <div className="flex justify-center mb-4">
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold
                ${gameState.currentPlayer === "X" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200" : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200"}
                border border-gray-200 dark:border-gray-700 transition-colors duration-200 animate-fade-in
              `}>
                {gameState.currentPlayer === "X" ? <X className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                Player {gameState.currentPlayer}&apos;s turn
              </span>
            </div>
            {/* Score Display */}
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h2 className="text-base sm:text-lg font-semibold text-center mb-2 sm:mb-3 text-gray-700 dark:text-gray-300">
                Score
              </h2>
              <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                <div className="flex flex-col items-center">
                  <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{score.X}</div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Player X</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">{score.O}</div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Player O</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">{score.draws}</div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Draws</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1 sm:gap-2 mb-6 sm:mb-8 justify-items-center">
              {gameState.board.map((cell, index) => renderCell(cell, index))}
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3 mt-4">
              <Button
                onClick={resetGame}
                aria-label="New Game"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center gap-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
                New Game
              </Button>
              <Button
                onClick={resetScore}
                aria-label="Reset Score"
                variant="outline"
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center gap-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                Reset Score
              </Button>
              <Button
                onClick={() => setIsMuted(m => !m)}
                aria-label={isMuted ? "Unmute sound effects" : "Mute sound effects"}
                variant="ghost"
                className="ml-0 sm:ml-2 px-2 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {isMuted ? (
                  <span role="img" aria-label="Muted">🔇</span>
                ) : (
                  <span role="img" aria-label="Sound on">🔊</span>
                )}
              </Button>
            </div>
          </div>
        </div>
        {/* Theme Toggle */}
        <div className="flex-1 flex items-center justify-center lg:justify-end w-full lg:w-auto">
          <ThemeToggle />
        </div>
      </div>
      {/* Toast Notification */}
      {toast && (
        <div className={`
          fixed top-4 right-4 z-50 max-w-sm w-full
          transform transition-all duration-300 ease-in-out
          ${toast.visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        `}>
          <div className={`
            rounded-lg shadow-lg p-4 flex items-center gap-3
            ${toast.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800 dark:bg-green-900 dark:border-green-700 dark:text-green-100' 
              : 'bg-yellow-50 border border-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-700 dark:text-yellow-100'
            }
          `}>
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
            )}
            <span className="font-medium">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default TicTacToe 