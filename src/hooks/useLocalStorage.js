import { useState, useEffect } from 'react'

/**
 * Custom hook for managing localStorage with React state
 */
export function useLocalStorage(key, initialValue) {
  // Get initial value from localStorage or use provided initial value
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }

  // Remove item from localStorage
  const removeValue = () => {
    try {
      window.localStorage.removeItem(key)
      setStoredValue(initialValue)
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue, removeValue]
}

/**
 * Hook specifically for managing video processing history
 */
export function useVideoHistory() {
  const [history, setHistory, clearHistory] = useLocalStorage('binh-luan-history', [])

  const addToHistory = (item) => {
    const historyItem = {
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      ...item
    }
    
    setHistory(prev => [historyItem, ...prev])
    return historyItem.id
  }

  const removeFromHistory = (id) => {
    setHistory(prev => prev.filter(item => item.id !== id))
  }

  const updateHistoryItem = (id, updates) => {
    setHistory(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ))
  }

  const getHistoryStats = () => {
    return {
      total: history.length,
      single: history.filter(item => item.type === 'single').length,
      batch: history.filter(item => item.type === 'batch').length,
      success: history.filter(item => item.status !== 'error' && item.status !== 'partial').length,
      error: history.filter(item => item.status === 'error').length,
      partial: history.filter(item => item.status === 'partial').length,
      totalCharacters: history.reduce((sum, item) => sum + (item.result?.length || 0), 0),
      totalVideos: history.reduce((sum, item) => sum + (item.videoCount || 0), 0),
      totalErrors: history.reduce((sum, item) => sum + (item.errorCount || 0), 0)
    }
  }

  return {
    history,
    setHistory,
    clearHistory,
    addToHistory,
    removeFromHistory,
    updateHistoryItem,
    getHistoryStats
  }
}
