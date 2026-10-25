import { useEffect } from 'react';
import { useArmStore } from '../store/armStore';
import { useUIStore } from '../store/uiStore';
import { useWaypointStore } from '../store/waypointStore';

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      const armStore = useArmStore.getState();
      const uiStore = useUIStore.getState();
      const wpStore = useWaypointStore.getState();

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Undo: Ctrl+Z or Cmd+Z
      if (cmdOrCtrl && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        armStore.undo();
        return;
      }

      // Redo: Ctrl+Shift+Z or Ctrl+Y
      if ((cmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'z') || (cmdOrCtrl && e.key.toLowerCase() === 'y')) {
        e.preventDefault();
        armStore.redo();
        return;
      }

      // Home Pose: 'h'
      if (e.key.toLowerCase() === 'h' && !cmdOrCtrl) {
        e.preventDefault();
        armStore.homePose();
        return;
      }

      // Randomize Pose: 'r'
      if (e.key.toLowerCase() === 'r' && !cmdOrCtrl) {
        e.preventDefault();
        armStore.randomizePose();
        return;
      }

      // Space: Play/Pause Waypoint playback
      if (e.code === 'Space' && !cmdOrCtrl) {
        e.preventDefault();
        wpStore.setPlaying(!wpStore.isPlaying);
        return;
      }

      // Camera Presets: 1 to 5
      if (e.key === '1') {
        uiStore.setCameraPreset('front');
      } else if (e.key === '2') {
        uiStore.setCameraPreset('side');
      } else if (e.key === '3') {
        uiStore.setCameraPreset('top');
      } else if (e.key === '4') {
        uiStore.setCameraPreset('iso');
      } else if (e.key === '5') {
        uiStore.setCameraPreset('followEE');
      }

      // Help Modal: '?'
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        uiStore.setHelpModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
