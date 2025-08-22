import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Trash2, RefreshCw, Key, Activity, AlertCircle, Check } from 'lucide-react'

const ApiKeyManager = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [newApiKey, setNewApiKey] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Load stats when component opens
  useEffect(() => {
    if (isOpen) {
      loadStats()
    }
  }, [isOpen])

  const loadStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/keys/stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      setError('Failed to load API key stats')
    } finally {
      setLoading(false)
    }
  }

  const addApiKey = async () => {
    if (!newApiKey.trim()) {
      setError('Please enter an API key')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/keys/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: newApiKey.trim() })
      })

      const data = await response.json()
      
      if (data.success) {
        setSuccess(`API key added successfully (${data.keyId})`)
        setNewApiKey('')
        loadStats() // Refresh stats
      } else {
        setError(data.error || 'Failed to add API key')
      }
    } catch (error) {
      setError('Failed to add API key')
    } finally {
      setLoading(false)
    }
  }

  const removeApiKey = async (apiKey) => {
    if (!confirm('Are you sure you want to remove this API key?')) return

    try {
      setLoading(true)
      const response = await fetch('/api/keys/remove', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey })
      })

      const data = await response.json()
      
      if (data.success) {
        setSuccess('API key removed successfully')
        loadStats() // Refresh stats
      } else {
        setError(data.error || 'Failed to remove API key')
      }
    } catch (error) {
      setError('Failed to remove API key')
    } finally {
      setLoading(false)
    }
  }

  const resetCooldowns = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/keys/reset', { method: 'POST' })
      const data = await response.json()
      
      if (data.success) {
        setSuccess('All cooldowns reset successfully')
        loadStats() // Refresh stats
      } else {
        setError(data.error || 'Failed to reset cooldowns')
      }
    } catch (error) {
      setError('Failed to reset cooldowns')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (key) => {
    if (!key.isActive) return 'text-red-400'
    if (key.inCooldown) return 'text-yellow-400'
    return 'text-green-400'
  }

  const getStatusIcon = (key) => {
    if (!key.isActive) return <AlertCircle className="w-4 h-4 text-red-400" />
    if (key.inCooldown) return <RefreshCw className="w-4 h-4 text-yellow-400 animate-spin" />
    return <Check className="w-4 h-4 text-green-400" />
  }

  const maskApiKey = (key) => {
    if (key.length <= 8) return key
    return key.substring(0, 4) + '...' + key.substring(key.length - 4)
  }

  if (!isOpen) return null

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="glass-panel max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white border-opacity-20">
          <div className="flex items-center space-x-3">
            <Key className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-glow">API Key Manager</h2>
          </div>
          <button
            onClick={onClose}
            className="glass-panel p-2 hover:bg-white hover:bg-opacity-10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Error/Success Messages */}
          <AnimatePresence>
            {error && (
              <motion.div
                className="bg-red-600 bg-opacity-20 border border-red-500 rounded-lg p-3 mb-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-red-300">{error}</span>
                  <button
                    onClick={() => setError('')}
                    className="ml-auto text-red-400 hover:text-red-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
            
            {success && (
              <motion.div
                className="bg-green-600 bg-opacity-20 border border-green-500 rounded-lg p-3 mb-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-green-300">{success}</span>
                  <button
                    onClick={() => setSuccess('')}
                    className="ml-auto text-green-400 hover:text-green-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats Overview */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="glass-panel p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{stats.totalKeys}</div>
                <div className="text-sm text-gray-400">Total Keys</div>
              </div>
              <div className="glass-panel p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{stats.activeKeys}</div>
                <div className="text-sm text-gray-400">Active Keys</div>
              </div>
              <div className="glass-panel p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">{stats.availableKeys}</div>
                <div className="text-sm text-gray-400">Available Keys</div>
              </div>
              <div className="glass-panel p-4 text-center">
                <div className="text-sm text-gray-400">Current Key</div>
                <div className="text-lg font-bold text-cyan-400">{stats.currentKey || 'None'}</div>
              </div>
            </div>
          )}

          {/* Add New Key */}
          <div className="glass-panel p-4 mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
              <Plus className="w-5 h-5 text-blue-400" />
              <span>Add New API Key</span>
            </h3>
            <div className="flex space-x-3">
              <input
                type="text"
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
                placeholder="Enter Gemini API key (AIza...)"
                className="flex-1 px-4 py-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg focus:outline-none focus:border-blue-400"
                disabled={loading}
              />
              <button
                onClick={addApiKey}
                disabled={loading || !newApiKey.trim()}
                className="glow-button flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                <span>Add Key</span>
              </button>
            </div>
          </div>

          {/* API Keys List */}
          {stats && stats.keys && (
            <div className="glass-panel p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-green-400" />
                  <span>API Keys Status</span>
                </h3>
                <button
                  onClick={resetCooldowns}
                  disabled={loading}
                  className="px-3 py-1 bg-yellow-600 bg-opacity-20 border border-yellow-500 rounded hover:bg-opacity-30 transition-colors text-sm flex items-center space-x-1"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Reset Cooldowns</span>
                </button>
              </div>

              <div className="space-y-3">
                {stats.keys.map((key, index) => (
                  <motion.div
                    key={key.id}
                    className="border border-white border-opacity-10 rounded-lg p-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(key)}
                        <div>
                          <div className="font-mono text-sm">{key.id}</div>
                          <div className="text-xs text-gray-400">{maskApiKey(key.key || 'Unknown')}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className={`text-sm font-medium ${getStatusColor(key)}`}>
                            {key.isActive ? (key.inCooldown ? 'Cooldown' : 'Active') : 'Disabled'}
                          </div>
                          <div className="text-xs text-gray-400">
                            Success: {key.successRate}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm text-white">{key.totalRequests}</div>
                          <div className="text-xs text-gray-400">Requests</div>
                        </div>
                        
                        <button
                          onClick={() => removeApiKey(key.key)}
                          disabled={loading}
                          className="p-2 hover:bg-red-600 hover:bg-opacity-20 rounded transition-colors"
                          title="Remove key"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>

                    {key.lastUsed && (
                      <div className="mt-2 text-xs text-gray-500">
                        Last used: {new Date(key.lastUsed).toLocaleString()}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Refresh Button */}
          <div className="mt-6 text-center">
            <button
              onClick={loadStats}
              disabled={loading}
              className="glass-panel px-4 py-2 hover:bg-white hover:bg-opacity-10 transition-colors flex items-center space-x-2 mx-auto"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Stats</span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default ApiKeyManager
