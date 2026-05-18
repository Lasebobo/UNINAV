import { KnowledgeBase } from '../types';

/**
 * OAU CAMPUS KNOWLEDGE BASE
 * Single source of truth — deduplicated, accurate GPS coordinates.
 */
const RAW_CAMPUS_DATA = {
  locations: [
    {
      id: "senate_building",
      name: "Senate Building",
      aliases: ["admin block", "vc office", "senate"],
      type: "facility",
      description: "The Senate Building is the administrative nerve center of OAU, an iconic architectural masterpiece visible from most parts of campus.",
      lat: 7.5197,
      lng: 4.5250,
      imageUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: "hezekiah_library",
      name: "Hezekiah Oluwasanmi Library",
      aliases: ["library", "hol", "main lib", "main library", "hezekiah library"],
      type: "academic",
      description: "The central library of the university, providing extensive digital and physical resources to support the research and learning needs of students and staff.",
      lat: 7.5195,
      lng: 4.5230,
      imageUrl: "https://lh3.googleusercontent.com/gps-cs-s/APNQkAFnBqF8Qjsd01OHvEe1cAJl9o_GH1rTKzYbjyzd_x7AruFaHDWX_90FUNjplXRzHXlRqT3MrxIAGb8iIGD4RkjVud8L1bresNqxCP6EPG9B7_8NzU93-hgM9B-6kXlVTdZgoXh2=s774-k-no"
    },
    {
      id: "spider_building",
      name: "Spider Building",
      aliases: ["civil engineering", "spider"],
      type: "academic",
      description: "The Department of Civil Engineering, popularly known as the Spider Building due to its unique structural design.",
      lat: 7.5228467,
      lng: 4.5291902,
      imageUrl: "https://lh3.googleusercontent.com/gps-cs-s/APNQkAH8427amheTSeT_nx9Sods9L28aCQZ3wL-8HNpgpiiFdd9j3Ef_iLZ6fJkkrULsaIfLrkEY3tFxZcqoF5JjFyggMcbB6OQcbsg0VFl8-r0rtpKvtXxj28XnmqqmgCA_9yh8ys4=w203-h152-k-no"
    },
    {
      id: "amphi",
      name: "Amphi Theatre",
      aliases: ["amphi", "oduduwa hall", "theatre"],
      type: "facility",
      description: "A major venue for student gatherings, shows, and large lectures, located within the Oduduwa Hall complex.",
      lat: 7.5210,
      lng: 4.5220,
      imageUrl: "https://lh3.googleusercontent.com/gps-cs-s/APNQkAFu3LF3Bp5fo6Kg7wNKa8Vt8rWLg95UQQPmtyP7vy258_P3WcH-zwe_gswkxef2xUd-Wnz2pSTvas8G98TXBGmjKjFO95RZfYO6F9T25foxKWZ-xtxL180tBAZTYndGKOeb5XE=s773-k-no"
    },
    {
      id: "sub",
      name: "Student Union Building (SUB)",
      aliases: ["sub", "union building", "ken hill"],
      type: "facility",
      description: "The SUB houses the student union offices, a large buttery, and shops. It is the center of student social politics.",
      lat: 7.5169,
      lng: 4.5213,
      imageUrl: "https://lh3.googleusercontent.com/gps-cs-s/APNQkAGvywORI76kVXhajyeS-MVISzDKN_7g5X397pkxn5w537679IJPWdtLBVBaEPVXdWdJjJ8VhKuTcO0CHQPZXGoH13PUvRAPNlZ5ClwNpU8wWU4FuP8AMmnFtrA42M4kyltL4hQ=s901-k-no"
    },
    {
      id: "moremi",
      name: "Moremi Hall",
      aliases: ["moremi"],
      type: "residential",
      description: "A popular female hall of residence, known for its vibrant atmosphere and proximity to the academic area.",
      lat: 7.5140,
      lng: 4.5190,
      imageUrl: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: "awolowo",
      name: "Awolowo Hall",
      aliases: ["awo", "awo hall"],
      type: "residential",
      description: "The legendary male hall of residence, known for its strong 'Aro' culture and political activism.",
      lat: 7.5130,
      lng: 4.5300,
      imageUrl: "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: "pharmacy",
      name: "Faculty of Pharmacy",
      aliases: ["pharmacy", "pharm", "pharma", "health sciences", "drug research"],
      type: "academic",
      description: "The Faculty of Pharmacy at OAU is a premier center for pharmaceutical education and research in Nigeria, known for its rigorous academic standards.",
      lat: 7.5174,
      lng: 4.5269,
      imageUrl: "https://lh3.googleusercontent.com/gps-cs-s/APNQkAF5x1YIB_k47a9BLrcjMCNWsxIHDhzEWlNRg1BssIEQMOsd3WZU_tTtfpb44peAG_HpjlFcof2C5nf4Kkj07eitwHdH0uyGKuI7WuJRI4kj6J6Ro8H3qo4iBqHM9YNgySsmHpt6zg=w408-h544-k-no"
    },
    {
      id: "motion_ground",
      name: "Motion Ground",
      aliases: ["motion", "motion ground", "car park", "gathering spot"],
      type: "facility",
      description: "A prominent open space and transit hub near the academic core, often used as a landmark for navigation and student gatherings.",
      lat: 7.5183,
      lng: 4.5228,
      imageUrl: "https://images.unsplash.com/photo-1518605368461-1ee738019316?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: "firstbank_lt",
      name: "FirstBank Lecture Theatre",
      aliases: ["FBLT", "firstbank lecture", "firstbank LT"],
      type: "academic",
      description: "A large lecture theatre sponsored by FirstBank, used for major academic and university events.",
      lat: 7.522132,
      lng: 4.524033,
      imageUrl: "https://lh3.googleusercontent.com/gps-cs-s/APNQkAEh8jhOqeygW16ykKVhEv7USKjufTWIM3AO5b8FHZq71LlsGs85Sc9Q7yzOW3qLeYbiTJGckov946je9gNGCTQW89-8pm_Y8gBXXUi-Pim343lBhMWXxqTYwl8y_R7a2gMZi3gotQ=s1031-k-no"
    },
    {
      id: "faculty_of_science",
      name: "Faculty of Science",
      aliases: ["FOS", "faculty of science", "science faculty"],
      type: "academic",
      description: "The Faculty of Science at Obafemi Awolowo University, home to departments including Physics, Chemistry, and Mathematics.",
      lat: 7.51914,
      lng: 4.52514,
      imageUrl: "https://lh3.googleusercontent.com/gps-cs-s/APNQkAF5x1YIB_k47a9BLrcjMCNWsxIHDhzEWlNRg1BssIEQMOsd3WZU_tTtfpb44peAG_HpjlFcof2C5nf4Kkj07eitwHdH0uyGKuI7WuJRI4kj6J6Ro8H3qo4iBqHM9YNgySsmHpt6zg=w408-h544-k-no"
    },
    {
      id: "ACE",
      name: "ACE",
      aliases: ["post graduate", "PG lecture theatre", "ace building"],
      type: "academic",
      description: "The postgraduate facility at Obafemi Awolowo University, Ile-Ife, Nigeria.",
      lat: 7.517826,
      lng: 4.530035,
      imageUrl: "https://weaisrpqcfphiskvbdel.supabase.co/storage/v1/object/public/Images/gate.JPG"
    },

    // ── New locations (GPS-verified) ──────────────────────────
    {
      id: "microbiology_molecular_biology",
      name: "Dept of Microbiology and Molecular Biology",
      aliases: ["microbiology", "molecular biology lab", "biology department"],
      type: "academic",
      description: "A hub for biological research focusing on microorganisms and the molecular basis of biological activity, within the biological sciences complex.",
      lat: 7.5189,
      lng: 4.5258
    },
    {
      id: "botany_department",
      name: "Department of Botany",
      aliases: ["botany", "plant science", "herbarium"],
      type: "academic",
      description: "Dedicated to the study of plant life and ecology, this department manages botanical collections and laboratories for plant research.",
      lat: 7.5195,
      lng: 4.5254
    },
    {
      id: "biochemistry_molecular_biology",
      name: "Dept of Biochemistry and Molecular Biology",
      aliases: ["biochem", "biochemistry lab", "biological sciences"],
      type: "academic",
      description: "Located within the Biological Sciences area, this department focuses on chemical processes within and relating to living organisms.",
      lat: 7.5187,
      lng: 4.5252
    },
    {
      id: "english_department",
      name: "Department of English",
      aliases: ["english", "arts block", "humanities"],
      type: "academic",
      description: "A core department in the Faculty of Arts, fostering literary analysis, linguistics, and creative expression.",
      lat: 7.5192,
      lng: 4.5237
    },
    {
      id: "bus_stop",
      name: "Campus Bus Stop",
      aliases: ["bus stop", "shuttle park", "transport hub", "korope stop"],
      type: "transport",
      description: "A major transit point for the campus shuttle (korope) system, connecting students to various residential and academic blocks.",
      lat: 7.5173,
      lng: 4.5232
    },
    {
      id: "campus_gate_bus_stop",
      name: "Campus Gate Bus Stop",
      aliases: ["campus gate bus stop", "campus gate", "main gate"],
      type: "landmark",
      description: "Campus Gate Bus Stop is a recognized landmark location.",
      lat: 7.497281099999999,
      lng: 4.522773,
      imageUrl: "https://weaisrpqcfphiskvbdel.supabase.co/storage/v1/object/public/Images/gate.JPG"
    },
    {
      id: "obafemi_awolowo_university_health_centre",
      name: "Health Centre",
      aliases: ["obafemi awolowo university health centre"],
      type: "health",
      description: "Obafemi Awolowo University Health Centre provides healthcare and medical support services.",
      lat: 7.517722,
      lng: 4.526348,
      imageUrl: "https://lh3.googleusercontent.com/gps-cs-s/APNQkAH70r0e29bUc1mNThg8wvXetpmlHV5WMO-C7XxsFqr4OhUWw2rTgjHr3XNlSGASbszqVrqqGjtiNb1CZRriBkspKx252_2PkKZq54jvCsTwo7EOBKLPXWkgLVMKx1rFzE5-PVS2oA=s1289-k-no"
    },
    {
      id: "department_of_local_government_studies_old_building",
      name: "Department of Local government Studies (Old Building)",
      aliases: ["department of local government studies", "local government studies", "old building"],
      type: "landmark",
      description: "Department of Local government Studies (Old Building) is a recognized landmark location.",
      lat: 7.5081763,
      lng: 4.5227825
    },
    {
      id: "oau_water_works_administrative_office",
      name: "OAU Water Works Administrative Office",
      aliases: ["oau dam", "water works administrative office", "dam"],
      type: "landmark",
      description: "OAU Water Works Administrative Office is a recognized landmark location.",
      lat: 7.502834999999999,
      lng: 4.5280192,
      imageUrl: "https://lh3.googleusercontent.com/gps-cs-s/APNQkAENq3ASyBrdI7XjlTIQXvnFXyG5bQqGUCa1gwgX8KH2RbCgLTyufkXeGQhY_QuB8w8Gr_sNs23bTJrK7C9OEoeZ-MPlyab5a_Z8k8ys0z8tB5MsAJUHYofXKWQq1YARk0qQl2mB=s812-k-no"
    },
    {
      id: "step_b",
      name: "Step B Building",
      aliases: ["step b", "project office", "ict center"],
      type: "academic",
      description: "Part of the World Bank assisted project facilities, housing specialized research equipment and ICT infrastructure.",
      lat: 7.5179,
      lng: 4.5286
    },
  ],

  routes: [
    {
      id: "r1",
      fromId: "senate_building",
      toId: "sub",
      distance: "600m",
      timeWalking: "8 mins",
      shuttleAvailable: true,
      shuttleFare: "₦50",
      description: "Walk down Road 1, past the Motion Ground turnoff. The SUB is on your right."
    },
    {
      id: "r2",
      fromId: "moremi",
      toId: "spider_building",
      distance: "1.2km",
      timeWalking: "15 mins",
      shuttleAvailable: true,
      shuttleFare: "₦50",
      description: "Take a shuttle from Moremi gate to the Science/Tech park."
    },
    {
      id: "r3",
      fromId: "sub",
      toId: "amphi",
      distance: "300m",
      timeWalking: "4 mins",
      shuttleAvailable: false,
      description: "A short walk past the SUB towards Oduduwa Hall."
    }
  ],

  generalInfo: [
    "Campus Shuttles (Korope) charge ₦50-₦100 per trip.",
    "The Health Center is located on Road 1, near the Staff Quarters.",
    "Night reading at the Library ends at 10 PM, but 24/7 reading rooms are available in faculties.",
    "OAU is known as 'Africa's Most Beautiful Campus'.",
    "The OAU Main Gate is the primary entry point from Ile-Ife town and the main bus stop.",
    "The Biological Sciences complex houses Microbiology, Botany, and Biochemistry departments."
  ]
};

const rawLocations = RAW_CAMPUS_DATA.locations;

const validLocs = rawLocations.filter(l => l.lat && l.lng);
const lats = validLocs.map(l => l.lat);
const lngs = validLocs.map(l => l.lng);

const minLat = Math.min(...lats);
const maxLat = Math.max(...lats);
const minLng = Math.min(...lngs);
const maxLng = Math.max(...lngs);

const latDiff = maxLat - minLat || 0.01;
const lngDiff = maxLng - minLng || 0.01;
const paddedMinLat = minLat - latDiff * 0.1;
const paddedMaxLat = maxLat + latDiff * 0.1;
const paddedMinLng = minLng - lngDiff * 0.1;
const paddedMaxLng = maxLng + lngDiff * 0.1;

const paddedLatDiff = paddedMaxLat - paddedMinLat;
const paddedLngDiff = paddedMaxLng - paddedMinLng;

const locations = rawLocations.map(loc => {
  let x = 50, y = 50;
  if (loc.lat && loc.lng) {
    x = Number((((loc.lng - paddedMinLng) / paddedLngDiff) * 100).toFixed(2));
    y = Number((((paddedMaxLat - loc.lat) / paddedLatDiff) * 100).toFixed(2)); // y increases downwards
  }
  return { ...loc, coords: { x, y } };
});

export const CAMPUS_DATA: KnowledgeBase = {
  ...RAW_CAMPUS_DATA,
  locations: locations as any
};
