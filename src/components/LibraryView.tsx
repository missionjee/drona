import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  ExternalLink,
  Download,
  FileText,
  Plus,
  Save,
  Trash2,
  X,
  Maximize2,
  Bookmark,
} from 'lucide-react';
import { LibraryBook, StudyNote } from '../types';
import { PRELOADED_LIBRARY_BOOKS } from '../data/libraryCatalog';
import { fetchStudyNotes, saveStudyNote } from '../services/supabaseService';

export const LibraryView: React.FC = () => {
  const [books] = useState<LibraryBook[]>(PRELOADED_LIBRARY_BOOKS);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBookForReading, setSelectedBookForReading] = useState<LibraryBook | null>(null);

  // Notes state
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [activeNote, setActiveNote] = useState<StudyNote | null>(null);
  const [showNoteEditor, setShowNoteEditor] = useState<boolean>(false);

  useEffect(() => {
    fetchStudyNotes().then((loaded) => setNotes(loaded));
  }, []);

  const filteredBooks = books.filter((b) => {
    const matchesCat =
      selectedCategory === 'all' ||
      b.category === selectedCategory ||
      (selectedCategory === 'physics_special' && (b.category === 'advanced_physics' || b.category === 'reference'));

    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCat && matchesSearch;
  });

  const handleCreateNote = () => {
    const newNote: StudyNote = {
      id: `note-${Date.now()}`,
      title: 'Untitled Revision Note',
      subject: 'physics',
      content: '',
      updatedAt: Date.now(),
    };
    setActiveNote(newNote);
    setShowNoteEditor(true);
  };

  const handleSaveActiveNote = async () => {
    if (!activeNote) return;
    const updated = { ...activeNote, updatedAt: Date.now() };
    await saveStudyNote(updated);
    setNotes((prev) => {
      const idx = prev.findIndex((n) => n.id === updated.id);
      return idx >= 0 ? prev.map((n) => (n.id === updated.id ? updated : n)) : [updated, ...prev];
    });
    setShowNoteEditor(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* ================= LIBRARY HEADER & SEARCH ================= */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen size={20} className="text-blue-600" /> Preloaded Master Library
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Instant in-browser access to NCERT Class 11, Class 12, HC Verma Volume 1 & 2, and I.E. Irodov.
          </p>
        </div>

        {/* Search & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px]">
            <Search size={14} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search books, chapters..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <button
            onClick={handleCreateNote}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <Plus size={14} /> New Study Note
          </button>
        </div>
      </div>

      {/* ================= CATEGORY TABS ================= */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
        {[
          { id: 'all', label: `All Resources (${books.length})` },
          { id: 'physics_special', label: 'HC Verma & Irodov (3 Books)' },
          { id: 'class_11', label: 'Class 11 NCERT (6 Books)' },
          { id: 'class_12', label: 'Class 12 NCERT (6 Books)' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id)}
            className={`px-4 py-2 rounded-xl transition shrink-0 ${
              selectedCategory === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ================= BOOKS GRID ================= */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredBooks.map((book) => (
          <div
            key={book.id}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-blue-400 dark:hover:border-blue-600 transition group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                  {book.badge || book.subject.toUpperCase()}
                </span>
                <span className="text-[11px] font-mono text-slate-400">{book.fileSize}</span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition leading-snug">
                  {book.title}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                  {book.description}
                </p>
              </div>
            </div>

            {/* Read & Download actions */}
            <div className="flex items-center gap-2 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedBookForReading(book)}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
              >
                <BookOpen size={14} /> Read In-App
              </button>

              <a
                href={book.fileUrl.startsWith('http') ? book.fileUrl : ('./' + book.fileUrl.replace(/^(\.\/|\/)/, ''))}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                title="Open in Full Tab"
              >
                <ExternalLink size={14} />
              </a>

              <a
                href={book.fileUrl.startsWith('http') ? book.fileUrl : ('./' + book.fileUrl.replace(/^(\.\/|\/)/, ''))}
                download={book.fileName}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                title="Download PDF"
              >
                <Download size={14} />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* ================= STUDY NOTES SECTION ================= */}
      {notes.length > 0 && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Bookmark size={16} className="text-amber-500" /> Saved Revision Notes
            </h3>
            <span className="text-xs text-slate-500">{notes.length} notes</span>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {notes.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  setActiveNote(n);
                  setShowNoteEditor(true);
                }}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 cursor-pointer transition bg-slate-50/50 dark:bg-slate-850"
              >
                <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                  {n.title}
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                  {n.content || 'Empty note...'}
                </p>
                <div className="text-[10px] text-slate-400 mt-2 font-mono">
                  {new Date(n.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= EMBEDDED PDF READER MODAL ================= */}
      {selectedBookForReading && (
        <div className="fixed inset-0 z-50 bg-black/85 flex flex-col p-2 sm:p-4">
          <div className="h-12 bg-slate-900 text-white rounded-t-2xl px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <BookOpen size={16} className="text-blue-400" />
              <span className="font-bold text-xs sm:text-sm truncate max-w-sm">
                {selectedBookForReading.title}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={selectedBookForReading.fileUrl.startsWith('http') ? selectedBookForReading.fileUrl : ('./' + selectedBookForReading.fileUrl.replace(/^(\.\/|\/)/, ''))}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
              >
                <ExternalLink size={12} /> Open Full Screen
              </a>
              <button
                onClick={() => setSelectedBookForReading(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 bg-slate-800 rounded-b-2xl overflow-hidden relative">
            <iframe
              src={selectedBookForReading.fileUrl.startsWith('http') ? selectedBookForReading.fileUrl : ('./' + selectedBookForReading.fileUrl.replace(/^(\.\/|\/)/, ''))}
              title={selectedBookForReading.title}
              className="w-full h-full border-0"
            />
          </div>
        </div>
      )}

      {/* ================= NOTE EDITOR MODAL ================= */}
      {showNoteEditor && activeNote && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Study Note Editor
              </h3>
              <button
                onClick={() => setShowNoteEditor(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <input
              type="text"
              value={activeNote.title}
              onChange={(e) => setActiveNote({ ...activeNote, title: e.target.value })}
              placeholder="Note title..."
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
            />

            <textarea
              rows={8}
              value={activeNote.content}
              onChange={(e) => setActiveNote({ ...activeNote, content: e.target.value })}
              placeholder="Type your revision formulas, high-yield reactions, or problem shortcuts..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none leading-relaxed"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowNoteEditor(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveActiveNote}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
              >
                <Save size={14} /> Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
