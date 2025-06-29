import { useState } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider, CssBaseline, useMediaQuery } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import NoteList from './components/NoteList';
import NoteEditor from './components/NoteEditor';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Drawer,
  AppBar,
  Toolbar,
  IconButton,
  useTheme,
  Fab
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

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
  components: {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          width: 320,
          maxWidth: '100vw',
        },
      },
    },
  },
});

const queryClient = new QueryClient();

function App() {
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const themeHook = useTheme();
  const isMobile = useMediaQuery(themeHook.breakpoints.down('md'));

  const handleNewNote = () => {
    setIsCreating(true);
    setSelectedNote(null);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleCloseEditor = () => {
    setIsCreating(false);
    setSelectedNote(null);
  };

  const handleNoteSelect = (noteId: string) => {
    setSelectedNote(noteId);
    setIsCreating(false);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleNoteEdit = (noteId: string) => {
    setSelectedNote(noteId);
    setIsCreating(false);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleNoteDelete = async (noteId: string) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        // Import the delete function dynamically to avoid circular imports
        const { deleteNote } = await import('./api');
        await deleteNote(noteId);
        
        // If the deleted note was selected, clear the selection
        if (selectedNote === noteId) {
          setSelectedNote(null);
          setIsCreating(false);
        }
      } catch (error) {
        console.error('Failed to delete note:', error);
        alert('Failed to delete note');
      }
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawerContent = (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="h2">
          Notes
        </Typography>
        {isMobile && (
          <IconButton onClick={handleDrawerToggle}>
            <CloseIcon />
          </IconButton>
        )}
      </Box>
      <NoteList 
        selectedNoteId={selectedNote}
        onNoteSelect={handleNoteSelect}
        onNoteEdit={handleNoteEdit}
        onNoteDelete={handleNoteDelete}
      />
    </Box>
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          {/* App Bar for Mobile */}
          {isMobile && (
            <AppBar position="static">
              <Toolbar>
                <IconButton
                  color="inherit"
                  aria-label="open drawer"
                  edge="start"
                  onClick={handleDrawerToggle}
                  sx={{ mr: 2 }}
                >
                  <MenuIcon />
                </IconButton>
                <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
                  Notepad
                </Typography>
                <Button
                  color="inherit"
                  startIcon={<AddIcon />}
                  onClick={handleNewNote}
                >
                  New
                </Button>
              </Toolbar>
            </AppBar>
          )}

          <Box sx={{ display: 'flex', flex: 1 }}>
            {/* Desktop Layout */}
            {!isMobile && (
              <Container maxWidth="lg" sx={{ display: 'flex', gap: 2, py: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h3" component="h1">
                      Notepad
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleNewNote}
                      sx={{ minWidth: 120 }}
                    >
                      New Note
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
                    <Box sx={{ flex: 1, maxWidth: 400 }}>
                      {drawerContent}
                    </Box>
                    <Box sx={{ flex: 2 }}>
                      <NoteEditor 
                        noteId={selectedNote} 
                        isCreating={isCreating}
                        onClose={handleCloseEditor} 
                      />
                    </Box>
                  </Box>
                </Box>
              </Container>
            )}

            {/* Mobile Layout */}
            {isMobile && (
              <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', flex: 1 }}>
                <Box sx={{ flex: 1, p: 2 }}>
                  <NoteEditor 
                    noteId={selectedNote} 
                    isCreating={isCreating}
                    onClose={handleCloseEditor} 
                  />
                </Box>
              </Box>
            )}

            {/* Mobile Drawer */}
            {isMobile && (
              <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{
                  keepMounted: true, // Better open performance on mobile.
                }}
                sx={{
                  display: { xs: 'block' },
                  '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 320 },
                }}
              >
                {drawerContent}
              </Drawer>
            )}
          </Box>

          {/* Floating Action Button for Mobile */}
          {isMobile && (
            <Fab
              color="primary"
              aria-label="add"
              onClick={handleNewNote}
              sx={{
                position: 'fixed',
                bottom: 16,
                right: 16,
              }}
            >
              <AddIcon />
            </Fab>
          )}
        </Box>
        <style>{`
          body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
              'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
              sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          
          .note-editor {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
          
          .editor-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
          }
          
          .title-input {
            flex: 1;
            padding: 12px 16px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 16px;
            font-family: inherit;
          }
          
          .title-input:focus {
            outline: none;
            border-color: #1976d2;
            box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
          }
          
          .editor-actions {
            display: flex;
            gap: 8px;
          }
          
          .save-button {
            padding: 8px 16px;
            border: 1px solid #ddd;
            border-radius: 6px;
            background: #f5f5f5;
            cursor: pointer;
            font-size: 14px;
          }
          
          .save-button:hover {
            background: #e0e0e0;
          }
          
          .save-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          
          .tags-section {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          
          .tags-input {
            padding: 12px 16px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 16px;
            font-family: inherit;
          }
          
          .tags-input:focus {
            outline: none;
            border-color: #1976d2;
            box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
          }
          
          .tags-hint {
            font-size: 12px;
            color: #666;
            background: #f8f9fa;
            padding: 8px 12px;
            border-radius: 6px;
            border-left: 3px solid #1976d2;
          }
          
          .content-textarea {
            width: 100%;
            padding: 16px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 16px;
            font-family: inherit;
            resize: vertical;
            min-height: 200px;
            line-height: 1.5;
          }
          
          .content-textarea:focus {
            outline: none;
            border-color: #1976d2;
            box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
          }
          
          .content-textarea::placeholder {
            color: #999;
          }
        `}</style>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App; 