import { useState, useEffect, useCallback } from 'react';
import { SphereIndex } from '@/types/sphere';

export type SpreadLevel = 'topFocus' | 'stability' | 'balance' | 'tilt' | 'chaos';

interface SpreadState {
  level: SpreadLevel;
  spread: number;
  minValue: number;
  maxValue: number;
  minSphereId: number | null;
  maxSphereId: number | null;
}

const STORAGE_KEY = 'balance_spread_level';

export function getSpreadLevel(spread: number): SpreadLevel {
  if (spread <= 5) return 'topFocus';
  if (spread <= 10) return 'stability';
  if (spread < 50) return 'balance';
  if (spread < 75) return 'tilt';
  return 'chaos';
}

export function calculateSpread(sphereIndices: SphereIndex[]): SpreadState {
  if (sphereIndices.length === 0) {
    return {
      level: 'stability',
      spread: 0,
      minValue: 0,
      maxValue: 0,
      minSphereId: null,
      maxSphereId: null,
    };
  }

  const values = sphereIndices.map(s => ({
    sphereId: s.sphereId,
    index: s.index,
  }));

  const minItem = values.reduce((min, curr) => curr.index < min.index ? curr : min, values[0]);
  const maxItem = values.reduce((max, curr) => curr.index > max.index ? curr : max, values[0]);
  
  const spread = maxItem.index - minItem.index;
  
  return {
    level: getSpreadLevel(spread),
    spread,
    minValue: minItem.index,
    maxValue: maxItem.index,
    minSphereId: minItem.sphereId,
    maxSphereId: maxItem.sphereId,
  };
}

export function useBalanceSpread(sphereIndices: SphereIndex[]) {
  const [currentState, setCurrentState] = useState<SpreadState | null>(null);
  const [previousLevel, setPreviousLevel] = useState<SpreadLevel | null>(null);
  const [isNewLevel, setIsNewLevel] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Calculate current spread state
  useEffect(() => {
    const state = calculateSpread(sphereIndices);
    setCurrentState(state);

    // Check if level changed from previous
    const storedLevel = localStorage.getItem(STORAGE_KEY);
    const prevLevel = storedLevel as SpreadLevel | null;
    setPreviousLevel(prevLevel);

    if (prevLevel !== null && prevLevel !== state.level) {
      // Level changed - trigger effects
      setIsNewLevel(true);
      setShowModal(true);
      localStorage.setItem(STORAGE_KEY, state.level);
    } else if (prevLevel === null) {
      // First time - just store the level, don't show effects
      localStorage.setItem(STORAGE_KEY, state.level);
      setIsNewLevel(false);
    }
  }, [sphereIndices]);

  const dismissModal = useCallback(() => {
    setShowModal(false);
    setIsNewLevel(false);
  }, []);

  const resetLevelTracking = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setPreviousLevel(null);
    setIsNewLevel(false);
  }, []);

  return {
    currentState,
    previousLevel,
    isNewLevel,
    showModal,
    dismissModal,
    resetLevelTracking,
  };
}
