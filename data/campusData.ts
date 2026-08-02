import { KnowledgeBase } from '../types';

/**
 * OAU CAMPUS KNOWLEDGE BASE
 * Single source of truth — deduplicated, accurate GPS coordinates.
 */
const RAW_CAMPUS_DATA = {
  locations: [
    {
      id: "hezekiah_library",
      name: "Hezekiah Oluwasanmi Library",
      aliases: ["library", "hol", "main lib", "main library", "hezekiah library"],
      type: "academic",
      description: "The central library of the university, providing extensive digital and physical resources to support the research and learning needs of students and staff.",
      lat: 7.5195,
      lng: 4.5230,
      imageUrl: "images/hezekiah_library.jpg"
    },
    {
      id: "spider_building",
      name: "Spider Building",
      aliases: ["civil engineering", "spider"],
      type: "academic",
      description: "The Department of Civil Engineering, popularly known as the Spider Building due to its unique structural design.",
      lat: 7.5228467,
      lng: 4.5291902,
      imageUrl: "images/spider_building.jpeg"
    },
    {
      id: "amphi",
      name: "Amphi Theatre",
      aliases: ["amphi", "oduduwa hall", "theatre"],
      type: "facility",
      description: "A major venue for student gatherings, shows, and large lectures, located within the Oduduwa Hall complex.",
      lat: 7.519465202308837,
      lng: 4.521984748573766,
      imageUrl: "images/amphi.png"
    },
    {
      id: "sub",
      name: "Student Union Building (SUB)",
      aliases: ["sub", "union building", "ken hill"],
      type: "facility",
      description: "The SUB houses the student union offices, a large buttery, and shops. It is the center of student social politics.",
      lat: 7.5169,
      lng: 4.5213,
      imageUrl: "images/sub.jpg"
    },
    {
      id: "moremi",
      name: "Moremi Hall",
      aliases: ["moremi"],
      type: "residential",
      description: "A popular female hall of residence, known for its vibrant atmosphere and proximity to the academic area.",
      lat: 7.5140,
      lng: 4.5190,
      imageUrl: "images/moremi.jpg"
    },
    {
      id: "awolowo",
      name: "Awolowo Hall",
      aliases: ["awo", "awo hall"],
      type: "residential",
      description: "The legendary male hall of residence, known for its strong 'Aro' culture and political activism.",
      lat: 7.522047983886849,
      lng: 4.515844175862876,
      imageUrl: "images/awolowo.jpg"
    },
    {
      id: "pharmacy",
      name: "Faculty of Pharmacy",
      aliases: ["pharmacy", "pharm", "pharma", "health sciences", "drug research"],
      type: "academic",
      description: "The Faculty of Pharmacy at OAU is a premier center for pharmaceutical education and research in Nigeria, known for its rigorous academic standards.",
      lat: 7.5174,
      lng: 4.5269,
      imageUrl: "images/pharmacy.jpg"
    },
    {
      id: "motion_ground",
      name: "Motion Ground",
      aliases: ["motion", "motion ground", "car park", "gathering spot"],
      type: "facility",
      description: "A prominent open space and transit hub near the academic core, often used as a landmark for navigation and student gatherings.",
      lat: 7.5183,
      lng: 4.5228,
      imageUrl: "images/motion_ground.jpg"
    },
    {
      id: "firstbank_lt",
      name: "FirstBank Lecture Theatre",
      aliases: ["FBLT", "firstbank lecture", "firstbank LT"],
      type: "academic",
      description: "A large lecture theatre sponsored by FirstBank, used for major academic and university events.",
      lat: 7.522132,
      lng: 4.524033,
      imageUrl: "images/firstbank_lt.png"
    },
    {
      id: "faculty_of_science",
      name: "Faculty of Science",
      aliases: ["FOS", "faculty of science", "science faculty"],
      type: "academic",
      description: "The Faculty of Science at Obafemi Awolowo University, home to departments including Physics, Chemistry, and Mathematics.",
      lat: 7.51914,
      lng: 4.52514,
      imageUrl: "images/faculty_of_science.png"
    },
    {
      id: "ACE",
      name: "ACE",
      aliases: ["post graduate", "PG lecture theatre", "ace building"],
      type: "academic",
      description: "The postgraduate facility at Obafemi Awolowo University, Ile-Ife, Nigeria.",
      lat: 7.517826,
      lng: 4.530035,
      imageUrl: "images/ACE.jpg"
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
      imageUrl: "images/campus_gate_bus_stop.jpg"
    },
    {
      id: "obafemi_awolowo_university_health_centre",
      name: "Health Centre",
      aliases: ["obafemi awolowo university health centre"],
      type: "health",
      description: "Obafemi Awolowo University Health Centre provides healthcare and medical support services.",
      lat: 7.517722,
      lng: 4.526348,
      imageUrl: "images/obafemi_awolowo_university_health_centre.jpg"
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
      imageUrl: "images/oau_water_works_administrative_office.jpg"
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
    {
      id: "oak_park_conference_hall",
      name: "OAK Park Conference Hall",
      aliases: ["oak park conference hall", "oak park"],
      type: "landmark",
      description: "OAK Park Conference Hall is a recognized landmark location.",
      lat: 7.5182477,
      lng: 4.530310399999999,
      imageUrl: "images/oak_park_conference_hall.jpg"
    },
    {
      id: "oduduwa_hall",
      name: "Oduduwa Hall",
      aliases: ["oduduwa hall", "oduduwa"],
      type: "landmark",
      description: "Oduduwa Hall is a recognized landmark location.",
      lat: 7.5187366,
      lng: 4.5220392,
      imageUrl: "images/oduduwa_hall.jpg"
    },
    {
      id: "pit_theatre",
      name: "Pit Theatre",
      aliases: ["pit theatre"],
      type: "landmark",
      description: "Pit Theatre is a recognized landmark location.",
      lat: 7.521662699999999,
      lng: 4.521122699999999,
      imageUrl: "images/pit_theatre.jpg"
    },
    {
      id: "admin_extention",
      name: "Admin Extention",
      aliases: ["admin extention", "admin extension"],
      type: "landmark",
      description: "Admin Extention is a recognized landmark location.",
      lat: 7.521569999999999,
      lng: 4.5196114,
      imageUrl: "images/admin_extention.jpg"
    },
    {
      id: "adekunle_fajuyi_hall_obafemi_awolowo_university",
      name: "Adekunle Fajuyi Hall, Obafemi Awolowo University",
      aliases: ["adekunle fajuyi hall", "fajuyi hall", "faj"],
      type: "residential",
      description: "Adekunle Fajuyi Hall, Obafemi Awolowo University is a recognized landmark location.",
      lat: 7.517677,
      lng: 4.5176115,
      imageUrl: "images/adekunle_fajuyi_hall_obafemi_awolowo_university.jpg"
    },
    {
      id: "akintola_hostel",
      name: "Akintola Hostel",
      aliases: ["akintola hostel", "akintola hall", "akintola"],
      type: "residential",
      description: "Akintola Hostel is a female hostel beside the sports complex.",
      lat: 7.5170083,
      lng: 4.5198364,
      imageUrl: "images/akintola_hostel.jpg"
    },
    {
      id: "awovarsity_hall",
      name: "Awovarsity Hall",
      aliases: ["awovarsity hall", "awovarsity"],
      type: "landmark",
      description: "Awovarsity Hall is a recognized landmark location.",
      lat: 7.513338899999999,
      lng: 4.524348799999999,
      imageUrl: "images/awovarsity_hall.jpg"
    },
    {
      id: "alex_duduyemi_lecture_theater",
      name: "Alex Duduyemi Lecture Theater",
      aliases: ["alex duduyemi lecture theater"],
      type: "landmark",
      description: "Alex Duduyemi Lecture Theater is a recognized landmark location.",
      lat: 7.5238741,
      lng: 4.5262451,
      imageUrl: "images/alex_duduyemi_lecture_theater.jpg"
    },
    {
      id: "ajose_lecture_theatre",
      name: "Ajose Lecture Theatre",
      aliases: ["ajose lecture theatre", "ajose"],
      type: "landmark",
      description: "Ajose Lecture Theatre is a recognized landmark location.",
      lat: 7.5213991,
      lng: 4.5265529,
      imageUrl: "images/ajose_lecture_theatre.jpg"
    },
    {
      id: "oau_sports_complex",
      name: "OAU Sports Complex",
      aliases: ["sports complex", "sport centre", "the complex", "main bowl", "OAU stadium"],
      type: "sports",
      description: "A comprehensive multi-sport facility established alongside the university in the early 1960s, centrally located on the OAU campus near the SUB building and Bank area. It houses a certified 8-lane tartan athletics track, standard football pitch, Olympic-size swimming pool, indoor courts for basketball, volleyball, badminton and table tennis, tennis courts, a squash court, gymnasium, and a cricket field — serving as a training ground for NUGA Games and numerous national-level athletes.",
      coords: { x: 0, y: 0 },
      lat: 7.5166215651268224,
      lng: 4.520955876730226,
      imageUrl: "https://lh3.googleusercontent.com/gps-cs-s/APNQkAF0fr5Uke3U2nXLA_ZdMazrHKbVKyX9WiFeqhQuq7qUG_hCsFJjzkzy0XXajyeRMh2HqUPbsi_sVuUBCvIyGQKZq7-qBlQarBH4gyiU1wkB8TwxNa6JzMdenBThAqSQPLeAR5Y=s901-k-no"
    },
    {
      id: "ojaja_hostel",
      name: "Ojaja Hostel",
      aliases: ["ojaja hostel", "ojaja hall", "ojaja"],
      type: "residential",
      description: "Ojaja Hostel is a recognized landmark location.",
      lat: 7.517415,
      lng: 4.509251700000001,
      imageUrl: "images/ojaja_hostel.jpg"
    },
    {
      id: "mozambique_hall_obafemi_awolowo_university",
      name: "Mozambique Hall, Obafemi Awolowo University",
      aliases: ["mozambique hall", "moz", "mozambique"],
      type: "residential",
      description: "Mozambique Hall, Obafemi Awolowo University is a recognized landmark location.",
      lat: 7.522280599999999,
      lng: 4.514088999999999,
      imageUrl: "images/mozambique_hall_obafemi_awolowo_university.jpg"
    },
    {
      id: "basketball_court_oau_ife",
      name: "Basketball court OAU Ife",
      aliases: ["basketball court"],
      type: "facility",
      description: "Basketball court OAU Ife is a recognized landmark location.",
      lat: 7.523088700000001,
      lng: 4.514238199999999,
      imageUrl: ""
    },
    {
      id: "angola_hall_obafemi_awolowo_university",
      name: "Angola Hall, Obafemi Awolowo University",
      aliases: ["angola hall", "angola"],
      type: "residential",
      description: "Angola Hall, Obafemi Awolowo University is a recognized landmark location.",
      lat: 7.521747299999999,
      lng: 4.5123356,
      imageUrl: "images/angola_hall_obafemi_awolowo_university.jpg"
    },
    {
      id: "new_senate_building",
      name: "New Senate Building",
      aliases: ["new senate building", "new senate", "Senate building"],
      type: "landmark",
      description: "New Senate Building is a recognized landmark location.",
      lat: 7.518702892841351,
      lng: 4.524234160623102,
      imageUrl: "images/new_senate_building.jpg"
    },
    {
      id: "biological_science_area_faculty_of_sciences_obafemi_awolowo_university",
      name: "Biological Science Area, Faculty of Sciences",
      aliases: ["biological science area", "biological sciences"],
      type: "academic",
      description: "Biological Science Area, Faculty of Sciences, Obafemi Awolowo University is an academic facility within the university environment.",
      lat: 7.518968399999999,
      lng: 4.525836099999999,
      imageUrl: "images/biological_science_area_faculty_of_sciences_obafemi_awolowo_university.jpg"
    },
    {
      id: "faculty_of_social_sciences_obafemi_awolowo_university",
      name: "Faculty of Social Sciences, Obafemi Awolowo University",
      aliases: ["faculty of social sciences", "social sciences"],
      type: "academic",
      description: "Faculty of Social Sciences, Obafemi Awolowo University is an academic facility within the university environment.",
      lat: 7.521239899999999,
      lng: 4.5225092,
      imageUrl: "images/faculty_of_social_sciences_obafemi_awolowo_university.jpg"
    },
    {
      id: "bus_stop_2",
      name: "Bus Stop 2",
      aliases: ["bus stop 2", "sub bus stop", "second bus stop", "sub terminal", "korope park 2"],
      type: "transport",
      description: "A major transit terminal on campus located close to the Student Union Building (SUB), serving as a primary boarding point for campus shuttle buses (Korope) and taxis transporting students to different residential halls and academic blocks.",
      lat: 7.5176082,
      lng: 4.5221937
    },
    {
      id: "chemical_engineering_lecture_theatre",
      name: "Chemical Engineering Lecture Theatre",
      aliases: ["chemical engineering lecture theatre", "celt", "chemical engineering lt", "chem eng lt", "chem tech lt"],
      type: "academic",
      description: "A modern, well-equipped academic auditorium situated within the Faculty of Technology, dedicated to hosting chemical engineering lectures, seminars, student defense presentations, and major departmental events.",
      lat: 7.5193482,
      lng: 4.528701
    },
    {
      id: "oau_staff_quarters_gate_security_post",
      name: "OAU Staff Quarters Gate Security Post",
      aliases: ["oau staff quarters gate security post", "staff quarters gate", "quarters gate", "staff quarters security post", "staff quarters checkpoint"],
      type: "landmark",
      description: "A secured access control checkpoint situated at the entrance of the OAU Staff Quarters, staffed 24/7 by university security personnel to regulate entry and maintain safety within the faculty residential quarters.",
      lat: 7.5195943,
      lng: 4.5323669
    },
    {
      id: "ict_centre",
      name: "ICT Centre",
      aliases: ["ict centre", "ict center", "oau ict center", "computer centre", "information technology center", "central ict block"],
      type: "facility",
      description: "The central hub for the university's information and communications technology infrastructure, housing compute servers, internet access facilities, e-learning classrooms, and specialized IT support offices for the OAU community.",
      lat: 7.5177797,
      lng: 4.526445
    },
    {
      id: "moremi_garden",
      name: "Moremi Garden",
      aliases: ["moremi garden", "moremi gardens", "moremi recreation center", "moremi park"],
      type: "landmark",
      description: "A serene, beautifully landscaped recreational garden located adjacent to Moremi Hall, featuring lush green lawns, shade trees, and walking paths ideal for relaxation, reading, and student gatherings.",
      lat: 7.5205243,
      lng: 4.517935
    },
    {
      id: "mathematics_department_yellow_house",
      name: "Obafemi Awolowo University Mathematics Department",
      aliases: ["obafemi awolowo university mathematics department", "mathematics department", "maths dept", "yellow house", "dept of mathematics", "math department"],
      type: "academic",
      description: "The Department of Mathematics at Obafemi Awolowo University, housed in the iconic 'Yellow House' building. It is a key academic department providing comprehensive mathematical education and training across all faculties.",
      lat: 7.5197308,
      lng: 4.5204433
    },
    {
      id: "boo_lecture_theatres",
      name: "BOO Lecture Theatres (BOOA/B/C)",
      aliases: ["boo lecture theatres", "boo a b c", "booa b c", "boo lt", "boo hall", "boo lecture halls"],
      type: "academic",
      description: "The BOO Lecture Theatres, consisting of BOO A, BOO B, and BOO C, are prominent large-capacity lecture auditoriums widely used for introductory undergraduate lectures, massive joint university classes, and administrative examinations.",
      lat: 7.5190345,
      lng: 4.5227804
    }
  ],

  routes: [
    {
      id: "r1",
      fromId: "new_senate_building",
      toId: "sub",
      distance: "600m",
      timeWalking: "8 mins",
      shuttleAvailable: true,
      shuttleFare: "₦100",
      description: "Walk down Road 1, past the Motion Ground turnoff. The SUB is on your right."
    },
    {
      id: "r2",
      fromId: "moremi",
      toId: "spider_building",
      distance: "1.2km",
      timeWalking: "15 mins",
      shuttleAvailable: true,
      shuttleFare: "₦100",
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
    },
    {
      id: "r4",
      fromId: "mozambique_hall_obafemi_awolowo_university",
      toId: "hezekiah_library",
      distance: "850m",
      timeWalking: "10 mins",
      shuttleAvailable: true,
      shuttleFare: "₦100",
      description: "Walk south from Mozambique Hall down Road 1 past Moremi Hall. Turn left onto the library road. The library is straight ahead."
    },
    {
      id: "r5",
      fromId: "moremi",
      toId: "faculty_of_science",
      distance: "700m",
      timeWalking: "9 mins",
      shuttleAvailable: false,
      description: "Walk from Moremi gate towards the Sports Complex, cross the main walkway, and continue past Motion Ground to the Faculty of Science buildings."
    },
    {
      id: "r6",
      fromId: "campus_gate_bus_stop",
      toId: "sub",
      distance: "2.4km",
      timeWalking: "30 mins",
      shuttleAvailable: true,
      shuttleFare: "₦100",
      description: "Take a campus shuttle (korope) from the main gate. The shuttle will take you down Road 1 and drop you off at SUB bus stop."
    },
    {
      id: "r7",
      fromId: "awolowo",
      toId: "hezekiah_library",
      distance: "650m",
      timeWalking: "8 mins",
      shuttleAvailable: false,
      description: "Walk out of Awo Hall gate, head east down the path towards Oduduwa Hall, walk past Amphi Theatre, and cross to the library."
    },
    {
      id: "r8",
      fromId: "angola_hall_obafemi_awolowo_university",
      toId: "pharmacy",
      distance: "1.4km",
      timeWalking: "18 mins",
      shuttleAvailable: true,
      shuttleFare: "₦100",
      description: "Walk towards Awolowo Hall road, take a campus shuttle (korope) towards Pharmacy block or walk down Road 1 and turn left at Health Centre."
    },
    {
      id: "r9",
      fromId: "adekunle_fajuyi_hall_obafemi_awolowo_university",
      toId: "spider_building",
      distance: "1.1km",
      timeWalking: "14 mins",
      shuttleAvailable: true,
      shuttleFare: "₦100",
      description: "Walk towards SUB bus stop and take a shuttle heading to the Faculty of Technology/Spider building."
    },
    {
      id: "r10",
      fromId: "bus_stop_2",
      toId: "obafemi_awolowo_university_health_centre",
      distance: "500m",
      timeWalking: "6 mins",
      shuttleAvailable: false,
      description: "Walk east from Bus Stop 2, cross the road towards the Faculty of Pharmacy, and continue down the street to the Health Centre on your left."
    }
  ],
  generalInfo: [
    "Transport Logistics Data:\nfrom campus gate to Bus stop 1 & 2\n- School shuttle Buses is 1 ticket\n- town buses is #150\n- keke is 2 tickets\nfrom campus gate to anywhere(limited to New market, Halls of residence, road 7, ICT, Pharmacy, Religious ground) on capus rather than the bus stops \n- School shuttle Buses is 2 tickets\n- keke is 3 tickets",
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
