
import React from 'react';

interface EffectFiltersProps {
    onFilterSelect: (filter: any) => void;
    selectedFilter: any;
}

const filters = [
    { name: 'None', cssFilter: 'none' },
    { name: 'Sepia', cssFilter: 'sepia(100%)' },
    { name: 'Grayscale', cssFilter: 'grayscale(100%)' },
    { name: 'Vintage', cssFilter: 'sepia(50%) contrast(1.2) brightness(0.8)' },
    { name: 'Cool', cssFilter: 'hue-rotate(180deg) saturate(1.5)' },
    { name: 'Warm', cssFilter: 'hue-rotate(-20deg) saturate(1.2) brightness(1.1)' },
    { name: 'High Contrast', cssFilter: 'contrast(1.5) brightness(1.1)' },
    { name: 'Soft', cssFilter: 'blur(0.5px) brightness(1.1)' },
    { name: 'Sharp', cssFilter: 'contrast(1.3) brightness(1.05) saturate(1.1)' },
    { name: 'Dramatic', cssFilter: 'contrast(1.8) brightness(0.9) saturate(0.8)' },
    { name: 'Moonlight', cssFilter: 'hue-rotate(200deg) saturate(0.6) brightness(0.7)' },
    { name: 'Sunrise', cssFilter: 'hue-rotate(-10deg) saturate(1.4) brightness(1.2)' }
];

const EffectFilters: React.FC<EffectFiltersProps> = ({
    onFilterSelect,
    selectedFilter
}) => {
    return (
        <div className="effects-panel">
            <div className="effects-header">
                <h3>🎨 Effect Filters</h3>
            </div>
            <div className="filters-grid">
                {filters.map((filter, index) => (
                    <button
                        key={index}
                        onClick={() => onFilterSelect(filter)}
                        className={`filter-btn ${selectedFilter?.name === filter.name ? 'active' : ''}`}
                        style={{
                            padding: '8px 12px',
                            margin: '2px',
                            border: selectedFilter?.name === filter.name ? '2px solid #007bff' : '1px solid #ddd',
                            borderRadius: '5px',
                            background: selectedFilter?.name === filter.name ? '#e3f2fd' : 'white',
                            cursor: 'pointer',
                            fontSize: '12px',
                            minWidth: '80px'
                        }}
                    >
                        {filter.name}
                    </button>
                ))}
            </div>
            <div style={{ marginTop: '10px', fontSize: '11px', color: '#666' }}>
                💡 Select a filter to preview effects on your images
            </div>
        </div>
    );
};

export default EffectFilters;
