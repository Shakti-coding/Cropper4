
import React, { useEffect, useState } from 'react';

interface A2HSButtonProps {
  onInstall?: () => void;
}

const A2HSButton: React.FC<A2HSButtonProps> = ({ onInstall }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    // Check if PWA is installed using multiple methods
    const checkPWAInstalled = async () => {
      try {
        // Method 1: Check display mode
        if (window.matchMedia('(display-mode: standalone)').matches) {
          setIsPWAInstalled(true);
          return;
        }

        // Method 2: Check if running in PWA mode (iOS)
        if ((window.navigator as any).standalone === true) {
          setIsPWAInstalled(true);
          return;
        }

        // Method 3: Check getInstalledRelatedApps (with proper error handling)
        if ('getInstalledRelatedApps' in navigator) {
          try {
            const relatedApps = await (navigator as any).getInstalledRelatedApps();
            if (relatedApps && relatedApps.length > 0) {
              setIsPWAInstalled(true);
              return;
            }
          } catch (error) {
            // Silently handle unsupported API
            console.debug('getInstalledRelatedApps not supported');
          }
        }

        setIsPWAInstalled(false);
      } catch (error) {
        console.debug('PWA detection failed:', error);
        setIsPWAInstalled(false);
      }
    };

    checkPWAInstalled();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsPWAInstalled(true);
        setShowButton(false);
        onInstall?.();
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Installation failed:', error);
    }
  };

  // Don't show button if PWA is already installed
  if (isPWAInstalled) {
    return null;
  }

  // Only show button if install prompt is available
  if (!showButton || !deferredPrompt) {
    return null;
  }

  return (
    <button 
      onClick={handleInstall}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '12px 16px',
        fontSize: '14px',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        zIndex: 1000
      }}
    >
      Install App
    </button>
  );
};

export default A2HSButton;
