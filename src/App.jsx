import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Music, Upload, Play, Pause, Volume2, SkipBack, SkipForward } from 'lucide-react'
import AudioPlayer from './components/AudioPlayer'
import AudioUploader from './components/AudioUploader'

function App() {
  const [currentTrack, setCurrentTrack] = useState(null)
  const [playlist, setPlaylist] = useState([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [showUploader, setShowUploader] = useState(false)

  // Load saved tracks from localStorage on mount
  useEffect(() => {
    const savedTracks = localStorage.getItem('audioTracks')
    if (savedTracks) {
      try {
        const parsedTracks = JSON.parse(savedTracks)
        setPlaylist(parsedTracks)
        if (parsedTracks.length > 0 && !currentTrack) {
          setCurrentTrack(parsedTracks[0])
        }
      } catch (error) {
        console.error('Failed to load saved tracks:', error)
      }
    }
  }, [currentTrack])

  // Save tracks to localStorage whenever playlist changes
  useEffect(() => {
    if (playlist.length > 0) {
      localStorage.setItem('audioTracks', JSON.stringify(playlist))
    }
  }, [playlist])

  const handleFileUpload = (files) => {
    const newTracks = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      file: file,
      url: URL.createObjectURL(file),
      duration: 0,
      uploadedAt: new Date().toISOString()
    }))
    
    setPlaylist(prev => [...prev, ...newTracks])
    
    if (!currentTrack && newTracks.length > 0) {
      setCurrentTrack(newTracks[0])
    }
    
    setShowUploader(false)
  }

  const handleTrackSelect = (track) => {
    setCurrentTrack(track)
    setIsPlaying(false)
  }

  const handleRemoveTrack = (trackId) => {
    setPlaylist(prev => {
      const filtered = prev.filter(track => track.id !== trackId)
      
      // If current track is removed, select next available track
      if (currentTrack?.id === trackId) {
        const currentIndex = prev.findIndex(track => track.id === trackId)
        const nextTrack = filtered[currentIndex] || filtered[currentIndex - 1] || null
        setCurrentTrack(nextTrack)
        setIsPlaying(false)
      }
      
      return filtered
    })
  }

  const handleNextTrack = () => {
    if (playlist.length === 0) return
    
    const currentIndex = playlist.findIndex(track => track.id === currentTrack?.id)
    const nextIndex = (currentIndex + 1) % playlist.length
    setCurrentTrack(playlist[nextIndex])
  }

  const handlePreviousTrack = () => {
    if (playlist.length === 0) return
    
    const currentIndex = playlist.findIndex(track => track.id === currentTrack?.id)
    const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1
    setCurrentTrack(playlist[prevIndex])
  }

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <motion.div
              animate={{ rotate: isPlaying ? 360 : 0 }}
              transition={{ duration: 2, repeat: isPlaying ? Infinity : 0, ease: "linear" }}
            >
              <Music className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              Audio Player
            </h1>
          </div>
          <p className="text-white/70 text-lg">
            Upload and play your favorite tracks with stunning visualizations
          </p>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Playlist Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Playlist</h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowUploader(true)}
                  className="flex items-center gap-2 bg-purple-600/80 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Upload
                </motion.button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {playlist.length === 0 ? (
                  <div className="text-center py-8 text-white/60">
                    <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No tracks uploaded yet</p>
                    <p className="text-sm mt-1">Click upload to add music</p>
                  </div>
                ) : (
                  playlist.map((track) => (
                    <motion.div
                      key={track.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        currentTrack?.id === track.id
                          ? 'bg-purple-600/30 border border-purple-400/50'
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                      onClick={() => handleTrackSelect(track)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">
                            {track.name.replace(/\.[^/.]+$/, "")}
                          </p>
                          <p className="text-white/60 text-sm">
                            {formatTime(track.duration)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          {currentTrack?.id === track.id && isPlaying && (
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                              className="w-2 h-2 bg-purple-400 rounded-full"
                            />
                          )}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveTrack(track.id)
                            }}
                            className="text-white/60 hover:text-red-400 transition-colors"
                          >
                            ×
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>

          {/* Main Player */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2"
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
              {currentTrack ? (
                <AudioPlayer
                  track={currentTrack}
                  isPlaying={isPlaying}
                  setIsPlaying={setIsPlaying}
                  currentTime={currentTime}
                  setCurrentTime={setCurrentTime}
                  duration={duration}
                  setDuration={setDuration}
                  volume={volume}
                  setVolume={setVolume}
                  onNext={handleNextTrack}
                  onPrevious={handlePreviousTrack}
                  onTrackEnd={handleNextTrack}
                />
              ) : (
                <div className="text-center py-16">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Music className="w-24 h-24 mx-auto mb-6 text-white/30" />
                  </motion.div>
                  <h3 className="text-2xl font-semibold text-white mb-3">
                    No Track Selected
                  </h3>
                  <p className="text-white/60 mb-6">
                    Upload some music or select a track from your playlist
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowUploader(true)}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-full font-semibold shadow-lg"
                  >
                    Upload Music
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploader && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowUploader(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <AudioUploader
                onUpload={handleFileUpload}
                onClose={() => setShowUploader(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App