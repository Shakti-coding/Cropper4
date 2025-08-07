
import React, { useState, useEffect } from 'react';

interface AdjustmentsPanelProps {
    onAdjustmentChange: (adjustments: any) => void;
    onReset: () => void;
    showComparison: boolean;
    onToggleComparison: () => void;
}

const AdjustmentsPanel: React.FC<AdjustmentsPanelProps> = ({
    onAdjustmentChange,
    onReset,
    showComparison,
    onToggleComparison
}) => {
    const [adjustments, setAdjustments] = useState({
        brightness: 0,
        contrast: 0,
        saturation: 0,
        hue: 0,
        blur: 0,
        sharpen: 0
    });

    useEffect(() => {
        onAdjustmentChange(adjustments);
    }, [adjustments, onAdjustmentChange]);

    const handleAdjustmentChange = (key: string, value: number) => {
        setAdjustments(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleReset = () => {
        setAdjustments({
            brightness: 0,
            contrast: 0,
            saturation: 0,
            hue: 0,
            blur: 0,
            sharpen: 0
        });
        onReset();
    };

    return (
        <div className="adjustments-panel">
            <div className="adjustments-header">
                <h3>🎛️ Image Adjustments</h3>
                <div style={{ display: 'flex', gap: '5px' }}>
                    <button 
                        onClick={onToggleComparison}
                        className={`quality-btn ${showComparison ? 'active' : ''}`}
                        style={{ padding: '5px 10px', fontSize: '12px' }}
                    >
                        {showComparison ? '👁️ Hide Compare' : '👀 Compare'}
                    </button>
                    <button 
                        onClick={handleReset}
                        className="quality-btn reset-btn"
                        style={{ padding: '5px 10px', fontSize: '12px' }}
                    >
                        🔄 Reset
                    </button>
                </div>
            </div>
            <div className="adjustment-controls">
                {Object.entries(adjustments).map(([key, value]) => (
                    <div key={key} className="adjustment-control">
                        <label>
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                            <span className="adjustment-value">({value})</span>
                        </label>
                        <input
                            type="range"
                            min={key === 'hue' ? -180 : key === 'blur' ? 0 : key === 'sharpen' ? 0 : -100}
                            max={key === 'hue' ? 180 : key === 'blur' ? 20 : key === 'sharpen' ? 100 : 100}
                            step={key === 'blur' ? 0.1 : 1}
                            value={value}
                            onChange={(e) => handleAdjustmentChange(key, parseFloat(e.target.value))}
                            className="adjustment-slider"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdjustmentsPanel;
