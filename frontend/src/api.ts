import axios from 'axios';
import { Note } from './types';

const api = axios.create({
  baseURL: 'http://localhost:8000',
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