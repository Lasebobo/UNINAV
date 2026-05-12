import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { originLat, originLng, destLat, destLng } = req.query;

  try {
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originLat},${originLng}&destination=${destLat},${destLng}&mode=walking&key=${process.env.GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.routes?.length) {
      return res.status(404).json({ error: 'No route found', status: data.status });
    }

    const route = data.routes[0];
    const leg   = route.legs[0];

    res.json({
      polyline:      route.overview_polyline.points,
      steps:         leg.steps.map((step: any) => ({
        instruction: step.html_instructions,
        distance:    step.distance?.text  ?? '',
        duration:    step.duration?.text  ?? '',
        maneuver:    step.maneuver        ?? '',
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
