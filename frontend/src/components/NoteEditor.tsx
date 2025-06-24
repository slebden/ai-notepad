import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
} from '@mui/material';
import { getNote, createNote } from '../api';
import { Note } from '../types';

interface NoteEditorProps {
  noteId: string | null;
  onClose: () => void;
}

export default function NoteEditor({ noteId, onClose }: NoteEditorProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [contents, setContents] = useState('');

  const { data: note } = useQuery<Note>(
    ['note', noteId],
    () => getNote(noteId!),
    {
      enabled: !!noteId,
      onSuccess: (data) => {
        setTitle(data.title);
        setContents(data.contents);
      },
    }
  );

  const createMutation = useMutation(createNote, {
    onSuccess: (data) => {
      console.log('Note created successfully:', data);
      queryClient.invalidateQueries('notes');
      setTitle('');
      setContents('');
      onClose();
    },
    onError: (error: any) => {
      console.error('Error creating note:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      alert(`Failed to create note: ${error.response?.data?.detail || error.message || 'Unknown error'}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contents.trim()) {
      alert('Please enter some content for the note.');
      return;
    }
    
    console.log('Submitting note:', { title, contents });
    createMutation.mutate({
      title,
      contents,
    });
  };

  if (!noteId) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Create New Note
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Title (optional - will be auto-generated if left empty)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Contents"
            value={contents}
            onChange={(e) => setContents(e.target.value)}
            margin="normal"
            required
            multiline
            rows={10}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={createMutation.isLoading}
            sx={{ mt: 2 }}
          >
            {createMutation.isLoading ? 'Creating...' : 'Create Note'}
          </Button>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {note?.title}
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        {note?.summary}
      </Typography>
      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
        {note?.contents}
      </Typography>
    </Paper>
  );
} 