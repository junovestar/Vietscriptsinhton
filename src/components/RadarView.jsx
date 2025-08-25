import React from 'react'
import { motion } from 'framer-motion'

const RadarView = ({ processing, videos, onVideoClick, processingProgress }) => {
  const radarCircles = [60, 120, 180, 240]
  
  const getVideoPosition = (index) => {
    const angle = (index * 360 / Math.max(videos.length, 8)) * (Math.PI / 180)
    const radius = 100 + (index % 3) * 40
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    }
  }

  return (
    <div className="radar-container relative">
      {/* Radar circles */}
      {radarCircles.map((size, index) => (
        <motion.div
          key={size}
          className="radar-circle"
          style={{
            width: size,
            height: size,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.6 }}
          transition={{ delay: index * 0.2, duration: 0.8 }}
        />
      ))}
      
      {/* Radar sweep line */}
      {processing && (
        <motion.div
          className="absolute top-1/2 left-1/2 origin-bottom"
          style={{ 
            width: '2px', 
            height: '120px',
            background: 'linear-gradient(to top, rgba(100, 255, 218, 1), transparent)',
            transform: 'translate(-50%, -100%)'
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
      )}
      
      {/* Center PING button with processing indicator */}
      <motion.div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        whileHover={!processing ? { scale: 1.1 } : {}}
        whileTap={!processing ? { scale: 0.95 } : {}}
      >
        <div className={`w-16 h-16 rounded-full border-2 border-glow bg-gradient-to-r from-accent-blue to-accent-cyan
          flex items-center justify-center text-xl font-bold shadow-glow-strong relative
          ${processing ? 'animate-pulse-glow' : 'hover:shadow-glow-strong'}`}>
          
          {processing ? (
            <div className="flex flex-col items-center">
              <motion.div
                className="w-3 h-3 bg-white rounded-full mb-1"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="text-xs">SCAN</span>
            </div>
          ) : (
            'PING'
          )}
          
          {/* Processing progress ring */}
          {processing && processingProgress && (
            <motion.div
              className="absolute inset-0 border-2 border-transparent border-t-white rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
          )}
        </div>
      </motion.div>
      
      {/* Video dots */}
      {videos.map((video, index) => {
        const position = getVideoPosition(index)
        return (
          <motion.div
            key={video.id}
            className="ping-dot cursor-pointer"
            style={{
              left: `calc(50% + ${position.x}px)`,
              top: `calc(50% + ${position.y}px)`,
              transform: 'translate(-50%, -50%)'
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            whileHover={{ scale: 1.5 }}
            onClick={() => onVideoClick(video)}
          />
        )
      })}
      
      {/* Distance indicators */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full mt-4">
        <div className="text-xs text-gray-400 text-center space-y-1">
          <div>Proximity Distance</div>
          <div className="flex space-x-4">
            <span>5 Videos</span>
            <span>10 Videos</span>
            <span>15 Videos</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RadarView
