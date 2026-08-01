'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Tag, Trash2, Edit2, Save, X, FileText, Clock } from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  documentId?: number;
  documentName?: string;
  createdAt: string;
  updatedAt: string;
}

export default function NoteTakingSystem() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState('');
  
  // Form state
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteTags, setNoteTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = () => {
    const saved = localStorage.getItem('studyNotes');
    if (saved) {
      setNotes(JSON.parse(saved));
    }
  };

  const saveNotes = (updatedNotes: Note[]) => {
    localStorage.setItem('studyNotes', JSON.stringify(updatedNotes));
    setNotes(updatedNotes);
  };

  const createNewNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'Untitled Note',
      content: '',
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setSelectedNote(newNote);
    setNoteTitle(newNote.title);
    setNoteContent(newNote.content);
    setNoteTags(newNote.tags);
    setIsEditing(true);
  };

  const saveNote = () => {
    if (!selectedNote) return;
    
    const updatedNote: Note = {
      ...selectedNote,
      title: noteTitle,
      content: noteContent,
      tags: noteTags,
      updatedAt: new Date().toISOString(),
    };

    const existingIndex = notes.findIndex(n => n.id === selectedNote.id);
    let updatedNotes;
    
    if (existingIndex >= 0) {
      updatedNotes = [...notes];
      updatedNotes[existingIndex] = updatedNote;
    } else {
      updatedNotes = [updatedNote, ...notes];
    }

    saveNotes(updatedNotes);
    setSelectedNote(updatedNote);
    setIsEditing(false);
  };

  const deleteNote = (noteId: string) => {
    if (!confirm('Delete this note?')) return;
    
    const updatedNotes = notes.filter(n => n.id !== noteId);
    saveNotes(updatedNotes);
    
    if (selectedNote?.id === noteId) {
      setSelectedNote(null);
      setIsEditing(false);
    }
  };

  const selectNote = (note: Note) => {
    setSelectedNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNoteTags(note.tags);
    setIsEditing(false);
  };

  const addTag = () => {
    if (newTag && !noteTags.includes(newTag)) {
      setNoteTags([...noteTags, newTag]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setNoteTags(noteTags.filter(t => t !== tag));
  };

  const getAllTags = (): string[] => {
    const tags = new Set<string>();
    notes.forEach(note => {
      note.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !filterTag || note.tags.includes(filterTag);
    return matchesSearch && matchesTag;
  });

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="h-full flex gap-6">
      {/* Sidebar - Notes List */}
      <div className="w-80 bg-white rounded-xl shadow-lg flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">My Notes</h2>
            <button
              onClick={createNewNote}
              className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Tag Filter */}
          {getAllTags().length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterTag('')}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  filterTag === ''
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {getAllTags().map(tag => (
                <button
                  key={tag}
                  onClick={() => setFilterTag(tag)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    filterTag === tag
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No notes yet</p>
              <p className="text-xs">Click + to create one</p>
            </div>
          ) : (
            filteredNotes.map(note => (
              <button
                key={note.id}
                onClick={() => selectNote(note)}
                className={`w-full text-left p-3 rounded-lg transition-colors group ${
                  selectedNote?.id === note.id
                    ? 'bg-primary-50 border-2 border-primary-500'
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-semibold text-gray-800 text-sm truncate flex-1">
                    {note.title}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNote(note.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-opacity"
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </button>
                </div>
                
                <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                  {note.content || 'No content'}
                </p>
                
                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {note.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 text-xs bg-primary-100 text-primary-700 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {note.tags.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{note.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
                
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  {formatDate(note.updatedAt)}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Content - Note Editor/Viewer */}
      <div className="flex-1 bg-white rounded-xl shadow-lg flex flex-col">
        {selectedNote ? (
          <>
            {/* Editor Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex-1">
                {isEditing ? (
                  <input
                    type="text"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    className="text-2xl font-bold text-gray-800 w-full border-none focus:outline-none focus:ring-0"
                    placeholder="Note title..."
                  />
                ) : (
                  <h2 className="text-2xl font-bold text-gray-800">{selectedNote.title}</h2>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={saveNote}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        selectNote(selectedNote);
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                )}
              </div>
            </div>

            {/* Tags Section */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="w-4 h-4 text-gray-600" />
                {noteTags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm flex items-center gap-2"
                  >
                    {tag}
                    {isEditing && (
                      <button
                        onClick={() => removeTag(tag)}
                        className="hover:text-primary-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
                
                {isEditing && (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                      placeholder="Add tag..."
                      className="px-3 py-1 border border-gray-300 rounded-full text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <button
                      onClick={addTag}
                      className="p-1 bg-primary-600 text-white rounded-full hover:bg-primary-700"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 overflow-y-auto">
              {isEditing ? (
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Start writing your notes here..."
                  className="w-full h-full border-none focus:outline-none focus:ring-0 resize-none text-gray-700"
                />
              ) : (
                <div className="prose max-w-none">
                  {noteContent ? (
                    <p className="whitespace-pre-wrap text-gray-700">{noteContent}</p>
                  ) : (
                    <p className="text-gray-400 italic">No content yet. Click Edit to add some.</p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 text-sm text-gray-500">
              <div className="flex items-center justify-between">
                <span>Created: {formatDate(selectedNote.createdAt)}</span>
                <span>Updated: {formatDate(selectedNote.updatedAt)}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No note selected</p>
              <p className="text-sm">Select a note from the list or create a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
