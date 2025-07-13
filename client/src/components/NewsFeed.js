import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import './NewsFeed.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : 'http://localhost:5000';

function NewsFeed() {
  const [stories, setStories] = useState([]);
  const [tags, setTags] = useState([]);
  const [expandedStories, setExpandedStories] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [showTagFilters, setShowTagFilters] = useState(false);

  useEffect(() => {
    // Connect to Socket.IO
    const socket = io(SOCKET_URL);

    // Fetch initial stories and tags
    const fetchData = async () => {
      try {
        const [storiesResponse, tagsResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/stories`),
          axios.get(`${API_BASE_URL}/tags`)
        ]);
        setStories(storiesResponse.data);
        setTags(tagsResponse.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();

    // Socket event listeners for real-time updates
    socket.on('storyAdded', (newStory) => {
      setStories(prevStories => [newStory, ...prevStories]);
    });

    socket.on('storyUpdated', (updatedStory) => {
      setStories(prevStories => 
        prevStories.map(story => 
          story.id === updatedStory.id ? updatedStory : story
        )
      );
    });

    socket.on('storyDeleted', (storyId) => {
      setStories(prevStories => 
        prevStories.filter(story => story.id !== storyId)
      );
      setExpandedStories(prev => {
        const newSet = new Set(prev);
        newSet.delete(storyId);
        return newSet;
      });
    });

    socket.on('tagAdded', (newTag) => {
      setTags(prevTags => [...prevTags, newTag]);
    });

    socket.on('tagDeleted', (tagId) => {
      setTags(prevTags => prevTags.filter(tag => tag.id !== tagId));
      setSelectedTags(prev => prev.filter(id => id !== tagId));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const toggleStoryExpansion = (storyId) => {
    setExpandedStories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(storyId)) {
        newSet.delete(storyId);
      } else {
        newSet.add(storyId);
      }
      return newSet;
    });
  };

  const truncateText = (text, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleTag = (tagId) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const selectAllTags = () => {
    setSelectedTags(tags.map(tag => tag.id));
  };

  const deselectAllTags = () => {
    setSelectedTags([]);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTags([]);
  };

  const getTagNames = (tagIds) => {
    if (!tagIds || !Array.isArray(tagIds)) return [];
    return tagIds.map(tagId => {
      const tag = tags.find(t => t.id === tagId);
      return tag ? tag.name : '';
    }).filter(name => name);
  };

  const getTagById = (tagId) => {
    return tags.find(tag => tag.id === tagId);
  };

  // Filter stories based on search and tags
  const filteredStories = stories.filter(story => {
    const matchesSearch = !searchTerm || 
      story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTags = selectedTags.length === 0 || 
      (story.tags && story.tags.some(tagId => selectedTags.includes(tagId)));
    
    return matchesSearch && matchesTags;
  });

  if (loading) {
    return (
      <div className="news-feed-container">
        <div className="loading">Loading stories...</div>
      </div>
    );
  }

  return (
    <div className="news-feed-container">
      <header className="news-header">
        <div className="logo-container">
          <h1 className="logo-text">Sunny Isles</h1>
          <div className="sun-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          </div>
        </div>
        <div className="search-filter-container">
          <input
            type="text"
            placeholder="Search stories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <div className="filter-dropdown">
            <button 
              className="filter-icon-btn"
              onClick={() => setShowTagFilters(!showTagFilters)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3"/>
              </svg>
              {selectedTags.length > 0 && (
                <span className="filter-badge">{selectedTags.length}</span>
              )}
            </button>
            {showTagFilters && (
              <div className="filter-dropdown-content">
                <div className="filter-header">
                  <h3>Filter by Tags</h3>
                  <div className="filter-actions">
                    <button onClick={selectAllTags} className="select-all-btn">
                      Select All
                    </button>
                    <button onClick={deselectAllTags} className="deselect-all-btn">
                      Clear All
                    </button>
                  </div>
                </div>
                <div className="tags-list">
                  {tags.map(tag => (
                    <label key={tag.id} className="tag-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag.id)}
                        onChange={() => toggleTag(tag.id)}
                      />
                      <span 
                        className="tag-label"
                        style={{ 
                          backgroundColor: selectedTags.includes(tag.id) ? tag.color : 'transparent',
                          borderColor: tag.color,
                          color: selectedTags.includes(tag.id) ? 'white' : tag.color
                        }}
                      >
                        {tag.name}
                      </span>
                    </label>
                  ))}
                </div>
                {(searchTerm || selectedTags.length > 0) && (
                  <button onClick={clearFilters} className="clear-filters-btn">
                    Clear All Filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>
      
      <div className="stories-container">
        {filteredStories.length === 0 ? (
          <div className="no-stories">
            <h2>
              {stories.length === 0 ? 'No stories yet' : 'No stories match your filters'}
            </h2>
            <p>
              {stories.length === 0 
                ? 'Check back later for the latest news!' 
                : 'Try adjusting your search or filters.'
              }
            </p>
          </div>
        ) : (
          filteredStories.map(story => (
            <div key={story.id} className="story-card">
              <div className="story-content">
                {story.image && (
                  <div className="story-image">
                    <img 
                      src={story.image.startsWith('http') ? story.image : `http://localhost:5000${story.image}`}
                      alt={story.title}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="story-text">
                  <h2 className="story-title">{story.title}</h2>
                  <div className="story-meta">
                    <span className="story-author">By {story.author}</span>
                    <span className="story-date">{formatDate(story.createdAt)}</span>
                  </div>
                  {story.tags && story.tags.length > 0 && (
                    <div className="story-tags">
                      {story.tags.map(tagId => {
                        const tag = getTagById(tagId);
                        return tag ? (
                          <span 
                            key={tagId} 
                            className="story-tag"
                            style={{ backgroundColor: tag.color }}
                          >
                            {tag.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                  <div className="story-excerpt">
                    {expandedStories.has(story.id) ? (
                      <div className="story-full-content">
                        {story.content.split('\n').map((paragraph, index) => (
                          <p key={index}>{paragraph}</p>
                        ))}
                        {story.website && (
                          <div className="story-website-link">
                            <a 
                              href={story.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              onClick={(e) => {
                                // Ensure it opens in new tab
                                e.preventDefault();
                                window.open(story.website, '_blank', 'noopener,noreferrer');
                              }}
                            >
                              {story.websiteButtonText || 'Visit Website'}
                            </a>
                            <div className="story-website-url">{story.website}</div>
                          </div>
                        )}
                        <button 
                          className="read-less-btn"
                          onClick={() => toggleStoryExpansion(story.id)}
                        >
                          Read less
                        </button>
                      </div>
                    ) : (
                      <div className="story-preview">
                        <p>{truncateText(story.content)}</p>
                        <button 
                          className="read-more-btn"
                          onClick={() => toggleStoryExpansion(story.id)}
                        >
                          Read more...
                        </button>
                        {story.website && (
                          <a
                            href={story.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="website-btn"
                            onClick={(e) => {
                              // Ensure it opens in new tab
                              e.preventDefault();
                              window.open(story.website, '_blank', 'noopener,noreferrer');
                            }}
                          >
                            {story.websiteButtonText || 'Visit Website'}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default NewsFeed; 