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
  const [currentPage, setCurrentPage] = useState(1);
  const storiesPerPage = 20;

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

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedTags]);

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

  // Sort stories by date (newest first)
  const sortedStories = [...filteredStories].sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  );

  // Calculate pagination
  const totalPages = Math.ceil(sortedStories.length / storiesPerPage);
  const startIndex = (currentPage - 1) * storiesPerPage;
  const endIndex = startIndex + storiesPerPage;
  const currentStories = sortedStories.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

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
          <div className="logo-row">
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
          <div className="tagline">A brighter look at Britain. Good news, gathered for you.</div>
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
        {currentStories.length === 0 ? (
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
          <>
            {currentStories.map(story => (
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
                    <div className="story-date-added">
                      <span className="date-label">Added:</span> {formatDate(story.createdAt)}
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
                        </div>
                      ) : (
                        <div className="story-preview">
                          <p>{truncateText(story.content)}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="story-actions">
                      {expandedStories.has(story.id) ? (
                        <>
                          {story.website && (
                            <a
                              href={story.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => {
                                e.preventDefault();
                                window.open(story.website, '_blank', 'noopener,noreferrer');
                              }}
                            >
                              {story.websiteButtonText || 'Visit Website'}
                            </a>
                          )}
                          <button 
                            onClick={() => toggleStoryExpansion(story.id)}
                          >
                            Read less
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => toggleStoryExpansion(story.id)}
                          >
                            Read more
                          </button>
                          {story.website && (
                            <a
                              href={story.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => {
                                e.preventDefault();
                                window.open(story.website, '_blank', 'noopener,noreferrer');
                              }}
                            >
                              {story.websiteButtonText || 'Visit Website'}
                            </a>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pagination-container">
                <div className="pagination-info">
                  Showing {startIndex + 1}-{Math.min(endIndex, sortedStories.length)} of {sortedStories.length} stories
                </div>
                <div className="pagination-controls">
                  <button 
                    className="pagination-btn"
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  
                  <div className="page-numbers">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        className={`page-number ${currentPage === page ? 'active' : ''}`}
                        onClick={() => goToPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  
                  <button 
                    className="pagination-btn"
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
            
          </>
        )}
      </div> {/* End of stories-container */}

      {/* Bottom Banner - only once at the bottom of the page */}
      <div className="bottom-banner">
        <div className="disclaimer">
          <p>We summarise and link to third-party news sources. All rights to original content remain with the respective publishers.</p>
        </div>
        <div className="social-media-links">
          <a href="#" className="social-link" title="Instagram">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </a>
          <a href="#" className="social-link" title="TikTok">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21.5 7.5c-.7 0-1.4-.1-2-.3v7.3c0 2.7-2.2 4.9-4.9 4.9s-4.9-2.2-4.9-4.9 2.2-4.9 4.9-4.9c.2 0 .4 0 .6.1v2.1c-.2 0-.4-.1-.6-.1-1.5 0-2.8 1.2-2.8 2.8s1.2 2.8 2.8 2.8 2.8-1.2 2.8-2.8V2.5h2c0 2.8 2.2 5 5 5v2z"/>
            </svg>
          </a>
          <a href="#" className="social-link" title="Twitter">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.46 6c-.77.35-1.6.59-2.47.7a4.3 4.3 0 0 0 1.88-2.37 8.59 8.59 0 0 1-2.72 1.04A4.28 4.28 0 0 0 16.11 4c-2.37 0-4.29 1.92-4.29 4.29 0 .34.04.67.11.99C7.69 9.13 4.07 7.38 1.64 4.7c-.37.64-.58 1.39-.58 2.19 0 1.51.77 2.84 1.95 3.62-.72-.02-1.39-.22-1.98-.55v.06c0 2.11 1.5 3.87 3.5 4.27-.36.1-.74.16-1.13.16-.28 0-.54-.03-.8-.08.54 1.7 2.11 2.94 3.97 2.97A8.6 8.6 0 0 1 2 19.54c-.29 0-.57-.02-.85-.05A12.13 12.13 0 0 0 8.29 21.5c7.55 0 11.68-6.26 11.68-11.68 0-.18-.01-.36-.02-.54.8-.58 1.5-1.3 2.05-2.13z"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}

export default NewsFeed; 