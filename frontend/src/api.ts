import axios from 'axios';
import { Note } from './types';

const api = axios.create({
  baseURL: 'http://localhost:8000',
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

export const getNote = async (timestamp: string): Promise<Note> => {
  const response = await api.get(`/notes/${timestamp}`);
  return response.data;
};

export const createNote = async (note: Omit<Note, 'timestamp'>): Promise<Note> => {
  const response = await api.post('/notes/', note);
  return response.data;
};

export const deleteNote = async (timestamp: string): Promise<void> => {
  await api.delete(`/notes/${timestamp}`);
}; 