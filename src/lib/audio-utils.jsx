// Dependencies: None required - using Web Audio API and Canvas API

/**
 * Audio utilities for MP3 player with visualization capabilities
 * Handles audio processing, visualization, and Web Audio API integration
 */

// Audio context instance
let audioContext = null;
let analyserNode = null;
let sourceNode = null;
let gainNode = null;

/**
 * Initialize Web Audio API context
 */
export const initializeAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyserNode = audioContext.createAnalyser();
    gainNode = audioContext.createGain();
    
    analyserNode.fftSize = 256;
    analyserNode.smoothingTimeConstant = 0.8;
    
    gainNode.connect(analyserNode);
    analyserNode.connect(audioContext.destination);
  }
  return audioContext;
};

/**
 * Connect audio element to Web Audio API
 */
export const connectAudioElement = (audioElement) => {
  if (!audioContext || !audioElement) return;
  
  try {
    if (sourceNode) {
      sourceNode.disconnect();
    }
    
    sourceNode = audioContext.createMediaElementSource(audioElement);
    sourceNode.connect(gainNode);
  } catch (error) {
    console.warn('Audio connection failed:', error);
  }
};

/**
 * Get audio frequency data for visualization
 */
export const getAudioData = () => {
  if (!analyserNode) return new Uint8Array(128);
  
  const bufferLength = analyserNode.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyserNode.getByteFrequencyData(dataArray);
  
  return dataArray;
};

/**
 * Get audio time domain data for waveform
 */
export const getWaveformData = () => {
  if (!analyserNode) return new Uint8Array(128);
  
  const bufferLength = analyserNode.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyserNode.getByteTimeDomainData(dataArray);
  
  return dataArray;
};

/**
 * Set audio volume
 */
export const setVolume = (volume) => {
  if (gainNode) {
    gainNode.gain.value = Math.max(0, Math.min(1, volume));
  }
};

/**
 * Resume audio context if suspended
 */
export const resumeAudioContext = async () => {
  if (audioContext && audioContext.state === 'suspended') {
    try {
      await audioContext.resume();
    } catch (error) {
      console.warn('Failed to resume audio context:', error);
    }
  }
};

/**
 * Format time in MM:SS format
 */
export const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Create canvas visualization for audio data
 */
export const drawVisualization = (canvas, audioData, type = 'bars') => {
  if (!canvas || !audioData) return;
  
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  if (type === 'bars') {
    drawBars(ctx, audioData, width, height);
  } else if (type === 'wave') {
    drawWaveform(ctx, audioData, width, height);
  } else if (type === 'circle') {
    drawCircularVisualization(ctx, audioData, width, height);
  }
};

/**
 * Draw bar visualization
 */
const drawBars = (ctx, audioData, width, height) => {
  const barCount = Math.min(64, audioData.length);
  const barWidth = width / barCount;
  
  for (let i = 0; i < barCount; i++) {
    const barHeight = (audioData[i] / 255) * height * 0.8;
    const x = i * barWidth;
    const y = height - barHeight;
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, height, 0, y);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
    gradient.addColorStop(0.5, 'rgba(147, 51, 234, 0.8)');
    gradient.addColorStop(1, 'rgba(236, 72, 153, 0.8)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, barWidth - 2, barHeight);
  }
};

/**
 * Draw waveform visualization
 */
const drawWaveform = (ctx, audioData, width, height) => {
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  
  const sliceWidth = width / audioData.length;
  let x = 0;
  
  for (let i = 0; i < audioData.length; i++) {
    const v = (audioData[i] - 128) / 128;
    const y = (v * height) / 2 + height / 2;
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
    
    x += sliceWidth;
  }
  
  ctx.stroke();
};

/**
 * Draw circular visualization
 */
const drawCircularVisualization = (ctx, audioData, width, height) => {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 4;
  
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.stroke();
  
  const barCount = Math.min(64, audioData.length);
  const angleStep = (2 * Math.PI) / barCount;
  
  for (let i = 0; i < barCount; i++) {
    const angle = i * angleStep;
    const barHeight = (audioData[i] / 255) * radius * 0.8;
    
    const x1 = centerX + Math.cos(angle) * radius;
    const y1 = centerY + Math.sin(angle) * radius;
    const x2 = centerX + Math.cos(angle) * (radius + barHeight);
    const y2 = centerY + Math.sin(angle) * (radius + barHeight);
    
    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
    gradient.addColorStop(1, 'rgba(147, 51, 234, 0.8)');
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
};

/**
 * Validate audio file type
 */
export const isValidAudioFile = (file) => {
  const validTypes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/aac',
    'audio/m4a',
    'audio/webm'
  ];
  
  return validTypes.includes(file.type) || 
         /\.(mp3|wav|ogg|aac|m4a|webm)$/i.test(file.name);
};

/**
 * Convert file to base64 for storage
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Get audio metadata from file
 */
export const getAudioMetadata = (file) => {
  return new Promise((resolve) => {
    const audio = new Audio();
    const url = URL.createObjectURL(file);
    
    audio.addEventListener('loadedmetadata', () => {
      const metadata = {
        duration: audio.duration,
        name: file.name.replace(/\.[^/.]+$/, ''),
        size: file.size,
        type: file.type
      };
      
      URL.revokeObjectURL(url);
      resolve(metadata);
    });
    
    audio.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      resolve({
        duration: 0,
        name: file.name.replace(/\.[^/.]+$/, ''),
        size: file.size,
        type: file.type
      });
    });
    
    audio.src = url;
  });
};

/**
 * Create audio visualization animation frame
 */
export const createVisualizationLoop = (canvas, type = 'bars') => {
  let animationId = null;
  
  const animate = () => {
    const audioData = getAudioData();
    drawVisualization(canvas, audioData, type);
    animationId = requestAnimationFrame(animate);
  };
  
  const start = () => {
    if (!animationId) {
      animate();
    }
  };
  
  const stop = () => {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  };
  
  return { start, stop };
};

/**
 * Calculate audio levels for simple visualization
 */
export const getAudioLevel = () => {
  if (!analyserNode) return 0;
  
  const bufferLength = analyserNode.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyserNode.getByteFrequencyData(dataArray);
  
  let sum = 0;
  for (let i = 0; i < bufferLength; i++) {
    sum += dataArray[i];
  }
  
  return sum / bufferLength / 255;
};

/**
 * Apply audio effects
 */
export const createAudioEffects = () => {
  if (!audioContext) return null;
  
  const effects = {
    lowpass: audioContext.createBiquadFilter(),
    highpass: audioContext.createBiquadFilter(),
    reverb: audioContext.createConvolver()
  };
  
  effects.lowpass.type = 'lowpass';
  effects.lowpass.frequency.value = 20000;
  
  effects.highpass.type = 'highpass';
  effects.highpass.frequency.value = 20;
  
  return effects;
};

/**
 * Cleanup audio resources
 */
export const cleanupAudio = () => {
  if (sourceNode) {
    sourceNode.disconnect();
    sourceNode = null;
  }
  
  if (audioContext && audioContext.state !== 'closed') {
    audioContext.close();
    audioContext = null;
    analyserNode = null;
    gainNode = null;
  }
};