import React, { useState, useRef } from 'react';
import { IconButton, CircularProgress, Tooltip, useMediaQuery, useTheme, Alert, Snackbar, Button } from '@mui/material';
import { Mic, Stop, MicOff, Info } from '@mui/icons-material';
import { transcribeAudio } from '../api';

interface VoiceRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  disabled?: boolean;
}

export default function VoiceRecorder({ onTranscriptionComplete, disabled = false }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showMobileHelp, setShowMobileHelp] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const startRecording = async () => {
    try {
      console.log('Requesting microphone access...');
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser');
      }

      // Request microphone access with more detailed error handling
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      console.log('Microphone access granted:', stream);
      setHasPermission(true);
      setErrorMessage(null);
      
      // Check if we have audio tracks
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error('No audio tracks found in the stream');
      }
      
      console.log('Audio tracks found:', audioTracks.length);
      
      // Try different MIME types for better compatibility
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = '';
          }
        }
      }
      
      console.log('Using MIME type:', mimeType);
      
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        console.log('Data available:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        console.log('Recording stopped, processing audio...');
        setIsRecording(false);
        setIsTranscribing(true);
        
        try {
          // Convert audio chunks to blob
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
          console.log('Audio blob created:', audioBlob.size, 'bytes');
          
          // Convert to WAV format for better compatibility
          const wavBlob = await convertToWav(audioBlob);
          console.log('WAV blob created:', wavBlob.size, 'bytes');
          
          // Send to transcription service
          const result = await transcribeAudio(wavBlob);
          console.log('Transcription result:', result);
          onTranscriptionComplete(result.transcription);
        } catch (error) {
          console.error('Transcription error:', error);
          setErrorMessage(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
          setIsTranscribing(false);
        }
        
        // Stop all tracks
        stream.getTracks().forEach(track => {
          console.log('Stopping track:', track.kind, track.label);
          track.stop();
        });
      };
      
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setErrorMessage('Recording error occurred');
        setIsRecording(false);
      };
      
      mediaRecorder.start();
      console.log('Recording started');
      setIsRecording(true);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setHasPermission(false);
      
      let errorMsg = 'Microphone access denied. ';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMsg += 'Please allow microphone access in your browser settings.';
          if (isMobile) {
            setShowMobileHelp(true);
          }
        } else if (error.name === 'NotFoundError') {
          errorMsg += 'No microphone found on your device.';
        } else if (error.name === 'NotSupportedError') {
          errorMsg += 'Microphone not supported in this browser.';
        } else if (error.name === 'NotReadableError') {
          errorMsg += 'Microphone is already in use by another application.';
        } else {
          errorMsg += error.message;
        }
      }
      
      setErrorMessage(errorMsg);
      console.error('Detailed error:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      console.log('Stopping recording...');
      mediaRecorderRef.current.stop();
    }
  };

  const convertToWav = async (audioBlob: Blob): Promise<Blob> => {
    try {
      // Create an audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Convert blob to array buffer
      const arrayBuffer = await audioBlob.arrayBuffer();
      
      // Decode the audio data
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Create WAV file
      const wavBuffer = audioBufferToWav(audioBuffer);
      
      return new Blob([wavBuffer], { type: 'audio/wav' });
    } catch (error) {
      console.error('Error converting to WAV:', error);
      // Fallback: return original blob
      return audioBlob;
    }
  };

  const audioBufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
    const length = buffer.length;
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * 2, true);
    
    // Convert audio data
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return arrayBuffer;
  };

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleCloseError = () => {
    setErrorMessage(null);
  };

  const handleCloseMobileHelp = () => {
    setShowMobileHelp(false);
  };

  if (hasPermission === false) {
    return (
      <>
        <Tooltip title="Microphone access denied - Tap for help">
          <IconButton 
            onClick={() => setShowMobileHelp(true)}
            color="error"
            size={isMobile ? "large" : "medium"}
          >
            <MicOff />
          </IconButton>
        </Tooltip>
        <Snackbar
          open={showMobileHelp}
          autoHideDuration={15000}
          onClose={handleCloseMobileHelp}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseMobileHelp} severity="info" sx={{ whiteSpace: 'pre-line' }}>
            {isMobile ? 
              'Mobile Microphone Access:\n\n' +
              '1. Tap the lock icon in the address bar\n' +
              '2. Tap "Site settings"\n' +
              '3. Enable "Microphone"\n' +
              '4. Refresh the page\n\n' +
              'If that doesn\'t work, try:\n' +
              '- Using Chrome browser\n' +
              '- Going to chrome://settings/content/microphone\n' +
              '- Adding this site to allowed list'
              :
              'To enable microphone access:\n\n' +
              '1. Click the lock icon in the address bar\n' +
              '2. Click "Site settings"\n' +
              '3. Enable "Microphone"\n' +
              '4. Refresh the page'
            }
          </Alert>
        </Snackbar>
      </>
    );
  }

  return (
    <>
      <Tooltip title={isRecording ? "Stop recording" : "Start voice recording"}>
        <IconButton
          onClick={handleClick}
          disabled={disabled || isTranscribing}
          color={isRecording ? "error" : "primary"}
          size={isMobile ? "large" : "medium"}
          sx={{
            backgroundColor: isRecording ? 'rgba(244, 67, 54, 0.1)' : 'rgba(25, 118, 210, 0.1)',
            '&:hover': {
              backgroundColor: isRecording ? 'rgba(244, 67, 54, 0.2)' : 'rgba(25, 118, 210, 0.2)',
            },
            minWidth: isMobile ? 56 : 48,
            minHeight: isMobile ? 56 : 48,
          }}
        >
          {isTranscribing ? (
            <CircularProgress size={isMobile ? 24 : 20} />
          ) : isRecording ? (
            <Stop />
          ) : (
            <Mic />
          )}
        </IconButton>
      </Tooltip>
      <Snackbar
        open={!!errorMessage}
        autoHideDuration={8000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{ whiteSpace: 'pre-line' }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </>
  );
} 