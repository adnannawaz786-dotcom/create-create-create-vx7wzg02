import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/globals.css'

// Error boundary component for production-ready error handling
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
          <div className="glass-card p-8 rounded-2xl max-w-md mx-4">
            <h2 className="text-2xl font-bold text-white mb-4">Something went wrong</h2>
            <p className="text-gray-300 mb-6">
              The audio player encountered an unexpected error. Please refresh the page to try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Initialize audio context on user interaction to comply with browser policies
const initializeAudioContext = () => {
  if (window.AudioContext || window.webkitAudioContext) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    
    // Resume audio context if it's suspended
    if (audioContext.state === 'suspended') {
      audioContext.resume()
    }
    
    // Store globally for use in audio utilities
    window.globalAudioContext = audioContext
  }
}

// Add global click listener to initialize audio context
document.addEventListener('click', initializeAudioContext, { once: true })
document.addEventListener('touchstart', initializeAudioContext, { once: true })

// Performance monitoring for production
const measurePerformance = () => {
  if ('performance' in window) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0]
        console.log('App load time:', perfData.loadEventEnd - perfData.fetchStart, 'ms')
      }, 0)
    })
  }
}

// Initialize performance monitoring
measurePerformance()

// Service worker registration for offline support
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration)
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError)
      })
  })
}

// Check for browser compatibility
const checkBrowserSupport = () => {
  const isSupported = {
    audioContext: !!(window.AudioContext || window.webkitAudioContext),
    fileReader: !!window.FileReader,
    localStorage: !!window.localStorage,
    webGL: !!window.WebGLRenderingContext
  }

  const unsupportedFeatures = Object.entries(isSupported)
    .filter(([_, supported]) => !supported)
    .map(([feature, _]) => feature)

  if (unsupportedFeatures.length > 0) {
    console.warn('Unsupported browser features:', unsupportedFeatures)
  }

  return isSupported
}

// Initialize browser support check
const browserSupport = checkBrowserSupport()

// Root component with providers and global setup
const AppWithProviders = () => {
  React.useEffect(() => {
    // Set up global error handlers
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error)
    })

    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason)
    })

    // Clean up localStorage on app start (remove old/corrupted data)
    try {
      const audioFiles = JSON.parse(localStorage.getItem('audioFiles') || '[]')
      if (!Array.isArray(audioFiles)) {
        localStorage.removeItem('audioFiles')
      }
    } catch (error) {
      localStorage.removeItem('audioFiles')
    }

    // Set up theme detection
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)')
    const updateTheme = (e) => {
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light')
    }
    
    updateTheme(prefersDark)
    prefersDark.addEventListener('change', updateTheme)

    return () => {
      prefersDark.removeEventListener('change', updateTheme)
    }
  }, [])

  return (
    <React.StrictMode>
      <ErrorBoundary>
        <App browserSupport={browserSupport} />
      </ErrorBoundary>
    </React.StrictMode>
  )
}

// Render the application
const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(<AppWithProviders />)

// Hot module replacement for development
if (import.meta.hot) {
  import.meta.hot.accept()
}