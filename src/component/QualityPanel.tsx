
import React from 'react';

interface QualityPanelProps {
    showAdjustments: boolean;
    onToggleAdjustments: () => void;
    showEffects: boolean;
    onToggleEffects: () => void;
    onSharePDF: () => void;
    darkMode: boolean;
    onToggleDarkMode: () => void;
    onAddWatermark: () => void;
    onAddBorder: () => void;
    onAddSignature: () => void;
    onShowPreview: () => void;
    onSaveAdjustments: () => void;
    enableWatermark: boolean;
    onToggleWatermark: () => void;
    enableBorder: boolean;
    onToggleBorder: () => void;
    enableSignature: boolean;
    onToggleSignature: () => void;
}

const QualityPanel: React.FC<QualityPanelProps> = ({
    showAdjustments,
    onToggleAdjustments,
    showEffects,
    onToggleEffects,
    onSharePDF,
    darkMode,
    onToggleDarkMode,
    onAddWatermark,
    onAddBorder,
    onAddSignature,
    onShowPreview,
    onSaveAdjustments,
    enableWatermark,
    onToggleWatermark,
    enableBorder,
    onToggleBorder,
    enableSignature,
    onToggleSignature
}) => {
    return (
        <div className="quality-panel">
            <div className="quality-header">
                <h3>🎛️ Quality Tools Panel</h3>
                <button 
                    onClick={onToggleDarkMode}
                    className={`quality-btn ${darkMode ? 'active' : ''}`}
                    style={{ padding: '5px 10px', fontSize: '12px' }}
                >
                    {darkMode ? '☀️ Light' : '🌙 Dark'}
                </button>
            </div>

            <div className="quality-controls">
                <div className="control-row">
                    <button 
                        onClick={onToggleAdjustments}
                        className={`quality-btn ${showAdjustments ? 'active' : ''}`}
                    >
                        🎛️ Adjustments
                    </button>
                    <button 
                        onClick={onToggleEffects}
                        className={`quality-btn ${showEffects ? 'active' : ''}`}
                    >
                        🎨 Effects
                    </button>
                    <button 
                        onClick={onShowPreview}
                        className="quality-btn"
                    >
                        👁️ Preview
                    </button>
                </div>

                <div className="control-row">
                    <div className="checkbox-group">
                        <div onClick={onToggleWatermark} className="checkbox">
                            <input type="checkbox" checked={enableWatermark} readOnly />
                            <div className="box-bg">💧 Watermark</div>
                        </div>
                        <button onClick={onAddWatermark} className="config-btn">⚙️</button>
                    </div>
                    
                    <div className="checkbox-group">
                        <div onClick={onToggleBorder} className="checkbox">
                            <input type="checkbox" checked={enableBorder} readOnly />
                            <div className="box-bg">🖼️ Border</div>
                        </div>
                        <button onClick={onAddBorder} className="config-btn">⚙️</button>
                    </div>
                    
                    <div className="checkbox-group">
                        <div onClick={onToggleSignature} className="checkbox">
                            <input type="checkbox" checked={enableSignature} readOnly />
                            <div className="box-bg">✍️ Signature</div>
                        </div>
                        <button onClick={onAddSignature} className="config-btn">⚙️</button>
                    </div>
                </div>

                <div className="control-row">
                    <button 
                        onClick={onSaveAdjustments}
                        className="quality-btn save-btn"
                    >
                        💾 Apply All
                    </button>
                    <button 
                        onClick={onSharePDF}
                        className="quality-btn"
                    >
                        📤 Share PDF
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QualityPanel;
