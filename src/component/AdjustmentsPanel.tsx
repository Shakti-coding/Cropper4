
import React, { useState, useEffect } from 'react';

interface AdjustmentValues {
  // Auto presets
  autoEnhance: boolean;
  autoColorFix: boolean;
  autoWhiteBalance: boolean;
  autoTone: boolean;
  
  // Color adjustments
  saturation: number;
  vibration: number;
  temperature: number;
  tint: number;
  
  // Tone adjustments
  brightness: number;
  contrast: number;
  highlights: number;
  shadows: number;
  whites: number;
  blacks: number;
  
  // Clarity adjustments
  clarity: number;
  dehaze: number;
  sharpen: number;
  noise: number;
  blur: number;
  
  // Creative adjustments
  hue: number;
  split: number;
  grain: number;
  vignette: number;
}

interface Props {
  onAdjustmentChange: (values: AdjustmentValues | null) => void;
  onReset: () => void;
  showComparison: boolean;
  onToggleComparison: () => void;
}

const AdjustmentsPanel: React.FC<Props> = ({
  onAdjustmentChange,
  onReset,
  showComparison,
  onToggleComparison
}) => {
  const [values, setValues] = useState<AdjustmentValues>({
    autoEnhance: false,
    autoColorFix: false,
    autoWhiteBalance: false,
    autoTone: false,
    saturation: 0,
    vibration: 0,
    temperature: 0,
    tint: 0,
    brightness: 0,
    contrast: 0,
    highlights: 0,
    shadows: 0,
    whites: 0,
    blacks: 0,
    clarity: 0,
    dehaze: 0,
    sharpen: 0,
    noise: 0,
    blur: 0,
    hue: 0,
    split: 0,
    grain: 0,
    vignette: 0
  });

  const [expandedSections, setExpandedSections] = useState({
    auto: true,
    color: false,
    tone: false,
    clarity: false,
    creative: false
  });

  useEffect(() => {
    // Listen for auto-enhance event
    const handleAutoEnhance = () => {
      const autoValues = {
        ...values,
        autoEnhance: true,
        brightness: 10,
        contrast: 15,
        saturation: 20,
        sharpen: 10,
        clarity: 15
      };
      setValues(autoValues);
      onAdjustmentChange(autoValues);
    };

    window.addEventListener('auto-enhance', handleAutoEnhance);
    return () => window.removeEventListener('auto-enhance', handleAutoEnhance);
  }, [values, onAdjustmentChange]);

  const handleValueChange = (key: keyof AdjustmentValues, value: number | boolean) => {
    const newValues = { ...values, [key]: value };
    setValues(newValues);
    onAdjustmentChange(newValues);
  };

  const handleReset = () => {
    const resetValues = {
      autoEnhance: false,
      autoColorFix: false,
      autoWhiteBalance: false,
      autoTone: false,
      saturation: 0,
      vibration: 0,
      temperature: 0,
      tint: 0,
      brightness: 0,
      contrast: 0,
      highlights: 0,
      shadows: 0,
      whites: 0,
      blacks: 0,
      clarity: 0,
      dehaze: 0,
      sharpen: 0,
      noise: 0,
      blur: 0,
      hue: 0,
      split: 0,
      grain: 0,
      vignette: 0
    };
    setValues(resetValues);
    onReset();
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const SliderControl = ({ 
    label, 
    value, 
    onChange, 
    min = -100, 
    max = 100, 
    step = 1 
  }: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
  }) => (
    <div className="slider-control">
      <label>{label}</label>
      <div className="slider-wrapper">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ flex: 1 }}
        />
        <span style={{ minWidth: '40px', textAlign: 'right', fontSize: '12px' }}>
          {value}
        </span>
      </div>
    </div>
  );

  const CheckboxControl = ({ 
    label, 
    checked, 
    onChange 
  }: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
  }) => (
    <div className="checkbox-control" style={{ marginBottom: '10px' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>{label}</span>
      </label>
    </div>
  );

  const SectionHeader = ({ 
    title, 
    isExpanded, 
    onToggle 
  }: {
    title: string;
    isExpanded: boolean;
    onToggle: () => void;
  }) => (
    <div 
      className="section-header"
      onClick={onToggle}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 0',
        borderBottom: '1px solid #eee',
        cursor: 'pointer',
        fontWeight: 'bold',
        color: '#333'
      }}
    >
      <span>{title}</span>
      <span>{isExpanded ? '▼' : '▶'}</span>
    </div>
  );

  return (
    <div className="adjustments-panel" style={{ padding: '15px' }}>
      <div className="adjustment-header" style={{ marginBottom: '15px' }}>
        <h3 style={{ margin: 0, color: '#333' }}>🎛️ Image Adjustments</h3>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button 
            className="comparison-btn"
            onClick={onToggleComparison}
            style={{
              background: showComparison ? '#007bff' : '#f8f9fa',
              color: showComparison ? 'white' : '#333'
            }}
          >
            👁️ Compare
          </button>
          <button className="reset-btn" onClick={handleReset}>
            🔄 Reset All
          </button>
        </div>
      </div>

      <div className="adjustment-content">
        {/* Auto Presets */}
        <div>
          <SectionHeader 
            title="🤖 Auto Presets" 
            isExpanded={expandedSections.auto}
            onToggle={() => toggleSection('auto')}
          />
          {expandedSections.auto && (
            <div style={{ padding: '10px 0' }}>
              <CheckboxControl 
                label="✨ Auto Enhance"
                checked={values.autoEnhance}
                onChange={(checked) => handleValueChange('autoEnhance', checked)}
              />
              <CheckboxControl 
                label="🎨 Auto Color Fix"
                checked={values.autoColorFix}
                onChange={(checked) => handleValueChange('autoColorFix', checked)}
              />
              <CheckboxControl 
                label="⚖️ Auto White Balance"
                checked={values.autoWhiteBalance}
                onChange={(checked) => handleValueChange('autoWhiteBalance', checked)}
              />
              <CheckboxControl 
                label="🎭 Auto Tone"
                checked={values.autoTone}
                onChange={(checked) => handleValueChange('autoTone', checked)}
              />
            </div>
          )}
        </div>

        {/* Color Adjustments */}
        <div>
          <SectionHeader 
            title="🌈 Color" 
            isExpanded={expandedSections.color}
            onToggle={() => toggleSection('color')}
          />
          {expandedSections.color && (
            <div style={{ padding: '10px 0' }}>
              <SliderControl 
                label="🎨 Saturation"
                value={values.saturation}
                onChange={(value) => handleValueChange('saturation', value)}
              />
              <SliderControl 
                label="✨ Vibrance"
                value={values.vibration}
                onChange={(value) => handleValueChange('vibration', value)}
              />
              <SliderControl 
                label="🌡️ Temperature"
                value={values.temperature}
                onChange={(value) => handleValueChange('temperature', value)}
                min={-50}
                max={50}
              />
              <SliderControl 
                label="🎛️ Tint"
                value={values.tint}
                onChange={(value) => handleValueChange('tint', value)}
                min={-50}
                max={50}
              />
            </div>
          )}
        </div>

        {/* Tone Adjustments */}
        <div>
          <SectionHeader 
            title="🌞 Tone" 
            isExpanded={expandedSections.tone}
            onToggle={() => toggleSection('tone')}
          />
          {expandedSections.tone && (
            <div style={{ padding: '10px 0' }}>
              <SliderControl 
                label="☀️ Brightness"
                value={values.brightness}
                onChange={(value) => handleValueChange('brightness', value)}
              />
              <SliderControl 
                label="⚡ Contrast"
                value={values.contrast}
                onChange={(value) => handleValueChange('contrast', value)}
              />
              <SliderControl 
                label="🔆 Highlights"
                value={values.highlights}
                onChange={(value) => handleValueChange('highlights', value)}
              />
              <SliderControl 
                label="🌑 Shadows"
                value={values.shadows}
                onChange={(value) => handleValueChange('shadows', value)}
              />
              <SliderControl 
                label="⚪ Whites"
                value={values.whites}
                onChange={(value) => handleValueChange('whites', value)}
              />
              <SliderControl 
                label="⚫ Blacks"
                value={values.blacks}
                onChange={(value) => handleValueChange('blacks', value)}
              />
            </div>
          )}
        </div>

        {/* Clarity Adjustments */}
        <div>
          <SectionHeader 
            title="🔍 Clarity" 
            isExpanded={expandedSections.clarity}
            onToggle={() => toggleSection('clarity')}
          />
          {expandedSections.clarity && (
            <div style={{ padding: '10px 0' }}>
              <SliderControl 
                label="💎 Clarity"
                value={values.clarity}
                onChange={(value) => handleValueChange('clarity', value)}
              />
              <SliderControl 
                label="🌫️ Dehaze"
                value={values.dehaze}
                onChange={(value) => handleValueChange('dehaze', value)}
              />
              <SliderControl 
                label="🔪 Sharpen"
                value={values.sharpen}
                onChange={(value) => handleValueChange('sharpen', value)}
                min={0}
                max={100}
              />
              <SliderControl 
                label="🔇 Noise Reduction"
                value={values.noise}
                onChange={(value) => handleValueChange('noise', value)}
                min={0}
                max={100}
              />
              <SliderControl 
                label="🌊 Blur"
                value={values.blur}
                onChange={(value) => handleValueChange('blur', value)}
                min={0}
                max={20}
                step={0.1}
              />
            </div>
          )}
        </div>

        {/* Creative Adjustments */}
        <div>
          <SectionHeader 
            title="🎭 Creative" 
            isExpanded={expandedSections.creative}
            onToggle={() => toggleSection('creative')}
          />
          {expandedSections.creative && (
            <div style={{ padding: '10px 0' }}>
              <SliderControl 
                label="🌈 Hue Shift"
                value={values.hue}
                onChange={(value) => handleValueChange('hue', value)}
                min={-180}
                max={180}
              />
              <SliderControl 
                label="🎨 Split Toning"
                value={values.split}
                onChange={(value) => handleValueChange('split', value)}
              />
              <SliderControl 
                label="📽️ Film Grain"
                value={values.grain}
                onChange={(value) => handleValueChange('grain', value)}
                min={0}
                max={100}
              />
              <SliderControl 
                label="⭕ Vignette"
                value={values.vignette}
                onChange={(value) => handleValueChange('vignette', value)}
                min={0}
                max={100}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdjustmentsPanel;
