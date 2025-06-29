import React, { useState, useEffect } from 'react';
import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  SelectChangeEvent,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useQuery } from 'react-query';
import { getAllTags } from '../api';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';

interface TagFilterProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export default function TagFilter({ selectedTags, onTagsChange }: TagFilterProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { data: allTags = [], isLoading, error } = useQuery('tags', getAllTags, {
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const handleChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const tags = typeof value === 'string' ? value.split(',') : value;
    onTagsChange(tags);
  };

  const handleTagClick = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const handleClearAll = () => {
    onTagsChange([]);
  };

  if (isLoading) {
    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Loading tags...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="error">
          Failed to load tags
        </Typography>
      </Box>
    );
  }

  if (allTags.length === 0) {
    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          No tags available
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <LocalOfferIcon fontSize="small" color="primary" />
        <Typography variant="subtitle2" color="primary">
          Filter by tags:
        </Typography>
        {selectedTags.length > 0 && (
          <Chip
            label="Clear all"
            size="small"
            variant="outlined"
            onClick={handleClearAll}
            sx={{ cursor: 'pointer' }}
          />
        )}
      </Box>
      
      {isMobile ? (
        // Mobile: Use select dropdown
        <FormControl fullWidth size="small">
          <InputLabel>Select tags</InputLabel>
          <Select
            multiple
            value={selectedTags}
            onChange={handleChange}
            input={<OutlinedInput label="Select tags" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip key={value} label={value} size="small" />
                ))}
              </Box>
            )}
          >
            {allTags.map((tag) => (
              <MenuItem key={tag} value={tag}>
                {tag}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ) : (
        // Desktop: Show all tags as clickable chips
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {allTags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              variant={selectedTags.includes(tag) ? "filled" : "outlined"}
              color={selectedTags.includes(tag) ? "primary" : "default"}
              onClick={() => handleTagClick(tag)}
              sx={{ cursor: 'pointer' }}
            />
          ))}
        </Box>
      )}
      
      {selectedTags.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Showing notes with tags: {selectedTags.join(', ')}
          </Typography>
        </Box>
      )}
    </Box>
  );
} 