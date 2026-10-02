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
  Sparkles,
} from 'lucide-react';
import { LibraryBook, StudyNote } from '../types';
import { PRELOADED_LIBRARY_BOOKS } from '../data/libraryCatalog';
import { fetchStudyNotes, saveStudyNote } from '../services/supabaseService';

export function getResolvedBookUrl(bookUrl: string): string {
  if (!bookUrl) return '';
  if (bookUrl.startsWith('http://') || bookUrl.startsWith('https://')) {
    return bookUrl;
  }
  const clean = bookUrl.replace(/^(\.\/|\/)/, '');
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  if (pathname.includes('/drona')) {
    return `/drona/${clean}`;
  }
  return `/${clean}`;
}

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
      (selectedCategory === 'physics_special' &&
        (b.category === 'advanced_physics' || b.category === 'reference'));

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

  // Helper to generate distinct realistic book front page cover art
  const renderBookCover = (book: LibraryBook) => {
    const isHcv = book.id.includes('hcv');
    const isIrodov = book.id.includes('irodov');
    const isPhy = book.subject === 'physics';
    const isChem = book.subject === 'chemistry';
    const isMath = book.subject === 'mathematics';
    const isBio = book.subject === 'biology';

    let coverBg = 'from-slate-800 to-slate-950';
    let accentColor = '#3b82f6';
    let title = book.title;
    let subtitle = book.badge || 'NCERT Textbook';
    let author = 'NCERT';

    if (isIrodov) {
      coverBg = 'from-red-950 via-rose-900 to-slate-950';
      accentColor = '#f59e0b';
      author = 'I.E. IRODOV';
      subtitle = 'PROBLEMS IN GENERAL PHYSICS';
    } else if (isHcv) {
      if (book.id.includes('1')) {
        coverBg = 'from-blue-950 via-indigo-900 to-slate-950';
        accentColor = '#fbbf24';
        author = 'Dr. H.C. VERMA';
        subtitle = 'PART 1 • MECHANICS & WAVES';
      } else {
        coverBg = 'from-emerald-950 via-teal-900 to-slate-950';
        accentColor = '#38bdf8';
        author = 'Dr. H.C. VERMA';
        subtitle = 'PART 2 • ELECTRODYNAMICS & OPTICS';
      }
    } else if (isPhy) {
      coverBg = 'from-blue-900 via-sky-950 to-slate-950';
      accentColor = '#60a5fa';
      author = 'NCERT NATIONAL COUNCIL';
    } else if (isChem) {
      coverBg = 'from-emerald-900 via-teal-950 to-slate-950';
      accentColor = '#34d399';
      author = 'NCERT NATIONAL COUNCIL';
    } else if (isMath) {
      coverBg = 'from-purple-900 via-indigo-950 to-slate-950';
      accentColor = '#c084fc';
      author = 'NCERT NATIONAL COUNCIL';
    } else if (isBio) {
      coverBg = 'from-rose-900 via-pink-950 to-slate-950';
      accentColor = '#f472b6';
      author = 'NCERT NATIONAL COUNCIL';
    }

    return (
      <div className="relative w-full aspect-[3/4.2] rounded-xl overflow-hidden bg-gradient-to-br shadow-md group-hover:shadow-xl transition-all duration-300 flex flex-col justify-between p-4 border-l-4 border-black/40 select-none cursor-pointer">
        {/* Book cover background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${coverBg} opacity-95`} />

        {/* Paper texture and glossy diagonal sheen */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />

        {/* Realistic spine edge highlight on the left */}
        <div className="absolute top-0 bottom-0 left-0 w-2.5 bg-gradient-to-r from-black/50 via-white/15 to-transparent pointer-events-none" />

        {/* Top Header of Book Cover */}
        <div className="relative z-10 space-y-1">
          <div className="flex items-center justify-between">
            <span
              className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-xs"
              style={{ backgroundColor: accentColor, color: '#0f172a' }}
            >
              {book.category.replace('_', ' ').toUpperCase()}
            </span>
            <span className="text-[10px] font-mono text-white/70 font-semibold">
              {book.fileSize}
            </span>
          </div>
          <p className="text-[10px] font-extrabold tracking-widest text-slate-300 uppercase pt-2">
            {subtitle}
          </p>
        </div>

        {/* Center Title and Graphic Motif */}
        <div className="relative z-10 my-auto text-center space-y-2">
          {/* Subtle decorative emblem */}
          <div className="w-12 h-12 rounded-full border border-white/20 mx-auto flex items-center justify-center text-white/80 text-xl font-serif">
            {isIrodov ? '∑' : isHcv ? 'λ' : isPhy ? 'ħ' : isChem ? '⬡' : isMath ? '∫' : '🧬'}
          </div>

          <h4 className="text-base font-black text-white tracking-tight leading-tight px-1 font-serif drop-shadow-sm">
            {title}
          </h4>

          <div className="w-10 h-0.5 mx-auto rounded" style={{ backgroundColor: accentColor }} />
        </div>

        {/* Bottom Author & Publisher Seal */}
        <div className="relative z-10 pt-2 border-t border-white/15 flex items-center justify-between text-[10px] text-slate-300">
          <span className="font-bold tracking-wider">{author}</span>
          <span className="text-[9px] font-mono text-white/60">EDITION 2025</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* ================= HEADER & SEARCH ================= */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen size={20} className="text-blue-600" /> Study Library & Books
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Complete textbook repository: NCERT Class 11 & 12, HC Verma Volume 1 & 2, and I.E. Irodov.
          </p>
        </div>

        {/* Search */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px]">
            <Search size={14} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search books, authors..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <button
            onClick={handleCreateNote}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <Plus size={14} /> Create Note
          </button>
        </div>
      </div>

      {/* ================= CATEGORY PILL FILTER ================= */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Collections' },
          { id: 'physics_special', label: 'HC Verma & Irodov (JEE Advanced)' },
          { id: 'class_11', label: 'NCERT Class 11' },
          { id: 'class_12', label: 'NCERT Class 12' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 select-none ${
              selectedCategory === tab.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ================= BOOKS SHELF (FRONT PAGE COVERS) ================= */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredBooks.map((book) => (
          <div
            key={book.id}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-200 group"
          >
            {/* Book Front Page Cover */}
            <div onClick={() => setSelectedBookForReading(book)}>
              {renderBookCover(book)}
            </div>

            {/* Book Title & Meta */}
            <div className="mt-3.5 space-y-1">
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                {book.title}
              </h3>
              <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                {book.description}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedBookForReading(book)}
                className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <BookOpen size={13} /> Read PDF
              </button>

              <a
                href={getResolvedBookUrl(book.fileUrl)}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Open in new tab"
              >
                <ExternalLink size={14} />
              </a>

              <a
                href={getResolvedBookUrl(book.fileUrl)}
                download={book.fileName}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/85 flex flex-col p-2 sm:p-4 backdrop-blur-xs">
          {/* Header */}
          <div className="h-14 bg-slate-900 border border-slate-800 rounded-t-2xl px-4 flex items-center justify-between text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600/30 rounded-xl text-blue-400">
                <BookOpen size={18} />
              </div>
              <div>
                <span className="text-xs font-bold truncate max-w-sm sm:max-w-md block">
                  {selectedBookForReading.title}
                </span>
                <span className="text-[10px] text-slate-400">
                  {selectedBookForReading.badge} • {selectedBookForReading.fileSize}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={getResolvedBookUrl(selectedBookForReading.fileUrl)}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold flex items-center gap-1.5 text-white transition shadow-sm"
              >
                <Maximize2 size={13} /> Open in New Tab
              </a>

              <a
                href={getResolvedBookUrl(selectedBookForReading.fileUrl)}
                download={selectedBookForReading.fileName}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1 text-slate-300 transition"
                title="Download PDF"
              >
                <Download size={14} />
              </a>

              <button
                onClick={() => setSelectedBookForReading(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-red-900 text-slate-300 hover:text-white transition cursor-pointer"
                title="Close Viewer"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Iframe & Object Viewport with interactive fallback */}
          <div className="flex-1 bg-slate-950 rounded-b-2xl overflow-hidden border border-t-0 border-slate-800 flex flex-col relative">
            <object
              data={getResolvedBookUrl(selectedBookForReading.fileUrl)}
              type="application/pdf"
              className="w-full flex-1"
            >
              <iframe
                src={getResolvedBookUrl(selectedBookForReading.fileUrl)}
                title={selectedBookForReading.title}
                className="w-full flex-1 border-none"
              />
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-200 space-y-4">
                <div className="p-4 bg-blue-900/30 rounded-2xl border border-blue-700/40">
                  <BookOpen size={40} className="text-blue-400" />
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-white">
                    {selectedBookForReading.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-md">
                    Academic PDF textbook ({selectedBookForReading.fileSize}). Click below to open directly in your browser's native PDF reader.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href={getResolvedBookUrl(selectedBookForReading.fileUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
                  >
                    <ExternalLink size={14} /> Open Full Textbook in New Window
                  </a>
                  <a
                    href={getResolvedBookUrl(selectedBookForReading.fileUrl)}
                    download={selectedBookForReading.fileName}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition flex items-center gap-2"
                  >
                    <Download size={14} /> Save Offline PDF
                  </a>
                </div>
              </div>
            </object>
          </div>
        </div>
      )}

      {/* ================= NOTE EDITOR MODAL ================= */}
      {showNoteEditor && activeNote && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Bookmark size={16} className="text-amber-500" />
                Revision Scratchpad & Formula Notes
              </h3>
              <button
                onClick={() => setShowNoteEditor(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={activeNote.title}
                onChange={(e) => setActiveNote({ ...activeNote, title: e.target.value })}
                placeholder="Note title (e.g. Rotational Dynamics Important Formulas)"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />

              <textarea
                value={activeNote.content}
                onChange={(e) => setActiveNote({ ...activeNote, content: e.target.value })}
                placeholder="Write your key formulas, mnemonic tricks, or problem insights..."
                rows={8}
                className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowNoteEditor(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveActiveNote}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
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
