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
  const [summary, setSummary] = useState('');
  const [contents, setContents] = useState('');

  const { data: note } = useQuery<Note>(
    ['note', noteId],
    () => getNote(noteId!),
    {
      enabled: !!noteId,
      onSuccess: (data) => {
        setTitle(data.title);
        setSummary(data.summary);
        setContents(data.contents);
      },
    }
  );

  const createMutation = useMutation(createNote, {
    onSuccess: () => {
      queryClient.invalidateQueries('notes');
      setTitle('');
      setSummary('');
      setContents('');
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      title,
      summary,
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
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            margin="normal"
            required
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
            sx={{ mt: 2 }}
          >
            Create Note
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