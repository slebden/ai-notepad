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

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Notes
      </Typography>
      <List>
        {notes.map((note) => (
          <ListItem
            key={note.timestamp}
            secondaryAction={
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={() => handleDelete(note.timestamp)}
              >
                <DeleteIcon />
              </IconButton>
            }
            disablePadding
          >
            <ListItemButton
              selected={selectedNote === note.timestamp}
              onClick={() => onSelectNote(note.timestamp)}
            >
              <ListItemText
                primary={note.title}
                secondary={
                  <>
                    <Typography component="span" variant="body2" color="text.primary">
                      {format(new Date(note.timestamp), 'PPp')}
                    </Typography>
                    <br />
                    {note.summary}
                  </>
                }
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
} 