import { useState } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import NoteList from './components/NoteList';
import NoteEditor from './components/NoteEditor';
import { Box, Container, Typography } from '@mui/material';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const queryClient = new QueryClient();

function App() {
  const [selectedNote, setSelectedNote] = useState<string | null>(null);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Container maxWidth="lg">
          <Box sx={{ my: 4 }}>
            <Typography variant="h3" component="h1" gutterBottom>
              Notepad
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <NoteList onSelectNote={setSelectedNote} selectedNote={selectedNote} />
              </Box>
              <Box sx={{ flex: 2 }}>
                <NoteEditor noteId={selectedNote} onClose={() => setSelectedNote(null)} />
              </Box>
            </Box>
          </Box>
        </Container>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App; 