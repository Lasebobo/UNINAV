/**
 * directionsRoute.js
 *
 * Express route that proxies Google Directions API to get accurate,
 * real-world turn-by-turn walking directions between two campus points.
 *
 * Why Google Directions here instead of OSRM for step text:
 * - Google's `steps[]` array gives human-readable maneuver instructions
 *   (e.g. "Turn right onto Road X", "Continue straight for 120m") derived
 *   from real street/path data, which is more reliable than deriving
 *   labels manually from OSRM geometry.
 * - Your API key stays server-side, same pattern as your existing proxy.
 *
 * Usage:
 *   GET /api/directions?originLat=..&originLng=..&destLat=..&destLng=..
 *
 * Response:
 *   {
 *     distanceMeters: number,
 *     durationSeconds: number,
 *     polyline: string,            // encoded polyline for the whole route
 *     steps: [
 *       {
 *         instruction: string,      // plain text, HTML stripped
 *         maneuver: string | null,  // e.g. "turn-left", "turn-right", "straight"
 *         distanceMeters: number,
 *         durationSeconds: number,
 *         startLocation: { lat, lng },
 *         endLocation: { lat, lng },
 *         polyline: string          // encoded polyline for just this step
 *       },
 *       ...
 *     ]
 *   }
 */

import express from 'express';
const router = express.Router();

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY; // keep server-side only

// Strips Google's HTML instructions (e.g. "<b>Turn right</b> onto X") to plain text
function stripHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .trim();
}

router.get('/api/directions', async (req, res) => {
  const { originLat, originLng, destLat, destLng } = req.query;

  if (!originLat || !originLng || !destLat || !destLng) {
    return res.status(400).json({
      error: 'originLat, originLng, destLat, destLng are all required',
    });
  }

  if (!GOOGLE_API_KEY) {
    return res.status(500).json({
      error: 'Server misconfiguration: GOOGLE_MAPS_API_KEY is not set',
    });
  }

  const params = new URLSearchParams({
    origin: `${originLat},${originLng}`,
    destination: `${destLat},${destLng}`,
    mode: 'walking', // campus navigation is pedestrian
    key: GOOGLE_API_KEY,
  });

  const url = `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      return res.status(502).json({
        error: `Google Directions API error: ${data.status}`,
        message: data.error_message || null,
      });
    }

    const route = data.routes[0];
    const leg = route.legs[0]; // single-leg trip (one origin, one destination)

    const steps = leg.steps.map((step: any) => ({
      instruction: stripHtml(step.html_instructions),
      maneuver: step.maneuver || null,
      distanceMeters: step.distance.value,
      durationSeconds: step.duration.value,
      startLocation: {
        lat: step.start_location.lat,
        lng: step.start_location.lng,
      },
      endLocation: {
        lat: step.end_location.lat,
        lng: step.end_location.lng,
      },
      polyline: step.polyline.points,
    }));

    return res.json({
      distanceMeters: leg.distance.value,
      durationSeconds: leg.duration.value,
      polyline: route.overview_polyline.points,
      steps,
    });
  } catch (err) {
    console.error('Directions proxy error:', err);
    return res.status(500).json({ error: 'Failed to fetch directions' });
  }
});

export default router;
