import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
} from '@mui/material';
import { getNote, createNote, updateNote } from '../api';
import { Note } from '../types';
import VoiceRecorder from './VoiceRecorder';

interface NoteEditorProps {
  noteId: string | null;
  isCreating: boolean;
  onClose: () => void;
}

export default function NoteEditor({ noteId, isCreating, onClose }: NoteEditorProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [contents, setContents] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const contentsRef = useRef<HTMLTextAreaElement>(null);

  // Clear form when entering create mode
  useEffect(() => {
    if (isCreating) {
      setTitle('');
      setContents('');
      setIsEditing(false);
    }
  }, [isCreating]);

  const { data: note } = useQuery<Note>(
    ['note', noteId],
    () => getNote(noteId!),
    {
      enabled: !!noteId,
      onSuccess: (data) => {
        // Only populate form fields if we're not in create mode
        if (!isCreating) {
          setTitle(data.title);
          setContents(data.contents);
        }
        setIsEditing(false);
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

  const updateMutation = useMutation(
    ({ timestamp, note }: { timestamp: string; note: { title?: string; contents: string } }) => 
      updateNote(timestamp, note),
    {
      onSuccess: (data) => {
        console.log('Note updated successfully:', data);
        queryClient.invalidateQueries('notes');
        queryClient.invalidateQueries(['note', noteId]);
        setIsEditing(false);
      },
      onError: (error: any) => {
        console.error('Error updating note:', error);
        console.error('Error response:', error.response?.data);
        console.error('Error status:', error.response?.status);
        alert(`Failed to update note: ${error.response?.data?.detail || error.message || 'Unknown error'}`);
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contents.trim()) {
      alert('Please enter some content for the note.');
      return;
    }
    
    console.log('Submitting note:', { title, contents });
    
    if (isEditing && noteId) {
      // Update existing note
      updateMutation.mutate({
        timestamp: noteId,
        note: { title, contents }
      });
    } else {
      // Create new note
      createMutation.mutate({
        title,
        contents,
      });
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (note) {
      setTitle(note.title);
      setContents(note.contents);
    }
    setIsEditing(false);
  };

  const handleTranscriptionComplete = (transcribedText: string) => {
    const textarea = contentsRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentText = contents;
      
      // Insert transcribed text at cursor position
      const newText = currentText.substring(0, start) + transcribedText + currentText.substring(end);
      setContents(newText);
      
      // Set cursor position after the inserted text
      setTimeout(() => {
        if (textarea) {
          const newCursorPos = start + transcribedText.length;
          textarea.setSelectionRange(newCursorPos, newCursorPos);
          textarea.focus();
        }
      }, 0);
    }
  };

  // Show create form if isCreating is true or if no note is selected
  if (isCreating || !noteId) {
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
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mt: 2 }}>
            <TextField
              fullWidth
              label="Contents"
              value={contents}
              onChange={(e) => setContents(e.target.value)}
              required
              multiline
              rows={10}
              inputRef={contentsRef}
            />
            <VoiceRecorder 
              onTranscriptionComplete={handleTranscriptionComplete}
              disabled={createMutation.isLoading}
            />
          </Box>
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={createMutation.isLoading}
            >
              {createMutation.isLoading ? 'Creating...' : 'Create Note'}
            </Button>
            <Button
              variant="outlined"
              onClick={onClose}
              disabled={createMutation.isLoading}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Paper>
    );
  }

  // Show edit form if editing
  if (isEditing) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Edit Note
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Title (optional - will be auto-generated if left empty)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            margin="normal"
          />
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mt: 2 }}>
            <TextField
              fullWidth
              label="Contents"
              value={contents}
              onChange={(e) => setContents(e.target.value)}
              required
              multiline
              rows={10}
              inputRef={contentsRef}
            />
            <VoiceRecorder 
              onTranscriptionComplete={handleTranscriptionComplete}
              disabled={updateMutation.isLoading}
            />
          </Box>
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={updateMutation.isLoading}
            >
              {updateMutation.isLoading ? 'Updating...' : 'Update Note'}
            </Button>
            <Button
              variant="outlined"
              onClick={handleCancel}
              disabled={updateMutation.isLoading}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Paper>
    );
  }

  // Show note view if a note is selected and not editing
  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          {note?.title}
        </Typography>
        <Button
          variant="outlined"
          onClick={handleEdit}
          size="small"
        >
          Edit
        </Button>
      </Box>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        {note?.summary}
      </Typography>
      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
        {note?.contents}
      </Typography>
    </Paper>
  );
} 