import { useState, useRef } from 'react'
import { Upload, X, Music, FileAudio } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const AudioUploader = ({ onFileUpload, uploadedFiles, onFileRemove }) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const allowedTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac']
  const maxFileSize = 50 * 1024 * 1024 // 50MB

  const validateFile = (file) => {
    if (!allowedTypes.includes(file.type)) {
      return 'Please upload a valid audio file (MP3, WAV, OGG, M4A, AAC)'
    }
    if (file.size > maxFileSize) {
      return 'File size must be less than 50MB'
    }
    return null
  }

  const processFile = async (file) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsUploading(true)
    setError('')

    try {
      // Create file URL for playback
      const url = URL.createObjectURL(file)
      
      // Create audio element to get duration and metadata
      const audio = new Audio(url)
      
      await new Promise((resolve, reject) => {
        audio.addEventListener('loadedmetadata', () => {
          const fileData = {
            id: Date.now() + Math.random(),
            name: file.name,
            size: file.size,
            type: file.type,
            duration: audio.duration,
            url: url,
            uploadedAt: new Date().toISOString()
          }

          // Save to localStorage
          const existingFiles = JSON.parse(localStorage.getItem('audioFiles') || '[]')
          const updatedFiles = [...existingFiles, fileData]
          localStorage.setItem('audioFiles', JSON.stringify(updatedFiles))

          onFileUpload(fileData)
          resolve()
        })

        audio.addEventListener('error', () => {
          reject(new Error('Invalid audio file'))
        })

        audio.load()
      })

    } catch (err) {
      setError('Failed to process audio file. Please try again.')
      URL.revokeObjectURL(url)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileSelect = (files) => {
    const fileArray = Array.from(files)
    fileArray.forEach(processFile)
  }

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files)
    }
  }

  const handleFileInputChange = (e) => {
    const files = e.target.files
    if (files.length > 0) {
      handleFileSelect(files)
    }
    // Reset input value to allow re-uploading same file
    e.target.value = ''
  }

  const handleRemoveFile = (fileId) => {
    const existingFiles = JSON.parse(localStorage.getItem('audioFiles') || '[]')
    const fileToRemove = existingFiles.find(f => f.id === fileId)
    
    if (fileToRemove && fileToRemove.url) {
      URL.revokeObjectURL(fileToRemove.url)
    }

    const updatedFiles = existingFiles.filter(f => f.id !== fileId)
    localStorage.setItem('audioFiles', JSON.stringify(updatedFiles))
    
    onFileRemove(fileId)
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <motion.div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
          isDragOver
            ? 'border-blue-400 bg-blue-50/10 backdrop-blur-sm'
            : 'border-gray-300/50 hover:border-gray-400/70'
        } ${isUploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
        style={{
          background: isDragOver 
            ? 'rgba(59, 130, 246, 0.05)' 
            : 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: isDragOver 
            ? '2px dashed rgba(59, 130, 246, 0.5)' 
            : '2px dashed rgba(255, 255, 255, 0.2)'
        }}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".mp3,.wav,.ogg,.m4a,.aac"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isUploading}
        />

        <motion.div
          animate={isUploading ? { rotate: 360 } : { rotate: 0 }}
          transition={{ duration: 2, repeat: isUploading ? Infinity : 0, ease: "linear" }}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        </motion.div>

        <h3 className="text-lg font-semibold text-white mb-2">
          {isUploading ? 'Processing Audio...' : 'Upload Audio Files'}
        </h3>
        <p className="text-gray-300 mb-4">
          Drag and drop your audio files here, or click to browse
        </p>
        <p className="text-sm text-gray-400">
          Supports MP3, WAV, OGG, M4A, AAC (max 50MB per file)
        </p>
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-500/10 border border-red-500/30 rounded-lg p-4"
            style={{ backdropFilter: 'blur(10px)' }}
          >
            <p className="text-red-300 text-sm">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Uploaded Files List */}
      {uploadedFiles && uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-white flex items-center gap-2">
            <Music className="h-5 w-5" />
            Uploaded Files ({uploadedFiles.length})
          </h4>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            <AnimatePresence>
              {uploadedFiles.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileAudio className="h-5 w-5 text-blue-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-medium truncate">
                        {file.name}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {formatFileSize(file.size)} • {formatDuration(file.duration)}
                      </p>
                    </div>
                  </div>
                  
                  <motion.button
                    onClick={() => handleRemoveFile(file.id)}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="h-4 w-4" />
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Upload Instructions */}
      {(!uploadedFiles || uploadedFiles.length === 0) && (
        <div 
          className="text-center p-6 rounded-lg"
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}
        >
          <Music className="h-8 w-8 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-300 mb-2">No audio files uploaded yet</p>
          <p className="text-gray-400 text-sm">
            Upload your favorite tracks to get started with the audio player
          </p>
        </div>
      )}
    </div>
  )
}

export default AudioUploader