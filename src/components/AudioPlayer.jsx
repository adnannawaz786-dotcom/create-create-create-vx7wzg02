import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import {
  initializeAudioContext,
  connectAudioElement,
  getAudioData,
  drawVisualization,
} from '@/lib/audio-utils';

const AudioPlayer = ({ playlist = [], currentTrackIndex = 0, onTrackChange }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const animationRef = useRef(null);

  const currentTrack = playlist[currentTrackIndex];

  // Initialize Audio Context and connect audio element
  useEffect(() => {
    if (currentTrack && audioRef.current) {
      initializeAudioVisualization();
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [currentTrack]);

  const initializeAudioVisualization = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = initializeAudioContext();
      }
      if (audioRef.current) {
        connectAudioElement(audioRef.current);
      }
    } catch (err) {
      console.error('Error initializing audio visualization:', err);
    }
  };

  const startVisualization = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const animate = () => {
      if (isPlaying) {
        const audioData = getAudioData();
        drawVisualization(canvas, audioData, 'bars'); // or 'wave', 'circle', etc.
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animate();
  };

  const handlePlay = async () => {
    if (!audioRef.current || !currentTrack) return;

    try {
      setIsLoading(true);
      setError(null);

      if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      await audioRef.current.play();
      setIsPlaying(true);
      startVisualization();
    } catch (err) {
      setError('Failed to play audio. Please check the file format.');
      console.error('Play error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      handlePause();
    } else {
      handlePlay();
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (value) => {
    if (audioRef.current) {
      const newTime = (value[0] / 100) * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (value) => {
    const newVolume = value[0] / 100;
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const handleNext = () => {
    if (playlist.length === 0) return;

    let nextIndex;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } else {
      nextIndex = (currentTrackIndex + 1) % playlist.length;
    }

    onTrackChange?.(nextIndex);
  };

  const handlePrevious = () => {
    if (playlist.length === 0) return;

    let prevIndex;
    if (isShuffle) {
      prevIndex = Math.floor(Math.random() * playlist.length);
    } else {
      prevIndex = currentTrackIndex === 0 ? playlist.length - 1 : currentTrackIndex - 1;
    }

    onTrackChange?.(prevIndex);
  };

  const handleEnded = () => {
    if (isRepeat) {
      audioRef.current.currentTime = 0;
      handlePlay();
    } else {
      handleNext();
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration ? (currentTime / duration) * 100 : 0;

  if (playlist.length === 0) {
    return (
      <Card className="w-full max-w-4xl mx-auto p-8 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl">
        <div className="text-center text-white/70">
          <p className="text-lg">No tracks available</p>
          <p className="text-sm mt-2">Upload some audio files to get started</p>
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-4xl mx-auto"
    >
      <Card className="p-6 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl">
        {/* Audio Element */}
        <audio
          ref={audioRef}
          src={currentTrack?.url}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          preload="metadata"
        />

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200 text-sm"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Track Info */}
        <div className="text-center mb-6">
          <motion.h2
            key={currentTrack?.name}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-2xl font-bold text-white mb-2 truncate"
          >
            {currentTrack?.name || 'Unknown Track'}
          </motion.h2>
          <p className="text-white/70">
            Track {currentTrackIndex + 1} of {playlist.length}
          </p>
        </div>

        {/* Visualizer */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={600}
              height={120}
              className="rounded-lg bg-black/20 border border-white/10"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center text-white/50 text-sm">
                Audio Visualizer
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <Slider
            value={[progressPercentage]}
            onValueChange={handleSeek}
            max={100}
            step={0.1}
            className="w-full mb-2"
            disabled={!currentTrack || isLoading}
          />
          <div className="flex justify-between text-sm text-white/70">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <Button
            onClick={() => setIsShuffle(!isShuffle)}
            variant={isShuffle ? 'default' : 'ghost'}
            size="sm"
            className="text-white hover:bg-white/20"
            disabled={playlist.length <= 1}
          >
            <Shuffle className="w-4 h-4" />
          </Button>

          <Button
            onClick={handlePrevious}
            variant="ghost"
            size="lg"
            className="text-white hover:bg-white/20"
            disabled={playlist.length <= 1}
          >
            <SkipBack className="w-6 h-6" />
          </Button>

          <Button
            onClick={handlePlayPause}
            size="lg"
            className="w-16 h-16 rounded-full bg-white/20 hover:bg-white/30 text-white border-2 border-white/30"
            disabled={!currentTrack || isLoading}
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-8 h-8" />
            ) : (
              <Play className="w-8 h-8 ml-1" />
            )}
          </Button>

          <Button
            onClick={handleNext}
            variant="ghost"
            size="lg"
            className="text-white hover:bg-white/20"
            disabled={playlist.length <= 1}
          >
            <SkipForward className="w-6 h-6" />
          </Button>

          <Button
            onClick={() => setIsRepeat(!isRepeat)}
            variant={isRepeat ? 'default' : 'ghost'}
            size="sm"
            className="text-white hover:bg-white/20"
          >
            <Repeat className="w-4 h-4" />
          </Button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-3">
          <Button
            onClick={toggleMute}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 flex-shrink-0"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </Button>

          <Slider
            value={[isMuted ? 0 : volume * 100]}
            onValueChange={handleVolumeChange}
            max={100}
            step={1}
            className="flex-1"
          />
        </div>
      </Card>
    </motion.div>
  );
};

export default AudioPlayer;
