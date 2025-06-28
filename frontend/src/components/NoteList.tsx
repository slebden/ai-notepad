import { useQuery } from 'react-query';
import { format } from 'date-fns';
import {
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Typography,
  IconButton,
  Box,
  Divider,
  Chip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { getAllNotes, deleteNote } from '../api';
import { Note } from '../types';

interface NoteListProps {
  onSelectNote: (timestamp: string) => void;
  selectedNote: string | null;
}

export default function NoteList({ onSelectNote, selectedNote }: NoteListProps) {
  const { data: notes = [], refetch } = useQuery<Note[]>(
    'notes',
    () => {
      console.log('Fetching all notes...');
      return getAllNotes();
    },
    { 
      enabled: true 
    }
  );

  console.log('Current notes:', notes.length, 'notes loaded');

  const handleDelete = async (timestamp: string) => {
    await deleteNote(timestamp);
    refetch();
  };

  if (notes.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No notes yet. Create your first note!
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <List sx={{ p: 0 }}>
        {notes.map((note, index) => (
          <Box key={note.timestamp}>
            <ListItem
              sx={{ px: 0, py: 0 }}
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(note.timestamp);
                  }}
                  sx={{ 
                    mr: 1,
                    '&:hover': {
                      backgroundColor: 'error.light',
                      color: 'error.contrastText',
                    }
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              }
              disablePadding
            >
              <ListItemButton
                selected={selectedNote === note.timestamp}
                onClick={() => onSelectNote(note.timestamp)}
                sx={{
                  borderRadius: 1,
                  mx: 1,
                  mb: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.light',
                    '&:hover': {
                      backgroundColor: 'primary.main',
                    },
                  },
                }}
              >
                <ListItemText
                  primary={
                    <Typography 
                      variant="subtitle1" 
                      component="div"
                      sx={{ 
                        fontWeight: selectedNote === note.timestamp ? 600 : 400,
                        mb: 0.5
                      }}
                    >
                      {note.title}
                    </Typography>
                  }
                  secondary={
                    <Box>
                      <Chip
                        label={format(new Date(note.timestamp), 'MMM d, yyyy')}
                        size="small"
                        variant="outlined"
                        sx={{ mb: 1, fontSize: '0.75rem' }}
                      />
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: 1.4,
                        }}
                      >
                        {note.summary}
                      </Typography>
                    </Box>
                  }
                />
              </ListItemButton>
            </ListItem>
            {index < notes.length - 1 && <Divider sx={{ mx: 2 }} />}
          </Box>
        ))}
      </List>
    </Box>
  );
} 