import axios from 'axios';
import { Note } from './types';

// Get the current hostname to support local network access
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  const port = hostname === 'localhost' || hostname === '127.0.0.1' ? '8000' : '8000';
  return `http://${hostname}:${port}`;
};

const getTranscriptionBaseUrl = () => {
  const hostname = window.location.hostname;
  const port = hostname === 'localhost' || hostname === '127.0.0.1' ? '8001' : '8001';
  return `http://${hostname}:${port}`;
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000, // 30 second timeout
});

export const getNotes = async (start: Date, end: Date): Promise<Note[]> => {
  const response = await api.get('/notes/', {
    params: {
      start: start.toISOString(),
      end: end.toISOString(),
    },
  });
  return response.data;
};

export const getAllNotes = async (): Promise<Note[]> => {
  const response = await api.get('/notes/all');
  return response.data;
};

export const getNote = async (timestamp: string): Promise<Note> => {
  const response = await api.get(`/notes/${timestamp}`);
  return response.data;
};

export const createNote = async (note: { title?: string; contents: string }): Promise<Note> => {
  const response = await api.post('/notes/', note);
  return response.data;
};

export const updateNote = async (timestamp: string, note: { title?: string; contents: string }): Promise<Note> => {
  const response = await api.put(`/notes/${timestamp}`, note);
  return response.data;
};

export const deleteNote = async (timestamp: string): Promise<void> => {
  await api.delete(`/notes/${timestamp}`);
};

export const transcribeAudio = async (audioBlob: Blob): Promise<{ transcription: string }> => {
  const formData = new FormData();
  formData.append('audio_file', audioBlob, 'recording.wav');
  
  const response = await axios.post(getTranscriptionBaseUrl() + '/transcribe/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 30000, // 30 second timeout for transcription
  });
  return response.data;
}; 