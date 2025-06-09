import { useState, useRef, useEffect } from 'react';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

type CategoryKeys = 'Smileys & People' | 'Animals & Nature' | 'Food & Drink' | 'Activities' | 'Objects';

const EMOJI_CATEGORIES: Record<CategoryKeys, string[]> = {
  'Smileys & People': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳'],
  'Animals & Nature': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄'],
  'Food & Drink': ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🌽', '🥕', '🧄', '🧅', '🥔'],
  'Activities': ['⚽️', '🏀', '🏈', '⚾️', '🥎', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥊', '🥋', '🥅', '⛳️', '⛸️', '🎣', '🤿', '🎽', '🛹', '🛷', '⛷️'],
  'Objects': ['⌚️', '📱', '💻', '⌨️', '🖥', '🖨', '🖱', '🖲', '🕹', '🗜', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽', '🎞', '📞', '☎️', '📟', '📠', '📺', '📻'],
};

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryKeys>('Smileys & People');
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div 
      ref={pickerRef}
      className="emoji-picker"
      style={{
        position: 'absolute',
        bottom: '100%',
        right: '0',
        backgroundColor: 'white',
        border: '1px solid #dee2e6',
        borderRadius: '0.5rem',
        padding: '0.5rem',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        zIndex: 1000,
      }}
    >
      <div className="d-flex gap-2 mb-2">
        {Object.keys(EMOJI_CATEGORIES).map((category) => (
          <button
            key={category}
            className={`btn btn-sm ${selectedCategory === category ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setSelectedCategory(category as CategoryKeys)}
          >
            {EMOJI_CATEGORIES[category as CategoryKeys][0]}
          </button>
        ))}
      </div>
      <div 
        className="emoji-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          gap: '0.5rem',
          maxHeight: '200px',
          overflowY: 'auto',
        }}
      >
        {EMOJI_CATEGORIES[selectedCategory].map((emoji) => (
          <button
            key={emoji}
            className="btn btn-sm"
            onClick={() => {
              onSelect(emoji);
              onClose();
            }}
            style={{ fontSize: '1.5rem', padding: '0.25rem' }}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
} 