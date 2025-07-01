"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sun, Moon, Monitor } from "lucide-react"

type Theme = "light" | "dark" | "system"

const ThemeToggle = () => {
  const [theme, setTheme] = useState<Theme>("system")

  useEffect(() => {
    // Get initial theme from localStorage or default to system
    const savedTheme = localStorage.getItem("theme") as Theme
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])

  useEffect(() => {
    const root = window.document.documentElement

    // Remove existing theme classes
    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }

    // Save theme to localStorage
    localStorage.setItem("theme", theme)
  }, [theme])

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
  }

  return (
    <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-700">
      <Button
        onClick={() => handleThemeChange("light")}
        variant={theme === "light" ? "default" : "ghost"}
        size="sm"
        className={`h-8 w-8 p-0 ${
          theme === "light" 
            ? "bg-blue-600 text-white hover:bg-blue-700" 
            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        }`}
      >
        <Sun className="w-4 h-4" />
      </Button>
      <Button
        onClick={() => handleThemeChange("dark")}
        variant={theme === "dark" ? "default" : "ghost"}
        size="sm"
        className={`h-8 w-8 p-0 ${
          theme === "dark" 
            ? "bg-blue-600 text-white hover:bg-blue-700" 
            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        }`}
      >
        <Moon className="w-4 h-4" />
      </Button>
      <Button
        onClick={() => handleThemeChange("system")}
        variant={theme === "system" ? "default" : "ghost"}
        size="sm"
        className={`h-8 w-8 p-0 ${
          theme === "system" 
            ? "bg-blue-600 text-white hover:bg-blue-700" 
            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        }`}
      >
        <Monitor className="w-4 h-4" />
      </Button>
    </div>
  )
}

export default ThemeToggle 