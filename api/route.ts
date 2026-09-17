import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { originLat, originLng, destLat, destLng } = req.query;
  const mode = (req.query.mode as string | undefined) ?? 'walking';

  try {
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originLat},${originLng}&destination=${destLat},${destLng}&mode=${mode}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.routes?.length) {
      return res.status(404).json({ error: 'No route found', status: data.status });
    }

    const route = data.routes[0];
    const leg   = route.legs[0];

    // Helper to flatten nested steps
    const flattenGoogleSteps = (steps: any[]): any[] => {
      const flat: any[] = [];
      for (const step of steps) {
        if (step.steps && Array.isArray(step.steps) && step.steps.length > 0) {
          flat.push(...flattenGoogleSteps(step.steps));
        } else {
          flat.push(step);
        }
      }
      return flat;
    };

    const flatSteps = flattenGoogleSteps(leg.steps || []);

    res.json({
      polyline:      route.overview_polyline.points,
      steps:         flatSteps.map((step: any) => ({
        instruction: step.html_instructions,
        distance:    step.distance?.text  ?? '',
        distanceMeters: step.distance?.value ?? 0,
        duration:    step.duration?.text  ?? '',
        durationSeconds: step.duration?.value ?? 0,
        maneuver:    step.maneuver        ?? '',
        end_location: step.end_location,
      })),
      totalDistance: leg.distance?.text  ?? '',
      totalDuration: leg.duration?.text  ?? '',
      startAddress:  leg.start_address   ?? '',
      endAddress:    leg.end_address     ?? '',
    });
  } catch (err) {
    console.error('Route error:', err);
    res.status(500).json({ error: 'Failed to fetch route' });
  }
}
