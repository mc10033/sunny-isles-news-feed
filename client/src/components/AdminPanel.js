import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import './AdminPanel.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : 'http://localhost:5000';

function AdminPanel() {
  const [stories, setStories] = useState([]);
  const [tags, setTags] = useState([]);
  const [newStory, setNewStory] = useState({
    title: '',
    content: '',
    website: '',
    websiteButtonText: '',
    imageUrl: ''
  });
  const [newTag, setNewTag] = useState({
    name: '',
    color: '#667eea'
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [editingStory, setEditingStory] = useState(null);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('manageStories'); // 'manageStories', 'addStory', 'addTags'

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Connect to Socket.IO
    const socket = io(SOCKET_URL);

    // Fetch stories and tags
    fetchStories();
    fetchTags();

    // Socket event listeners
    socket.on('storyAdded', (newStory) => {
      setStories(prevStories => [newStory, ...prevStories]);
      setMessage('Story added successfully!');
      setTimeout(() => setMessage(''), 3000);
    });

    socket.on('storyUpdated', (updatedStory) => {
      setStories(prevStories => 
        prevStories.map(story => 
          story.id === updatedStory.id ? updatedStory : story
        )
      );
      setMessage('Story updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    });

    socket.on('storyDeleted', (storyId) => {
      setStories(prevStories => 
        prevStories.filter(story => story.id !== storyId)
      );
      setMessage('Story deleted successfully!');
      setTimeout(() => setMessage(''), 3000);
    });

    socket.on('tagAdded', (newTag) => {
      setTags(prevTags => [...prevTags, newTag]);
      setMessage('Tag added successfully!');
      setTimeout(() => setMessage(''), 3000);
    });

    socket.on('tagDeleted', (tagId) => {
      setTags(prevTags => prevTags.filter(tag => tag.id !== tagId));
      setMessage('Tag deleted successfully!');
      setTimeout(() => setMessage(''), 3000);
    });

    return () => {
      socket.disconnect();
    };
  }, [navigate]);

  const fetchStories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/stories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStories(response.data);
    } catch (error) {
      console.error('Error fetching stories:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const fetchTags = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/tags`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTags(response.data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('title', newStory.title);
      formData.append('content', newStory.content);
      formData.append('website', newStory.website || '');
      formData.append('websiteButtonText', newStory.websiteButtonText || '');
      formData.append('imageUrl', newStory.imageUrl || '');
      if (newStory.tags && newStory.tags.length > 0) {
        formData.append('tags', newStory.tags.join(','));
      }
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      await axios.post(`${API_BASE_URL}/stories`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setNewStory({ title: '', content: '', website: '', websiteButtonText: '', imageUrl: '', tags: [] });
      setSelectedImage(null);
      document.getElementById('image-input').value = '';
    } catch (error) {
      setMessage(error.response?.data?.error || 'Error adding story');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('title', editingStory.title);
      formData.append('content', editingStory.content);
      formData.append('website', editingStory.website || '');
      formData.append('websiteButtonText', editingStory.websiteButtonText || '');
      formData.append('imageUrl', editingStory.imageUrl || '');
      if (editingStory.tags && editingStory.tags.length > 0) {
        formData.append('tags', editingStory.tags.join(','));
      }
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      await axios.put(`${API_BASE_URL}/stories/${editingStory.id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setEditingStory(null);
      setSelectedImage(null);
      document.getElementById('image-input').value = '';
    } catch (error) {
      setMessage(error.response?.data?.error || 'Error updating story');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (storyId) => {
    if (!window.confirm('Are you sure you want to delete this story?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/stories/${storyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      setMessage(error.response?.data?.error || 'Error deleting story');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const startEditing = (story) => {
    setEditingStory(story);
    setSelectedImage(null);
    document.getElementById('image-input').value = '';
  };

  const cancelEditing = () => {
    setEditingStory(null);
    setSelectedImage(null);
    document.getElementById('image-input').value = '';
  };

  const handleAddTag = async (e) => {
    e.preventDefault();
    if (!newTag.name.trim()) return;

    try {
      const token = localStorage.getItem('token');
      console.log('Adding tag:', newTag);
      console.log('Token:', token);
      console.log('API URL:', `${API_BASE_URL}/tags`);
      
      // Test the token first
      console.log('Testing token validity...');
      const testResponse = await axios.get(`${API_BASE_URL}/tags`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Token test successful:', testResponse.status);
      
      const response = await axios.post(`${API_BASE_URL}/tags`, newTag, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Tag added successfully:', response.data);
      setNewTag({ name: '', color: '#667eea' });
      setMessage('Tag added successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error adding tag:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      console.error('Error message:', error.message);
      setMessage(error.response?.data?.error || 'Error adding tag');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDeleteTag = async (tagId) => {
    if (!window.confirm('Are you sure you want to delete this tag? This will remove it from all stories.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/tags/${tagId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      setMessage(error.response?.data?.error || 'Error deleting tag');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const toggleStoryTag = (storyId, tagId) => {
    if (editingStory && editingStory.id === storyId) {
      const currentTags = editingStory.tags || [];
      const newTags = currentTags.includes(tagId)
        ? currentTags.filter(id => id !== tagId)
        : [...currentTags, tagId];
      setEditingStory({ ...editingStory, tags: newTags });
    } else if (!editingStory) {
      const currentTags = newStory.tags || [];
      const newTags = currentTags.includes(tagId)
        ? currentTags.filter(id => id !== tagId)
        : [...currentTags, tagId];
      setNewStory({ ...newStory, tags: newTags });
    }
  };

  const getTagNames = (tagIds) => {
    if (!tagIds || !Array.isArray(tagIds)) return [];
    return tagIds.map(tagId => {
      const tag = tags.find(t => t.id === tagId);
      return tag ? tag.name : '';
    }).filter(name => name);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="logo-container">
          <h1 className="logo-text">Sunny Isles</h1>
          <div className="sun-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
          <span className="admin-badge">Admin</span>
        </div>
        <div className="admin-actions">
          <Link to="/" className="view-feed-btn">View Feed</Link>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      {/* Menu Bar */}
      <nav className="admin-menu-bar">
        <button
          className={activeTab === 'manageStories' ? 'active' : ''}
          onClick={() => setActiveTab('manageStories')}
        >
          Manage Stories
        </button>
        <button
          className={activeTab === 'addStory' ? 'active' : ''}
          onClick={() => { setActiveTab('addStory'); setEditingStory(null); }}
        >
          Add Story
        </button>
        <button
          className={activeTab === 'addTags' ? 'active' : ''}
          onClick={() => setActiveTab('addTags')}
        >
          Add Tags
        </button>
      </nav>

      {message && (
        <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="admin-content">
        {/* Add Story Section */}
        {activeTab === 'addStory' && (
          <div className="story-form-section">
            <h2>{editingStory ? 'Edit Story' : 'Add New Story'}</h2>
            <form onSubmit={editingStory ? handleUpdate : handleSubmit} className="story-form">
              <div className="form-group">
                <label htmlFor="title">Title</label>
                <input
                  type="text"
                  id="title"
                  value={editingStory ? editingStory.title : newStory.title}
                  onChange={(e) => 
                    editingStory 
                      ? setEditingStory({...editingStory, title: e.target.value})
                      : setNewStory({...newStory, title: e.target.value})
                  }
                  required
                  placeholder="Enter story title"
                />
              </div>

              <div className="form-group">
                <label htmlFor="content">Content</label>
                <textarea
                  id="content"
                  value={editingStory ? editingStory.content : newStory.content}
                  onChange={(e) => 
                    editingStory 
                      ? setEditingStory({...editingStory, content: e.target.value})
                      : setNewStory({...newStory, content: e.target.value})
                  }
                  required
                  placeholder="Enter story content"
                  rows="6"
                />
              </div>

              <div className="form-group">
                <label htmlFor="website">Website URL (optional)</label>
                <input
                  type="url"
                  id="website"
                  value={editingStory ? (editingStory.website || '') : (newStory.website || '')}
                  onChange={(e) =>
                    editingStory
                      ? setEditingStory({ ...editingStory, website: e.target.value })
                      : setNewStory({ ...newStory, website: e.target.value })
                  }
                  placeholder="https://example.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="websiteButtonText">Website Button Text (optional)</label>
                <input
                  type="text"
                  id="websiteButtonText"
                  value={editingStory ? (editingStory.websiteButtonText || '') : (newStory.websiteButtonText || '')}
                  onChange={(e) =>
                    editingStory
                      ? setEditingStory({ ...editingStory, websiteButtonText: e.target.value })
                      : setNewStory({ ...newStory, websiteButtonText: e.target.value })
                  }
                  placeholder="Visit Website, Go to Article, etc."
                />
              </div>

              <div className="form-group">
                <label>Tags</label>
                <div className="tags-selection">
                  {tags.map(tag => (
                    <label key={tag.id} className="tag-checkbox-label">
                      <input
                        type="checkbox"
                        checked={
                          editingStory 
                            ? (editingStory.tags && editingStory.tags.includes(tag.id))
                            : (newStory.tags && newStory.tags.includes(tag.id))
                        }
                        onChange={() => toggleStoryTag(
                          editingStory ? editingStory.id : 'new',
                          tag.id
                        )}
                      />
                      <span 
                        className="tag-pill" 
                        style={{ backgroundColor: tag.color }}
                      >
                        {tag.name}
                      </span>
                    </label>
                  ))}
                  {tags.length === 0 && (
                    <p className="no-tags-message">No tags available. Add tags in the Tags section below.</p>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="image-input">Upload Image (optional)</label>
                <input
                  type="file"
                  id="image-input"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                <small>Upload an image file (max 5MB) or provide an image URL below</small>
              </div>

              <div className="form-group">
                <label htmlFor="imageUrl">Image URL (optional)</label>
                <input
                  type="url"
                  id="imageUrl"
                  value={editingStory ? (editingStory.imageUrl || '') : (newStory.imageUrl || '')}
                  onChange={(e) =>
                    editingStory
                      ? setEditingStory({ ...editingStory, imageUrl: e.target.value })
                      : setNewStory({ ...newStory, imageUrl: e.target.value })
                  }
                  placeholder="https://example.com/image.jpg"
                />
                <small>Provide a direct link to an image. Uploaded images take precedence over URLs.</small>
              </div>

              <div className="form-actions">
                {editingStory && (
                  <button type="button" onClick={cancelEditing} className="cancel-btn">
                    Cancel
                  </button>
                )}
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Saving...' : (editingStory ? 'Update Story' : 'Add Story')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Add Tags Section */}
        {activeTab === 'addTags' && (
          <div className="tags-section">
            <h2>Manage Tags ({tags.length})</h2>
            <div className="tags-list">
              {tags.length === 0 ? (
                <p className="no-tags">No tags yet. Add your first tag above!</p>
              ) : (
                tags.map(tag => (
                  <div key={tag.id} className="tag-item">
                    <span className="tag-name">{tag.name}</span>
                    <span className="tag-color" style={{ backgroundColor: tag.color }}></span>
                    <button 
                      onClick={() => handleDeleteTag(tag.id)}
                      className="delete-tag-btn"
                    >
                      X
                    </button>
                  </div>
                ))
              )}
            </div>
            <h3>Add New Tag</h3>
            <form onSubmit={handleAddTag} className="add-tag-form">
              <input
                type="text"
                value={newTag.name}
                onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                placeholder="Tag name"
                required
              />
              <input
                type="color"
                value={newTag.color}
                onChange={(e) => setNewTag({ ...newTag, color: e.target.value })}
                placeholder="Tag color"
                required
              />
              <button type="submit" className="add-tag-btn">Add Tag</button>
            </form>
          </div>
        )}

        {/* Manage Stories Section */}
        {activeTab === 'manageStories' && (
          <div className="stories-list-section">
            <h2>Manage Stories ({stories.length})</h2>
            <div className="stories-list">
              {stories.length === 0 ? (
                <p className="no-stories">No stories yet. Add your first story above!</p>
              ) : (
                stories.map(story => (
                  <div key={story.id} className="story-item">
                    <div className="story-info">
                      <h3>{story.title}</h3>
                      <p className="story-meta">
                        By {story.author} • {formatDate(story.createdAt)}
                      </p>
                      <p className="story-preview">
                        {story.content.substring(0, 100)}...
                      </p>
                      <div className="story-tags">
                        Tags: {getTagNames(story.tags).map((name, index) => (
                          <span key={index} className="tag-pill">
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="story-actions">
                      <button 
                        onClick={() => startEditing(story)}
                        className="edit-btn"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(story.id)}
                        className="delete-btn"
                      >
                        Delete
                      </button>
                      {editingStory && editingStory.id === story.id && (
                        <div className="story-tags-edit">
                          <h4>Edit Tags</h4>
                          {tags.map(tag => (
                            <label key={tag.id} className="tag-checkbox-label">
                              <input
                                type="checkbox"
                                checked={story.tags && story.tags.includes(tag.id)}
                                onChange={() => toggleStoryTag(story.id, tag.id)}
                              />
                              <span className="tag-pill">{tag.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel; 