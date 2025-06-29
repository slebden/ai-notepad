import React, { useState } from 'react';
import { useQuery } from 'react-query';
import {
  List,
  ListItem,
  Typography,
  IconButton,
  Box,
  Divider,
  Chip,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import EditIcon from '@mui/icons-material/Edit';
import { getAllNotes, deleteNote, getNotesByTags } from '../api';
import { Note } from '../types';
import TagFilter from './TagFilter';

interface NoteListProps {
  selectedNoteId: string | null;
  onNoteSelect: (noteId: string) => void;
  onNoteEdit: (noteId: string) => void;
  onNoteDelete: (noteId: string) => void;
}

export default function NoteList({ 
  selectedNoteId, 
  onNoteSelect, 
  onNoteEdit, 
  onNoteDelete 
}: NoteListProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Use different query based on whether tags are selected
  const { data: notes = [], isLoading, error } = useQuery(
    ['notes', selectedTags],
    () => selectedTags.length > 0 ? getNotesByTags(selectedTags) : getAllNotes(),
    {
      staleTime: 30 * 1000, // 30 seconds
      refetchOnWindowFocus: false,
    }
  );

  const handleTagsChange = (tags: string[]) => {
    setSelectedTags(tags);
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  if (isLoading) {
    return (
      <Paper sx={{ p: 2, height: '100%' }}>
        <Typography>Loading notes...</Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 2, height: '100%' }}>
        <Typography color="error">Failed to load notes</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
          Notes ({notes.length})
        </Typography>
        <TagFilter selectedTags={selectedTags} onTagsChange={handleTagsChange} />
      </Box>
      
      <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
        {notes.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {selectedTags.length > 0 
                ? `No notes found with tags: ${selectedTags.join(', ')}`
                : 'No notes yet. Create your first note!'
              }
            </Typography>
          </Box>
        ) : (
          notes.map((note, index) => (
            <React.Fragment key={note.timestamp}>
              <ListItem
                button
                selected={selectedNoteId === note.timestamp}
                onClick={() => onNoteSelect(note.timestamp)}
                sx={{
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  py: 2,
                  px: 2,
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="subtitle1"
                      component="h3"
                      sx={{
                        fontWeight: 600,
                        mb: 0.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {note.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: 1.4,
                      }}
                    >
                      {note.contents}
                    </Typography>
                    {note.tags && note.tags.length > 0 && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                        {note.tags.map((tag, tagIndex) => (
                          <Chip
                            key={tagIndex}
                            label={tag}
                            size="small"
                            icon={<LocalOfferIcon />}
                            variant="outlined"
                            color="primary"
                          />
                        ))}
                      </Box>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(note.timestamp)}
                    </Typography>
                  </Box>
                  
                  {!isMobile && (
                    <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNoteEdit(note.timestamp);
                        }}
                        sx={{ color: 'primary.main' }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNoteDelete(note.timestamp);
                        }}
                        sx={{ color: 'error.main' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              </ListItem>
              {index < notes.length - 1 && <Divider />}
            </React.Fragment>
          ))
        )}
      </List>
    </Paper>
  );
} 