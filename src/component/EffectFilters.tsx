import React, { useState, useEffect } from 'react';

interface EffectFilter {
  id: string;
  name: string;
  category: string;
  cssFilter: string;
  preview?: string;
}

const effectFilters: EffectFilter[] = [
  // Black & White Presets
  { id: 'monochrome', name: 'Monochrome', category: 'bw', cssFilter: 'grayscale(100%)' },
  { id: 'grayscale', name: 'Grayscale', category: 'bw', cssFilter: 'grayscale(80%) contrast(1.2)' },
  { id: 'high-key', name: 'High Key', category: 'bw', cssFilter: 'grayscale(100%) brightness(1.3) contrast(0.8)' },
  { id: 'low-key', name: 'Low Key', category: 'bw', cssFilter: 'grayscale(100%) brightness(0.7) contrast(1.5)' },
  { id: 'high-contrast-bw', name: 'High Contrast', category: 'bw', cssFilter: 'grayscale(100%) contrast(2)' },
  { id: 'tinted-bw', name: 'Tinted B&W', category: 'bw', cssFilter: 'grayscale(100%) sepia(30%)' },

  // Vintage / Retro Effects
  { id: 'film', name: 'Film', category: 'vintage', cssFilter: 'sepia(50%) contrast(1.2) brightness(0.9)' },
  { id: 'sepia', name: 'Sepia', category: 'vintage', cssFilter: 'sepia(100%)' },
  { id: 'lomo', name: 'Lomo', category: 'vintage', cssFilter: 'contrast(1.5) brightness(0.8) saturate(2)' },
  { id: 'digital', name: 'Digital', category: 'vintage', cssFilter: 'contrast(1.1) saturate(1.3)' },

  // Creative Filters
  { id: 'dramatic', name: 'Dramatic', category: 'creative', cssFilter: 'contrast(1.8) brightness(0.9) saturate(1.4)' },
  { id: 'fantasy', name: 'Fantasy', category: 'creative', cssFilter: 'hue-rotate(45deg) saturate(1.8) brightness(1.1)' },
  { id: 'cinematic', name: 'Cinematic', category: 'creative', cssFilter: 'contrast(1.3) brightness(0.85) sepia(10%)' },
  { id: 'dreamy', name: 'Dreamy', category: 'creative', cssFilter: 'brightness(1.2) contrast(0.8) blur(0.5px)' },
  { id: 'glow-effect', name: 'Glow', category: 'creative', cssFilter: 'brightness(1.3) contrast(1.1) saturate(1.2)' },

  // Instagram-style Filters
  { id: 'instage', name: 'Instage', category: 'instagram', cssFilter: 'contrast(1.1) brightness(1.1) saturate(1.3)' },
  { id: 'retro-insta', name: 'Retro', category: 'instagram', cssFilter: 'sepia(20%) contrast(1.2) brightness(0.9)' },
  { id: 'tuning', name: 'Tuning', category: 'instagram', cssFilter: 'contrast(1.4) saturate(1.5)' },
  { id: 'portrait', name: 'Portrait', category: 'instagram', cssFilter: 'brightness(1.1) contrast(1.1)' },
  { id: 'food', name: 'Food', category: 'instagram', cssFilter: 'contrast(1.2) saturate(1.8) brightness(1.1)' },
  { id: 'urban', name: 'Urban', category: 'instagram', cssFilter: 'contrast(1.3) brightness(0.9) hue-rotate(10deg)' },
  { id: 'nature', name: 'Nature', category: 'instagram', cssFilter: 'saturate(1.4) contrast(1.1) brightness(1.05)' },
  { id: 'colors', name: 'Colors', category: 'instagram', cssFilter: 'saturate(2) contrast(1.2) hue-rotate(15deg)' }
];

interface Props {
  onFilterSelect: (filter: EffectFilter | null) => void;
  selectedFilter: EffectFilter | null;
}

const EffectFilters: React.FC<Props> = ({ onFilterSelect, selectedFilter }) => {
  const [activeCategory, setActiveCategory] = useState<string>('bw');

  useEffect(() => {
    const handleSelectFilter = (event: any) => {
      const filterId = event.detail?.id;
      if (filterId) {
        const filter = effectFilters.find(f => f.id === filterId);
        if (filter) {
          onFilterSelect(filter);
        }
      }
    };

    window.addEventListener('select-filter', handleSelectFilter);
    return () => window.removeEventListener('select-filter', handleSelectFilter);
  }, [onFilterSelect]);

  const categories = [
    { key: 'bw', label: '🖤 B&W', name: 'Black & White' },
    { key: 'vintage', label: '📽️ Vintage', name: 'Vintage' },
    { key: 'creative', label: '🎭 Creative', name: 'Creative' },
    { key: 'instagram', label: '📷 Instagram', name: 'Instagram Style' }
  ];

  const filteredEffects = effectFilters.filter(filter => filter.category === activeCategory);

  return (
    <div className="effects-panel" style={{ padding: '15px' }}>
      <div className="effects-header" style={{ marginBottom: '15px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="reset-btn"
            onClick={() => onFilterSelect(null)}
            style={{
              background: '#f8f9fa',
              color: '#333'
            }}
          >
            🔄 Reset Filter
          </button>
        </div>
      </div>

      <div className="effects-grid">
        <div 
          className={`effect-tile ${selectedFilter === null ? 'selected' : ''}`}
          onClick={() => onFilterSelect(null)}
        >
          <div className="effect-preview original">Original</div>
          <span>Original</span>
        </div>

        {filteredEffects.map(filter => (
          <div
            key={filter.id}
            className={`effect-tile ${selectedFilter?.id === filter.id ? 'selected' : ''}`}
            onClick={() => onFilterSelect(filter)}
          >
            <div 
              className="effect-preview"
              style={{ filter: filter.cssFilter }}
            >
              Preview
            </div>
            <span>{filter.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EffectFilters;