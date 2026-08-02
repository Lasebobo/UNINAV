/**
 * useTurnByTurnNavigation.js
 *
 * React hook that drives step-by-step navigation:
 * 1. Fetches accurate steps from /api/directions (Google Directions proxy)
 * 2. Watches the user's live position (navigator.geolocation.watchPosition)
 * 3. Uses the Haversine formula to measure distance to the *end* of the
 *    current step, and auto-advances to the next step once the user is
 *    within a threshold radius of it.
 * 4. Exposes the current instruction text so you can feed it straight
 *    into your existing Web Speech API TTS call.
 *
 * Usage:
 *   const {
 *     steps, currentStepIndex, currentStep, distanceRemaining,
 *     isArrived, error, loading,
 *   } = useTurnByTurnNavigation({ origin, destination });
 */

import { useEffect, useRef, useState, useCallback } from 'react';

const ARRIVAL_THRESHOLD_METERS = 12; // how close counts as "reached this step"
const EARTH_RADIUS_METERS = 6371000;

// Haversine distance between two lat/lng points, in meters
function haversineDistance(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const h =
    sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;

  const c = 2 * Math.asin(Math.min(1, Math.sqrt(h)));
  return EARTH_RADIUS_METERS * c;
}

export function useTurnByTurnNavigation(steps: any[]) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [distanceRemaining, setDistanceRemaining] = useState<number | null>(null);
  const [isArrived, setIsArrived] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isNavigating, setIsNavigating] = useState(false);
  const [fallbackMode, setFallbackMode] = useState(false);

  const watchIdRef = useRef<number | null>(null);

  const speakInstruction = useCallback((text: string, onEnd?: () => void) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice =
      voices.find((v) => v.lang.includes('en-US') && v.name.includes('Google')) ||
      voices.find((v) => v.lang.toLowerCase().startsWith('en'));
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.rate = 1.1;

    if (onEnd) {
      utterance.onend = onEnd;
    }
    window.speechSynthesis.speak(utterance);
  }, []);

  // Reset state when steps change
  useEffect(() => {
    setError(null);
    setIsArrived(false);
    setCurrentStepIndex(0);
    setDistanceRemaining(null);
    setIsNavigating(false);
    setFallbackMode(false);
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    window.speechSynthesis.cancel();
  }, [steps]);

  // Fallback mode advancement logic (speech-based)
  const advanceToNextStepFallback = useCallback(() => {
    if (currentStepIndex + 1 < steps.length) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      speakInstruction(steps[nextIndex].instruction, advanceToNextStepFallback);
    } else {
      setIsNavigating(false);
      setFallbackMode(false);
      speakInstruction('You have arrived at your destination.');
    }
  }, [currentStepIndex, steps, speakInstruction]);

  // 2. Watch live position and advance steps based on real distance
  const handlePosition = useCallback(
    (position: GeolocationPosition) => {
      if (!steps.length || isArrived || !isNavigating) return;

      const userPos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      const step = steps[currentStepIndex];
      if (!step || !step.endLocation) return;

      const distToStepEnd = haversineDistance(userPos, step.endLocation);
      setDistanceRemaining(distToStepEnd);

      if (distToStepEnd <= ARRIVAL_THRESHOLD_METERS) {
        const isLastStep = currentStepIndex === steps.length - 1;

        if (isLastStep) {
          setIsArrived(true);
          setIsNavigating(false);
          speakInstruction('You have arrived at your destination.');
        } else {
          const nextIndex = currentStepIndex + 1;
          setCurrentStepIndex(nextIndex);
          speakInstruction(steps[nextIndex].instruction);
        }
      }
    },
    [steps, currentStepIndex, isArrived, isNavigating, speakInstruction]
  );

  const startNavigation = useCallback(() => {
    if (!steps || steps.length === 0) return;

    setIsNavigating(true);
    setCurrentStepIndex(0);
    setFallbackMode(false);
    setIsArrived(false);

    speakInstruction(steps[0].instruction);

    if ('geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        handlePosition,
        (err) => {
          console.error('Geolocation error:', err);
          setError('Unable to get live location for navigation');
          setFallbackMode(true);
          speakInstruction(steps[0].instruction, advanceToNextStepFallback);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 1000,
          timeout: 10000,
        }
      );
    } else {
      setError('Geolocation is not supported on this device');
      setFallbackMode(true);
      speakInstruction(steps[0].instruction, advanceToNextStepFallback);
    }
  }, [steps, handlePosition, speakInstruction, advanceToNextStepFallback]);

  const stopNavigation = useCallback(() => {
    setIsNavigating(false);
    setFallbackMode(false);
    setCurrentStepIndex(0);

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    window.speechSynthesis.cancel();
  }, []);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    steps,
    currentStepIndex,
    currentStep: steps[currentStepIndex] || null,
    distanceRemaining,
    isArrived,
    error,
    isNavigating,
    fallbackMode,
    startNavigation,
    stopNavigation,
  };
}
