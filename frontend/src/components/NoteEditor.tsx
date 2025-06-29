import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  useMediaQuery,
  useTheme,
  Stack,
  IconButton,
  Chip,
} from '@mui/material';
import { getNote, createNote, updateNote } from '../api';
import { Note } from '../types';
import VoiceRecorder from './VoiceRecorder';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';

interface NoteEditorProps {
  noteId: string | null;
  isCreating: boolean;
  onClose: () => void;
}

export default function NoteEditor({ noteId, isCreating, onClose }: NoteEditorProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [contents, setContents] = useState('');
  const [tags, setTags] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const contentsRef = useRef<HTMLTextAreaElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Clear form when entering create mode
  useEffect(() => {
    if (isCreating) {
      setTitle('');
      setContents('');
      setTags('');
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
          setTags(data.tags.join(', '));
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
      setTags('');
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
    ({ timestamp, note }: { timestamp: string; note: { title?: string; contents: string; tags?: string } }) => 
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
    
    console.log('Submitting note:', { title, contents, tags });
    
    if (isEditing && noteId) {
      // Update existing note
      updateMutation.mutate({
        timestamp: noteId,
        note: { title, contents, tags }
      });
    } else {
      // Create new note
      createMutation.mutate({
        title,
        contents,
        tags,
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
      setTags(note.tags.join(', '));
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
      <Paper sx={{ p: { xs: 2, md: 3 }, height: '100%' }}>
        <Box component="form" onSubmit={handleSubmit}>
          <div className="note-editor">
            <div className="editor-header">
              <input
                type="text"
                placeholder="Note title (optional - will be auto-generated)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="title-input"
              />
              <div className="editor-actions">
                <button
                  onClick={onClose}
                  disabled={createMutation.isLoading}
                  className="save-button"
                >
                  {createMutation.isLoading ? "Creating..." : "Cancel"}
                </button>
              </div>
            </div>
            
            <div className="tags-section">
              <input
                type="text"
                placeholder="Tags (optional - separate with commas)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="tags-input"
              />
              <div className="tags-hint">
                💡 Tip: You can also add tags at the beginning of your note like "tag: journal. This is my note content"
              </div>
            </div>
            
            <textarea
              placeholder="Start typing your note... (tags, title, and summary will be auto-generated if not provided)"
              value={contents}
              onChange={(e) => setContents(e.target.value)}
              className="content-textarea"
              rows={10}
            />
          </div>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
            <VoiceRecorder 
              onTranscriptionComplete={handleTranscriptionComplete}
              disabled={createMutation.isLoading}
            />
          </Box>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={createMutation.isLoading}
              startIcon={<SaveIcon />}
            >
              {createMutation.isLoading ? 'Creating...' : 'Create Note'}
            </Button>
          </Stack>
        </Box>
      </Paper>
    );
  }

  // Show edit form if editing
  if (isEditing) {
    return (
      <Paper sx={{ p: { xs: 2, md: 3 }, height: '100%' }}>
        <Box component="form" onSubmit={handleSubmit}>
          <div className="note-editor">
            <div className="editor-header">
              <input
                type="text"
                placeholder="Note title (optional - will be auto-generated)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="title-input"
              />
              <div className="editor-actions">
                <button
                  onClick={handleCancel}
                  disabled={updateMutation.isLoading}
                  className="save-button"
                >
                  {updateMutation.isLoading ? "Updating..." : "Cancel"}
                </button>
              </div>
            </div>
            
            <div className="tags-section">
              <input
                type="text"
                placeholder="Tags (optional - separate with commas)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="tags-input"
              />
              <div className="tags-hint">
                💡 Tip: You can also add tags at the beginning of your note like "tag: journal. This is my note content"
              </div>
            </div>
            
            <textarea
              placeholder="Start typing your note... (tags, title, and summary will be auto-generated if not provided)"
              value={contents}
              onChange={(e) => setContents(e.target.value)}
              className="content-textarea"
              rows={10}
            />
          </div>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
            <VoiceRecorder 
              onTranscriptionComplete={handleTranscriptionComplete}
              disabled={updateMutation.isLoading}
            />
          </Box>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={updateMutation.isLoading}
              startIcon={<SaveIcon />}
            >
              {updateMutation.isLoading ? 'Updating...' : 'Update Note'}
            </Button>
          </Stack>
        </Box>
      </Paper>
    );
  }

  // Show note view if a note is selected and not editing
  return (
    <Paper sx={{ p: { xs: 2, md: 3 }, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
          {note?.title}
        </Typography>
        <Button
          variant="outlined"
          onClick={handleEdit}
          size={isMobile ? "small" : "medium"}
          startIcon={<SaveIcon />}
        >
          Edit
        </Button>
      </Box>
      <Typography 
        variant="subtitle1" 
        color="text.secondary" 
        gutterBottom
        sx={{ mb: 2, fontStyle: 'italic' }}
      >
        {note?.summary}
      </Typography>
      {note?.tags && note.tags.length > 0 && (
        <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {note.tags.map((tag, index) => (
            <Chip
              key={index}
              label={tag}
              size="small"
              icon={<LocalOfferIcon />}
              variant="outlined"
              color="primary"
            />
          ))}
        </Box>
      )}
      <Typography 
        variant="body1" 
        sx={{ 
          whiteSpace: 'pre-wrap',
          lineHeight: 1.6,
          fontSize: { xs: '0.9rem', md: '1rem' }
        }}
      >
        {note?.contents}
      </Typography>
    </Paper>
  );
} 