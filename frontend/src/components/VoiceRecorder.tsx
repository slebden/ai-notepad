import React, { useState, useRef } from 'react';
import { IconButton, CircularProgress, Tooltip, useMediaQuery, useTheme } from '@mui/material';
import { Mic, Stop, MicOff } from '@mui/icons-material';
import { transcribeAudio } from '../api';

interface VoiceRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  disabled?: boolean;
}

export default function VoiceRecorder({ onTranscriptionComplete, disabled = false }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        setIsTranscribing(true);
        
        try {
          // Convert audio chunks to blob
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          // Convert to WAV format for better compatibility
          const wavBlob = await convertToWav(audioBlob);
          
          // Send to transcription service
          const result = await transcribeAudio(wavBlob);
          onTranscriptionComplete(result.transcription);
        } catch (error) {
          console.error('Transcription error:', error);
          alert('Failed to transcribe audio. Please try again.');
        } finally {
          setIsTranscribing(false);
        }
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setHasPermission(false);
      alert('Microphone access denied. Please allow microphone access and try again.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const convertToWav = async (audioBlob: Blob): Promise<Blob> => {
    // Create an audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Convert blob to array buffer
    const arrayBuffer = await audioBlob.arrayBuffer();
    
    // Decode the audio data
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Create WAV file
    const wavBuffer = audioBufferToWav(audioBuffer);
    
    return new Blob([wavBuffer], { type: 'audio/wav' });
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

  if (hasPermission === false) {
    return (
      <Tooltip title="Microphone access denied">
        <IconButton 
          disabled 
          color="error"
          size={isMobile ? "large" : "medium"}
        >
          <MicOff />
        </IconButton>
      </Tooltip>
    );
  }

  return (
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
  );
} 