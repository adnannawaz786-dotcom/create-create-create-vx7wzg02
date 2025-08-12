// Audio Player Types and Interfaces

export interface AudioFile {
  id: string;
  name: string;
  url: string;
  duration: number;
  size: number;
  type: string;
  uploadedAt: Date;
  lastPlayed?: Date;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  isLoading: boolean;
  error?: string;
}

export interface AudioVisualizationData {
  frequencyData: Uint8Array;
  timeData: Uint8Array;
  analyser: AnalyserNode | null;
  dataArray: Uint8Array;
}

export interface PlayerControls {
  play: () => void;
  pause: () => void;
  stop: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setPlaybackRate: (rate: number) => void;
  skipForward: (seconds?: number) => void;
  skipBackward: (seconds?: number) => void;
}

export interface AudioPlayerConfig {
  enableVisualization: boolean;
  visualizationType: 'bars' | 'wave' | 'circle';
  skipInterval: number;
  autoPlay: boolean;
  loop: boolean;
  crossfade: boolean;
  equalizer: boolean;
}

export interface EqualizerBand {
  frequency: number;
  gain: number;
  Q: number;
}

export interface AudioContext {
  context: AudioContext | null;
  source: AudioBufferSourceNode | null;
  analyser: AnalyserNode | null;
  gainNode: GainNode | null;
  filters: BiquadFilterNode[];
}

export interface PlaylistItem {
  id: string;
  audioFile: AudioFile;
  order: number;
  isActive: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  items: PlaylistItem[];
  currentIndex: number;
  shuffle: boolean;
  repeat: 'none' | 'one' | 'all';
  createdAt: Date;
  updatedAt: Date;
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

export interface StorageQuota {
  used: number;
  total: number;
  available: number;
  percentage: number;
}

export interface AudioMetadata {
  title?: string;
  artist?: string;
  album?: string;
  year?: number;
  genre?: string;
  duration: number;
  bitrate?: number;
  sampleRate?: number;
  channels?: number;
}

export interface VisualizationSettings {
  barCount: number;
  barWidth: number;
  barSpacing: number;
  smoothing: number;
  colorScheme: 'gradient' | 'solid' | 'rainbow';
  primaryColor: string;
  secondaryColor: string;
  sensitivity: number;
  showPeaks: boolean;
  mirrorEffect: boolean;
}

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: string;
  description: string;
}

export interface ThemeConfig {
  mode: 'light' | 'dark' | 'auto';
  primaryColor: string;
  accentColor: string;
  glassMorphism: boolean;
  blurIntensity: number;
  transparency: number;
}

export interface AudioPlayerError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export interface AudioPlayerSettings {
  theme: ThemeConfig;
  visualization: VisualizationSettings;
  playback: AudioPlayerConfig;
  shortcuts: KeyboardShortcut[];
  autoSave: boolean;
  notifications: boolean;
}

export interface LocalStorageData {
  audioFiles: AudioFile[];
  playlists: Playlist[];
  settings: AudioPlayerSettings;
  lastPlayed?: string;
  version: string;
}

export type AudioFileFormat = 'mp3' | 'wav' | 'ogg' | 'flac' | 'm4a' | 'aac';

export type VisualizationType = 'bars' | 'wave' | 'circle' | 'spectrum' | 'waveform';

export type PlaybackSpeed = 0.25 | 0.5 | 0.75 | 1 | 1.25 | 1.5 | 1.75 | 2;

export type RepeatMode = 'none' | 'one' | 'all';

export type ShuffleMode = 'off' | 'on';

// Event Types
export interface AudioPlayerEvent {
  type: string;
  timestamp: Date;
  data?: any;
}

export interface PlaybackEvent extends AudioPlayerEvent {
  type: 'play' | 'pause' | 'stop' | 'seek' | 'ended' | 'timeupdate' | 'volumechange';
  currentTime?: number;
  duration?: number;
  volume?: number;
}

export interface FileEvent extends AudioPlayerEvent {
  type: 'upload' | 'delete' | 'select' | 'error';
  fileId?: string;
  fileName?: string;
  error?: string;
}

// Component Props Types
export interface AudioPlayerProps {
  className?: string;
  config?: Partial<AudioPlayerConfig>;
  onPlaybackChange?: (state: PlaybackState) => void;
  onFileSelect?: (file: AudioFile) => void;
  onError?: (error: AudioPlayerError) => void;
}

export interface AudioUploaderProps {
  className?: string;
  accept?: string[];
  maxFileSize?: number;
  maxFiles?: number;
  onUpload?: (files: AudioFile[]) => void;
  onProgress?: (progress: UploadProgress[]) => void;
  onError?: (error: string) => void;
}

export interface VisualizerProps {
  className?: string;
  audioContext?: AudioContext;
  settings?: VisualizationSettings;
  isPlaying?: boolean;
  width?: number;
  height?: number;
}