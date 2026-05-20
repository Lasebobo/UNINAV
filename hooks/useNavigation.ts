import { useState, useRef, useCallback, useEffect } from 'react';
import { RouteStep, LatLng } from '../services/routeService';

function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function useNavigation(steps: RouteStep[]) {
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [hasAnnouncedWarning, setHasAnnouncedWarning] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  // Keep refs for state values needed inside the watchPosition callback
  const stateRef = useRef({
    isNavigating,
    currentStepIndex,
    fallbackMode,
    hasAnnouncedWarning,
    steps,
  });

  useEffect(() => {
    stateRef.current = {
      isNavigating,
      currentStepIndex,
      fallbackMode,
      hasAnnouncedWarning,
      steps,
    };
  }, [isNavigating, currentStepIndex, fallbackMode, hasAnnouncedWarning, steps]);

  const speakInstruction = useCallback((text: string, onEnd?: () => void) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice =
      voices.find((v) => v.lang.includes('en-US') && v.name.includes('Google')) ||
      voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.rate = 1.1;

    if (onEnd) {
      utterance.onend = onEnd;
    }
    window.speechSynthesis.speak(utterance);
  }, []);

  const advanceToNextStep = useCallback(() => {
    const { currentStepIndex, steps } = stateRef.current;
    if (currentStepIndex + 1 < steps.length) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      setHasAnnouncedWarning(false);
      speakInstruction(steps[nextIndex].instruction);
    } else {
      // Reached the end
      stopNavigation();
      speakInstruction('You have arrived at your destination.');
    }
  }, [speakInstruction]);

  // Fallback mode advancement logic (speech-based)
  const advanceToNextStepFallback = useCallback(() => {
    const { currentStepIndex, steps } = stateRef.current;
    if (currentStepIndex + 1 < steps.length) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      speakInstruction(steps[nextIndex].instruction, advanceToNextStepFallback);
    } else {
      stopNavigation();
      speakInstruction('You have arrived at your destination.');
    }
  }, [speakInstruction]);

  const onLocationUpdate = useCallback(
    (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      const { currentStepIndex, steps, hasAnnouncedWarning } = stateRef.current;

      const step = steps[currentStepIndex];
      const target = step?.target;

      if (!target) {
        // If there's no target coordinate, we can't reliably do location-based checking.
        // We'll just wait for the next step or fallback. Ideally target is always present.
        return;
      }

      const distance = calculateHaversineDistance(latitude, longitude, target.lat, target.lng);

      if (distance <= 30) {
        // We reached the maneuver point
        advanceToNextStep();
      } else if (distance <= 80 && !hasAnnouncedWarning && currentStepIndex + 1 < steps.length) {
        // Early warning
        const nextStep = steps[currentStepIndex + 1];
        speakInstruction(`In ${Math.round(distance)} metres, ${nextStep.instruction}`);
        setHasAnnouncedWarning(true);
      }
    },
    [advanceToNextStep, speakInstruction]
  );

  const onLocationError = useCallback(
    (error: GeolocationPositionError) => {
      console.warn('Geolocation error during navigation:', error);
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      
      const { fallbackMode, currentStepIndex, steps } = stateRef.current;
      if (!fallbackMode) {
        setFallbackMode(true);
        // Fallback: immediately read the current step and setup speech-end chaining
        speakInstruction(steps[currentStepIndex].instruction, advanceToNextStepFallback);
      }
    },
    [speakInstruction, advanceToNextStepFallback]
  );

  const startNavigation = useCallback(() => {
    if (!steps || steps.length === 0) return;

    setIsNavigating(true);
    setCurrentStepIndex(0);
    setFallbackMode(false);
    setHasAnnouncedWarning(false);

    // Initial instruction read immediately
    speakInstruction(steps[0].instruction);

    if ('geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        onLocationUpdate,
        onLocationError,
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
      );
    } else {
      // No geolocation support
      onLocationError({
        code: 2,
        message: 'Geolocation not supported',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      } as GeolocationPositionError);
    }
  }, [steps, onLocationUpdate, onLocationError, speakInstruction]);

  const stopNavigation = useCallback(() => {
    setIsNavigating(false);
    setFallbackMode(false);
    setCurrentStepIndex(0);
    setHasAnnouncedWarning(false);

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    window.speechSynthesis.cancel();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    isNavigating,
    currentStepIndex,
    fallbackMode,
    startNavigation,
    stopNavigation,
  };
}
