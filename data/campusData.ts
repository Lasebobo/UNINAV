import { KnowledgeBase } from '../types';

/**
 * OAU CAMPUS KNOWLEDGE BASE
 */
export const CAMPUS_DATA: KnowledgeBase = {
  locations: [
    {
      id: "senate_building",
      name: "Senate Building",
      aliases: ["admin block", "vc office", "senate"],
      type: "facility",
      description: "The Senate Building is the administrative nerve center of OAU, an iconic architectural masterpiece visible from most parts of campus.",
      coords: { x: 52.72, y: 10 },
      lat: 7.5197,
      lng: 4.5250,
      imageUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: "hezekiah_library",
      name: "Hezekiah Oluwasanmi Library",
      aliases: ["library", "hol", "main lib"],
      type: "academic",
      description: "The Hezekiah Oluwasanmi Library is the central research hub, located near the Humanities block and Oduduwa Hall.",
      coords: { x: 41.77, y: 11.27 },
      lat: 7.5195234,
      lng: 4.522992,
      imageUrl: "https://lh3.googleusercontent.com/gps-cs-s/APNQkAFnBqF8Qjsd01OHvEe1cAJl9o_GH1rTKzYbjyzd_x7AruFaHDWX_90FUNjplXRzHXlRqT3MrxIAGb8iIGD4RkjVud8L1bresNqxCP6EPG9B7_8NzU93-hgM9B-6kXlVTdZgoXh2=s774-k-no"
    },
    {
      id: "spider_building",
      name: "Spider Building",
      aliases: ["civil engineering", "spider"],
      type: "academic",
      description: "The Department of Civil Engineering, popularly known as the Spider Building due to its unique structural design.",
      coords: { x: 75.58, y: -12.71 },
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
      coords: { x: 296.55, y: -954.43 },
      lat: 7.6533516883643085,
      lng: 4.569706058620607,
      imageUrl: "https://lh3.googleusercontent.com/gps-cs-s/APNQkAFu3LF3Bp5fo6Kg7wNKa8Vt8rWLg95UQQPmtyP7vy258_P3WcH-zwe_gswkxef2xUd-Wnz2pSTvas8G98TXBGmjKjFO95RZfYO6F9T25foxKWZ-xtxL180tBAZTYndGKOeb5XE=s773-k-no"
    },
    {
      id: "sub",
      name: "Student Union Building (SUB)",
      aliases: ["sub", "union building", "ken hill"],
      type: "facility",
      description: "The SUB houses the student union offices, a large buttery, and shops. It is the center of student social politics.",
      coords: { x: 32.59, y: -232.90 },
      lat: 7.553361707434794,
      lng: 4.521308578369951,
      imageUrl: "https://lh3.googleusercontent.com/gps-cs-s/APNQkAGvywORI76kVXhajyeS-MVISzDKN_7g5X397pkxn5w537679IJPWdtLBVBaEPVXdWdJjJ8VhKuTcO0CHQPZXGoH13PUvRAPNlZ5ClwNpU8wWU4FuP8AMmnFtrA42M4kyltL4hQ=s901-k-no"
    },
    {
      id: "moremi",
      name: "Moremi Hall",
      aliases: ["moremi"],
      type: "residential",
      description: "A popular female hall of residence, known for its vibrant atmosphere and proximity to the academic area.",
      coords: { x: 20, y: 51.13 },
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
      coords: { x: 79.99, y: 58.35 },
      lat: 7.5130,
      lng: 4.5300,
      imageUrl: "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: "pharmacy",
      name: "Faculty of Pharmacy",
      aliases: ["pharmacy", "pharm", "pharma", "Department of Pharmacy"],
      type: "academic",
      description: "The Faculty of Pharmacy is a faculty of Obafemi Awolowo University, Ile-Ife, Nigeria.",
      coords: { x: 64.53, y: 24.20 },
      lat: 7.51773267257539,
      lng: 4.527163980133934,
      imageUrl: "https://lh3.googleusercontent.com/gps-cs-s/APNQkAF5x1YIB_k47a9BLrcjMCNWsxIHDhzEWlNRg1BssIEQMOsd3WZU_tTtfpb44peAG_HpjlFcof2C5nf4Kkj07eitwHdH0uyGKuI7WuJRI4kj6J6Ro8H3qo4iBqHM9YNgySsmHpt6zg=w408-h544-k-no"
    },
    {
      id: "motion_ground",
      name: "Motion Ground",
      aliases: [],
      type: "facility",
      description: "The main sports complex featuring a stadium, swimming pool, and courts for various sports.",
      coords: { x: 52.72, y: 80 },
      lat: 7.5100,
      lng: 4.5250,
      imageUrl: "https://images.unsplash.com/photo-1518605368461-1ee738019316?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: "firstbank_lt",
      name: "FirstBank Lecture Theatre",
      aliases: ["FBLT", "firstbank lecture", "firstbank LT"],
      type: "academic",
      description: "A lecture room that is Firstbank sponsored",
      coords: { x: 47.45, y: -7.55 },
      lat: 7.522132,
      lng: 4.524033,
      imageUrl: "https://lh3.googleusercontent.com/gps-cs-s/APNQkAEh8jhOqeygW16ykKVhEv7USKjufTWIM3AO5b8FHZq71LlsGs85Sc9Q7yzOW3qLeYbiTJGckov946je9gNGCTQW89-8pm_Y8gBXXUi-Pim343lBhMWXxqTYwl8y_R7a2gMZi3gotQ=s1031-k-no"
    },
    {
      id: "faculty_of_science",
      name: "Faculty of Science",
      aliases: ["FOS", "faculty of science", "science faculty"],
      type: "academic",
      description: "The Faculty of Science is a faculty of Obafemi Awolowo University, Ile-Ife, Nigeria.",
      coords: { x: 53.46, y: 14.03 },
      lat: 7.519140877819225,
      lng: 4.525135337940335,
      imageUrl: "https://lh3.googleusercontent.com/gps-cs-s/APNQkAF5x1YIB_k47a9BLrcjMCNWsxIHDhzEWlNRg1BssIEQMOsd3WZU_tTtfpb44peAG_HpjlFcof2C5nf4Kkj07eitwHdH0uyGKuI7WuJRI4kj6J6Ro8H3qo4iBqHM9YNgySsmHpt6zg=w408-h544-k-no"
    },
    {
      id: "ACE",
      name: "ACE",
      aliases: ["post graduate", "PG lecture theatre", ""],
      type: "academic",
      description: "The Post graduate facility  Obafemi Awolowo University, Ile-Ife, Nigeria.",
      coords: { x: 80.18, y: 23.52 },
      lat: 7.517826064344423, 
      lng: 4.530034590223604,
      imageUrl: "https://lh3.googleusercontent.com/gps-cs-s/APNQkAF5x1YIB_k47a9BLrcjMCNWsxIHDhzEWlNRg1BssIEQMOsd3WZU_tTtfpb44peAG_HpjlFcof2C5nf4Kkj07eitwHdH0uyGKuI7WuJRI4kj6J6Ro8H3qo4iBqHM9YNgySsmHpt6zg=w408-h544-k-no"
    }

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
    "OAU is known as 'Africa's Most Beautiful Campus'."
  ]
};