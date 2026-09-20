
import { fetchOsrmRoute } from './services/routeService';
import { CAMPUS_DATA } from './data/campusData';

async function run() {
  const amphi = CAMPUS_DATA.locations.find(l => l.id === 'amphitheatre');
  const gate = CAMPUS_DATA.locations.find(l => l.id === 'campus-gate');
  
  if (amphi && gate && amphi.lat && amphi.lng && gate.lat && gate.lng) {
    const route = await fetchOsrmRoute(
      { lat: gate.lat, lng: gate.lng },
      { lat: amphi.lat, lng: amphi.lng }
    );
    console.log(route?.steps.map(s => s.instruction));
  }
}
run().catch(console.error);

