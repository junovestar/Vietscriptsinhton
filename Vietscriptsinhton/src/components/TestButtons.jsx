import React, { useState } from 'react'

const TestButtons = () => {
  const [clicked, setClicked] = useState('')
  const [apiTesting, setApiTesting] = useState(false)

  const testGeminiDuration = async () => {
    setApiTesting(true)
    setClicked('🧪 Testing Gemini API for duration...')
    
    try {
      const response = await fetch('/api/test-duration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          prompt: 'Determine the total duration of the video in [hh:mm:ss] format.'
        })
      })
      
      const result = await response.json()
      setClicked(`✅ Gemini Response: "${result.duration}"`)
    } catch (error) {
      setClicked(`❌ API Error: ${error.message}`)
    } finally {
      setApiTesting(false)
    }
  }

  const testButtons = [
    { id: 'test1', label: 'Test Button 1', action: () => setClicked('Button 1 clicked!') },
    { id: 'test2', label: 'Test Button 2', action: () => setClicked('Button 2 clicked!') },
    { id: 'test3', label: 'Disabled Button', action: () => setClicked('Should not click'), disabled: true },
    { id: 'gemini', label: '🤖 Test Gemini Duration', action: testGeminiDuration, disabled: apiTesting },
  ]

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 p-4 bg-black bg-opacity-80 rounded-lg">
      <h3 className="text-white text-sm font-bold">🔧 Button Test Panel</h3>
      
      {testButtons.map(button => (
        <button
          key={button.id}
          onClick={button.action}
          disabled={button.disabled}
          className={`block w-full px-3 py-2 text-sm rounded transition-colors ${
            button.disabled 
              ? 'bg-gray-500 text-gray-300 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {button.label}
        </button>
      ))}
      
      {clicked && (
        <div className="mt-2 p-2 bg-green-600 text-white text-xs rounded">
          {clicked}
        </div>
      )}
      
      <button
        onClick={() => setClicked('')}
        className="block w-full px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
      >
        Clear
      </button>
    </div>
  )
}

export default TestButtons
