import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Clock, RotateCcw, CheckCircle } from 'lucide-react'

const RetryIndicator = ({ retryInfo }) => {
  if (!retryInfo) return null

  const getIcon = () => {
    switch (retryInfo.type) {
      case 'retry_attempt':
        return <RotateCcw className="w-4 h-4 animate-spin" />
      case 'retry_waiting':
        return <Clock className="w-4 h-4" />
      case 'retry_success':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'retry_failed':
        return <AlertCircle className="w-4 h-4 text-red-400" />
      default:
        return <RotateCcw className="w-4 h-4" />
    }
  }

  const getBgColor = () => {
    switch (retryInfo.type) {
      case 'retry_success':
        return 'bg-green-600'
      case 'retry_failed':
        return 'bg-red-600'
      case 'retry_waiting':
        return 'bg-yellow-600'
      default:
        return 'bg-blue-600'
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 ${getBgColor()} bg-opacity-90 backdrop-blur-md rounded-lg px-4 py-2 shadow-lg`}
      >
        <div className="flex items-center space-x-2 text-white">
          {getIcon()}
          <span className="text-sm font-medium">
            {retryInfo.message}
          </span>
        </div>
        
        {retryInfo.type === 'retry_waiting' && retryInfo.delay && (
          <div className="mt-2">
            <div className="bg-black bg-opacity-30 rounded-full h-1">
              <motion.div
                className="bg-white rounded-full h-1"
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: retryInfo.delay / 1000, ease: 'linear' }}
              />
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

export default RetryIndicator
