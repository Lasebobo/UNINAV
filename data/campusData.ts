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
      imageUrl: "https://weaisrpqcfphiskvbdel.supabase.co/storage/v1/object/public/Images/spider.jpeg"
    },
    {
      id: "amphi",
      name: "Amphi Theatre",
      aliases: ["amphi", "oduduwa hall", "theatre"],
      type: "facility",
      description: "A major venue for student gatherings, shows, and large lectures, located within the Oduduwa Hall complex.",
      lat: 7.519465202308837,
      lng:  4.521984748573766,
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
      imageUrl: "https://weaisrpqcfphiskvbdel.supabase.co/storage/v1/object/public/Images/SUB.jpghttps://weaisrpqcfphiskvbdel.supabase.co/storage/v1/object/public/Images/SUB.jpg"
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
      lat: 7.522047983886849,
      lng: 4.515844175862876,
      imageUrl: "https://lh3.googleusercontent.com/gps-cs-s/APNQkAHQJuTXhwdwFhl7FuTCPDC0XPptTOiJatFfhdbn9zeixXzJZHF3LZBWpsHpzdHuoUxbPZXetSMstbKRbNyJhMx1IYO76RxiZNAzfdH4dPkMRA9mR6Wx7O0t-0UmyqaSpoKix5Hr=s773-k-no"
    },
    {
      id: "pharmacy",
      name: "Faculty of Pharmacy",
      aliases: ["pharmacy", "pharm", "pharma", "health sciences", "drug research"],
      type: "academic",
      description: "The Faculty of Pharmacy at OAU is a premier center for pharmaceutical education and research in Nigeria, known for its rigorous academic standards.",
      lat: 7.5174,
      lng: 4.5269,
      imageUrl: "https://weaisrpqcfphiskvbdel.supabase.co/storage/v1/object/public/Images/Pharmacy.jpg"
    },
    {
      id: "motion_ground",
      name: "Motion Ground",
      aliases: ["motion", "motion ground", "car park", "gathering spot"],
      type: "facility",
      description: "A prominent open space and transit hub near the academic core, often used as a landmark for navigation and student gatherings.",
      lat: 7.5183,
      lng: 4.5228,
      imageUrl: "https://lh3.googleusercontent.com/gps-cs-s/APNQkAEp1Amj7X-66wKyw2a9_Kc6MFMt_LzFVwgLJFhY12y0TlKZLLsQN37P_CqrU_OwJXBLztTu0EDN_fuwxMI9Sm5Zy6lKKqPV9Okl4LxC85R0M6tTSFz1coTPTCjB55J7ge_WXqbJ=s720-k-no"
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
      imageUrl: "https://weaisrpqcfphiskvbdel.supabase.co/storage/v1/object/public/Images/ACE.jpg"
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
    {
      id: "oak_park_conference_hall",
      name: "OAK Park Conference Hall",
      aliases: ["oak park conference hall", "oak park"],
      type: "landmark",
      description: "OAK Park Conference Hall is a recognized landmark location.",
      lat: 7.5182477,
      lng: 4.530310399999999,
      imageUrl: "https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=Ab43m-thTGeEeJwpOG-xQEIoAsCMRrsnR5X9ACm8QgbkJOuSaEEsuZutYX2yNQlpStaZVJjbcfWnjoVcgIV0MI0-wXkCeAlfy2yYcpolnoNseCLAiEI2Fh2EUtgMiZdXBm8BFjm-4sudGy8RDvIMEF1EOhREcghwEVGQzGc7UVpVJWsP1HpEeG_jxbwouV5I8Bga5gQUYasIiO487yvjzI_MEopE7E4fz33Vi3_2STkA2rqEMkS-XCO6DS55OTP-SCMfzMkR__MdPcPX0qdyBK0E0tNgV1oG5pZcFBZ8JVnPLJFAGZBJ7fJMpJqPiFgvn8QK6RjzcMXaC9OFsW-Mx1kDz8751K7ZU_VUMuMQ-xxehTIJFa7fffOO_TTN3lYI50S5w4IfNfRLZ9Jgc78q3QxkDA_YXoqeAFq9KHZfE7pIbjyDIm_HaQnAHhgK1by7OQ&key=AIzaSyDG0AdI940o9g9lAqthZtWGR45kMfZPFoc"
    },
    {
      id: "oduduwa_hall",
      name: "Oduduwa Hall",
      aliases: ["oduduwa hall", "oduduwa"],
      type: "landmark",
      description: "Oduduwa Hall is a recognized landmark location.",
      lat: 7.5187366,
      lng: 4.5220392,
      imageUrl: "https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=Ab43m-u_iVrEdlZLppVgAml-y-NYNg2WvWY3S3qSA7FGuIARetH-tkF0RtJyR-g9DFrnu_BXtoJSuLYT3o0zNHYiRrsaY5uHL8Wyl2kfbYeGY0LYtk6rZ5xrXn1l0t9yUlbt9Z54sRfp6VWKWGnMmFB_QagFnnwWtkf_ZIwL21cGZuHBVM-zjvoquTwb3uXJbXqegx3eMZfQMvJbo9MDQSflBT-wDdoGdbgUPNwFm-7q5VNE0LD59HvvHEtiuiBAgpKhsNbhMqb78P7fslW3gWXakLbxkii2lm9C70KtU32YBSPExd7mZQhbgxByyQ39kTFIoFoB5GYlO8nKQ89eJHMOqtBPOaVgIErjRRo84Iyt9sKbXGad89PnXg7h9jACbYMHzke--na4I9mydvoOnycQkcY7VXDTxpi5q4H_fVnSOV-1Pg&key=AIzaSyDG0AdI940o9g9lAqthZtWGR45kMfZPFoc"
    },
    {
      id: "pit_theatre",
      name: "Pit Theatre",
      aliases: ["pit theatre"],
      type: "landmark",
      description: "Pit Theatre is a recognized landmark location.",
      lat: 7.521662699999999,
      lng: 4.521122699999999,
      imageUrl: "https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=Ab43m-vwMsajx-sxcuFUCtqIa0brhkY9F2zoQIxrZlOUrSvk3g8d5SYgeuw0nJWVK34K231PObPFqsgEt3UpVxElu9hzmDPszaWDhq2hfAqlSipB8jUrTqaY-xPCyQZ3JINcI_uEatjf3S_rGWtAyccU0N5KjP1Q0RHTrS9XzFjZsqZ2rsXlbj2iVtWbeTTjR6xPXOOLdUMXtZrTsFTGgO4SxtLdv5QpUsvP1ao5_Qx6UB4oOvGeNSJho0Kpp9kLKjuA6B1ZdWrQ4Krd2SiNicQx-xnChpPJh38aZnLpSsaeINcqwRT7UHv_jd5d6Gr4-65xDaJWo_71pYoikIiNjO87rK66vuk5ISl5e25YjHFtlF-wYzOjCuumY2uX7e8RrD8vo2hlhjzq7CouwubzjFxQj3R30YJHCExeZxs-NDmjkIZ6Ww&key=AIzaSyDG0AdI940o9g9lAqthZtWGR45kMfZPFoc"
    },
    {
      id: "admin_extention",
      name: "Admin Extention",
      aliases: ["admin extention", "admin extension"],
      type: "landmark",
      description: "Admin Extention is a recognized landmark location.",
      lat: 7.521569999999999,
      lng: 4.5196114,
      imageUrl: "https://lh3.googleusercontent.com/gps-cs-s/APNQkAFrclkYYx600ui_OupVQFNuTZh96Dxd1cL0kAJdSxnerGW5O8RtiCrFtz6eg68Znn697-EUgBkiSFOWgc4BfrmMessS-fIBxFLbxOK7hgHj10zm3bJm0ioF-rYeB8hUNnT8-zby=s901-k-no"
    },
    {
      id: "adekunle_fajuyi_hall_obafemi_awolowo_university",
      name: "Adekunle Fajuyi Hall, Obafemi Awolowo University",
      aliases: ["adekunle fajuyi hall", "fajuyi hall", "faj"],
      type: "residential",
      description: "Adekunle Fajuyi Hall, Obafemi Awolowo University is a recognized landmark location.",
      lat: 7.517677,
      lng: 4.5176115,
      imageUrl: "https://lh3.googleusercontent.com/gps-cs-s/APNQkAF4hU7A_zQaULI1OVubUZydJvVWiR5NDLL4wCVReGyZk3xFWVtrosYh_UdaA1HiNHQGM7wmLraE3Z0HidOx65-r5thWdkhXo4dLYdy-ncQbFOEB8ZjC0szDgGR3Y3Q6buv1x6d-=s773-k-no"
    },
    {
      id: "akintola_hostel",
      name: "Akintola Hostel",
      aliases: ["akintola hostel", "akintola hall", "akintola"],
      type: "residential",
      description: "Akintola Hostel is a female hostel beside the sports complex.",
      lat: 7.5170083,
      lng: 4.5198364,
      imageUrl: "https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=Ab43m-t4g_1yHyyhEdD9sDdinUsZDCfCoU2LGRvNLw8SOpHsRU7p5qPge4yMLLqzkJMI-8Vf5YRJKZ8kk2V9l0vffJeLs8_p3RgD-Ns7Dy2APNYocoeB4QijfvXj8z0jQkL-dZ4vNQDAoHrJ-c4AWX_ALJGDSRPu7fF4dSZLAR01BD0qPNfaPtLj1raoJRMh_-Qz5OpNDE_FUxdTnTNGLtq9YcPGAOvpu1LBc6kGmSVwVGTg2RM2Y2-R5Xw-UuP8YklOE-yB8GD2YHzbNeaAgs7BePdNzHQWysA1bczrJjeriYpW77KUqsgmdiaamsMR18ezsJf1UAvjQoRQ7GgVKzK9NsXu_sJIOeSNDGNk57gn6Bq3M3MvRsj6EPMt8GZ5m54gCdlO0Cizbvy1LzEfgOAswmv7WFxsTQTKVHRa1iLijIJ6QM75&key=AIzaSyDG0AdI940o9g9lAqthZtWGR45kMfZPFoc"
    },
    {
      id: "awovarsity_hall",
      name: "Awovarsity Hall",
      aliases: ["awovarsity hall", "awovarsity"],
      type: "landmark",
      description: "Awovarsity Hall is a recognized landmark location.",
      lat: 7.513338899999999,
      lng: 4.524348799999999,
      imageUrl: "https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=Ab43m-u_kf6n2WPDiQKVCsHfm3kVJyypKGWIgMtGwVhcUzhznWlqS6kTg-0cupy8MurvF0jWi9osYmeybXiRzTrDgzr7w6wwZ4uBNOr0lZm5xcNysAg7mOhXBSqJq0-WobTwgafRWwTlVCVrOIDdMZm2bUdFaZTiPUaK9Wu26Whus_7vWsq-3tiUfIpQZwOsaUcUfHw2vyZfw-dZXGc-c5ge5k4LRMYl1cce5h89TIuAG2yKkdsM6nWexsVbVKQCxQ_a35Zb-6tAy-JkNAtUlmEA9l9gaGGxh8KJe3yGYSNROrj-QjZK-0Y4RudhZyKiWzHnRiM2r5ffJLffGG8LexbYvbsM55dARTHAFQw6S1EMsexSRhmxSDSL4dAEy_Gfmnp1JMbSoCAcxT421ttSeS-kEJY3_lEh65KH0aQbxOVT7EHBpPCF&key=AIzaSyDG0AdI940o9g9lAqthZtWGR45kMfZPFoc"
    },
    {
      id: "cooperative_hall",
      name: "Cooperative Hall",
      aliases: ["cooperative hall"],
      type: "landmark",
      description: "Cooperative Hall is a recognized landmark location.",
      lat: 6.5016659,
      lng: 3.3293769
    },
    {
      id: "alex_duduyemi_lecture_theater",
      name: "Alex Duduyemi Lecture Theater",
      aliases: ["alex duduyemi lecture theater"],
      type: "landmark",
      description: "Alex Duduyemi Lecture Theater is a recognized landmark location.",
      lat: 7.5238741,
      lng: 4.5262451,
      imageUrl: "https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=Ab43m-tAu77wBywy8jhdaPSXIFHWFJSzO0mzhUAZCiB1G3AOEJUG9cmVbKFrEe9rf_79qYEiv-30HTBi-T6Re5W9Ru1KMveuLo0yd4cclEaFjApEwdY9x-y6aQN5Niev96SCPVAw_lyiKbnDPYIEHoPAlqI6-AC2PslgWt4Til7cC34QfXiSUISRoCo4YN7aR14DLDWkSdYxGbGpKSd-v51kdkp1xmvNcBr3vopbOkcdwGiFMrOooNyB2farGTUWOWSv7xlLawLXbLtBqiRbwB1lUBdE4wN9VwjJ9LEr_ugLRwuwoc-N6IgAJlMEr1skisXTeRdqMPKuQdm-zuYShrjSLLQZB185j-UaXLU9JZKUW4SNiSEQC1Z5vzd73dweb3eElwZtvoOafAcI4dTDX_kRcrLTjnF0XFO7Qdd4rQevCnpKvX1C&key=AIzaSyDG0AdI940o9g9lAqthZtWGR45kMfZPFoc"
    },
    {
      id: "ajose_lecture_theatre",
      name: "Ajose Lecture Theatre",
      aliases: ["ajose lecture theatre", "ajose"],
      type: "landmark",
      description: "Ajose Lecture Theatre is a recognized landmark location.",
      lat: 7.5213991,
      lng: 4.5265529,
      imageUrl: "https://lh3.googleusercontent.com/gps-cs-s/APNQkAF1OVeloEihygOQ9vsfQel6zkTcoWb_sTJUC0GrETNDq72GJjlTnYYUdjuSH9gx6hD85xvzzA5BHYI7gccKu5M32a8gXqm-QwVhtnwU5Zfs8XOqFNnp4RhxBnV6Ld7qDRN61xvx=s1031-k-no"
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
      imageUrl: "https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=Ab43m-uGKqZdZX5p6_UN-_EYlMkRKQ7N3ypUF2_TUInNFT7AcV9m_9wg0-bCpR962tUMziEr3hHJHaBL2E7hjll1W9t2HmDuOwbc4PhJy9FnKuBo5hwCwCh0N0Vgs5pbN1xrsPQ-zZ-zLyCrjZWZyn9Al7J4BiyyqU6A2hhgnGdkjfrtF8z0Io0XWqP6hPIYRwGmMYnYJsIBcpXOTEueXJtwYsW9M6dRnXG8BKcidynysiuXCrAPWeKJM-J1ZgIvJvylE6vPBx6_foZ8LS00pSSR5fJMC8RVfGW1W7bN_AdpV-N45Oo6RhyuZqHRswvv0Rl_uoE_Koch9uppYAuRH7Ll_VdrphP9NG9eigg2CMESBfk8Pu6Z2I1d3cFB5rxhFgTde0ooAqdENhRIQeS4kZADayWBR_c38cqum5qDF_vvuLSccFwjNziIsA&key=AIzaSyDG0AdI940o9g9lAqthZtWGR45kMfZPFoc"
    },
    {
      id: "mozambique_hall_obafemi_awolowo_university",
      name: "Mozambique Hall, Obafemi Awolowo University",
      aliases: ["mozambique hall", "moz", "mozambique"],
      type: "residential",
      description: "Mozambique Hall, Obafemi Awolowo University is a recognized landmark location.",
      lat: 7.522280599999999,
      lng: 4.514088999999999,
      imageUrl: "https://lh3.googleusercontent.com/gps-cs-s/APNQkAGYC41B4eljZ9IRQ6YqK9JsqWkk7yD44HiP7I-NE6OVvebLKw2aYM0PilOebnbBS-M7PnJOt-TB1u5x_qWAy_16s00LpOyWfVJWab5Hvt6_H7IEjuYTxttyL0OecAvjriAbj3Javv_sk9w=s773-k-no"
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
      imageUrl: "https://lh3.googleusercontent.com/gps-cs-s/APNQkAFihF-Te9GIMn3lGoJGxZYCrTcxTqBev-7yx4mRCA1KDwtrIeUUY0DGzMlgYIaOcSRMbXHKCg9En2g9yplbKDPebi8AUpJC9GgPk8hXrnIrfibufWOOATTqPAyewqxuUNeOg29t=s901-k-no"
    },
    {
      id: "new_senate_building",
      name: "New Senate Building",
      aliases: ["new senate building", "new senate", "Senate building"],
      type: "landmark",
      description: "New Senate Building is a recognized landmark location.",
      lat: 7.518702892841351,
      lng: 4.524234160623102,
      imageUrl: "https://lh3.googleusercontent.com/gps-cs-s/APNQkAFtlU0qPgC7aj1HSg_6TUWb6zXGoFi3rAAsJg9FDJdf5UQiRpVf0w62UBJQql7WkpJrFYCXDuC7dfKYJK4qthICCVbXfGpixRuMyHXUH4zqgOuN6RGfXjL0wOIGdo0sQvKRM2rq-w=s812-k-no"
    },
    {
      id: "biological_science_area_faculty_of_sciences_obafemi_awolowo_university",
      name: "Biological Science Area, Faculty of Sciences",
      aliases: ["biological science area", "biological sciences"],
      type: "academic",
      description: "Biological Science Area, Faculty of Sciences, Obafemi Awolowo University is an academic facility within the university environment.",
      lat: 7.518968399999999,
      lng: 4.525836099999999,
      imageUrl: "https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=Ab43m-vXFzSyIER2nz60tzi6Kjn0otq2tkTY_4VATaDesOgEC7pFaDKcWqYpy5iS-SlAUDhcPFutwFVceBjY2r-88Ciddd7hQK3qEB0rNG4_M4biKn4Z4XBM7PX8NnPoutin2T3xL-aKfJCB2L5PW9yd65jRLMLb7QVtssbhh39q-EG3NTTJpFwqLVNPwCrz9i25bQrEAmEZoK7ymkYmlFxb6-OFQl0CYJ3wgG4--6Wy2Ceem96DbLFV4bOj3A-aTyMdyD6vU0yOIWgVMq7DsXmPzF-jugW5KuamggKjdsmhF4vnlyix5eXqUPKVuHh4z2gDCZZ0EHxRvUq83u8p4f5iL4cEi11peT1fJOhKfOJowt4hMz0ZfZMe7uIThsTionBcZfJbPAhvNomGjU7uGlTjpXhGNdzQs0nNRMT5nB3_k67u5Q&key=AIzaSyDG0AdI940o9g9lAqthZtWGR45kMfZPFoc"
    },
    {
      id: "faculty_of_social_sciences_obafemi_awolowo_university",
      name: "Faculty of Social Sciences, Obafemi Awolowo University",
      aliases: ["faculty of social sciences", "social sciences"],
      type: "academic",
      description: "Faculty of Social Sciences, Obafemi Awolowo University is an academic facility within the university environment.",
      lat: 7.521239899999999,
      lng: 4.5225092,
      imageUrl: "https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=Ab43m-swvRTmS--7nEAMe5ghB6MpBObomutWpFhih1UT63sX7VyiqQWunHCSis08WpPy5G6rDImVydaKLbVnbJKva31br4Kxs1BCKCaFLC7ty5MfcV2t7mMdYWXe66ROi8T7JX8YsN4NcwCDo2Q5Q_DfkfReAVXLLEKVjS8filxoXQuxJ5r9StNCmyNAeEUGb63r3rAhrs2sY9tQhOxsm51fahwkHW8lmv8DJpt5dRaGKdKAMVnx-WdFu9IHaNlc1tOf4zpaB5u0grc3m0vBgoi7JS9vn-eEHFejTpJ0FOeoJnwfFg&key=AIzaSyDG0AdI940o9g9lAqthZtWGR45kMfZPFoc"
    }
  ],

  // routes: [
  //   {
  //     id: "r1",
  //     fromId: "new_senate_building",
  //     toId: "sub",
  //     distance: "600m",
  //     timeWalking: "8 mins",
  //     shuttleAvailable: true,
  //     shuttleFare: "₦50",
  //     description: "Walk down Road 1, past the Motion Ground turnoff. The SUB is on your right."
  //   },
  //   {
  //     id: "r2",
  //     fromId: "moremi",
  //     toId: "spider_building",
  //     distance: "1.2km",
  //     timeWalking: "15 mins",
  //     shuttleAvailable: true,
  //     shuttleFare: "₦50",
  //     description: "Take a shuttle from Moremi gate to the Science/Tech park."
  //   },
  //   {
  //     id: "r3",
  //     fromId: "sub",
  //     toId: "amphi",
  //     distance: "300m",
  //     timeWalking: "4 mins",
  //     shuttleAvailable: false,
  //     description: "A short walk past the SUB towards Oduduwa Hall."
  //   }
  // ],

  routes: [],
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
