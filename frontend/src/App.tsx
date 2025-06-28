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

  const handleNoteSelect = (timestamp: string) => {
    setSelectedNote(timestamp);
    setIsCreating(false);
    if (isMobile) {
      setMobileOpen(false);
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
      <NoteList onSelectNote={handleNoteSelect} selectedNote={selectedNote} />
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
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App; 