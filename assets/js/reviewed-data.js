(function () {
  const checkedDate = '2026-06-14';

  window.RIS_REVIEWED_DATA = {
    sources: [
      {
        label: 'Official RIS program page',
        url: 'https://constructorcampus.org/programs/undergraduate-education/robotics-intelligent-systems',
        checkedDate
      },
      {
        label: 'RIS handbook',
        url: 'https://constructor.university/sites/default/files/2026-02/RIS_Handbook_2025_v1_2_0.pdf',
        checkedDate
      },
      {
        label: 'Prof. Dr. Francesco Maurelli profile',
        url: 'https://constructor.university/faculty-member/prof-dr-francesco-maurelli',
        checkedDate
      },
      {
        label: 'Marine Systems and Robotics group',
        url: 'https://constructor.university/research/school-computer-science-engineering/marine-systems-and-robotics',
        checkedDate
      },
      {
        label: 'Constructor Robotics publications',
        url: 'https://robotics.constructor.university/publications/',
        checkedDate
      },
      {
        label: 'Constructor Robotics research domains',
        url: 'https://robotics.constructor.university/research/',
        checkedDate
      },
      {
        label: 'Constructor Robotics funded projects',
        url: 'https://robotics.constructor.university/projects/',
        checkedDate
      },
      {
        label: 'Michigan Robotics new student page',
        url: 'https://robotics.umich.edu/academics/graduate/new-graduate-students/',
        checkedDate
      },
      {
        label: 'CNDS Constructor University',
        url: 'https://cnds.constructor.university/',
        checkedDate
      }
    ],
    people: [
      {
        id: 'francesco-maurelli',
        name: 'Prof. Dr. Francesco Maurelli',
        role: 'Associate Professor of Marine Systems with a focus on Marine Robotics',
        programRole: 'Study Program Chair, Robotics and Intelligent Systems',
        affiliation: 'School of Computer Science & Engineering, Constructor University',
        summary: 'Maurelli leads the Marine Systems and Robotics group. His work connects autonomous marine robots with localisation, perception, data fusion, fault management, and field operation.',
        tags: ['Marine robotics', 'AUV navigation', 'Data fusion', 'Perception'],
        officialUrl: 'https://constructor.university/faculty-member/prof-dr-francesco-maurelli',
        groupUrl: 'https://constructor.university/research/school-computer-science-engineering/marine-systems-and-robotics',
        sourceUrl: 'https://constructor.university/faculty-member/prof-dr-francesco-maurelli',
        checkedDate
      },
      {
        id: 'jakob-suchan',
        name: 'Prof. Dr. Jakob Suchan',
        role: 'Assistant Professor of Computer Science',
        programRole: 'Study Program Chair, Robotics and Intelligent Systems',
        affiliation: 'School of Computer Science & Engineering, Constructor University',
        summary: 'Suchan is listed with Maurelli as a study program chair on the official RIS program page. His faculty profile describes work at the intersection of AI, computer vision, and human-centred computing.',
        tags: ['Program chair', 'AI', 'Computer vision', 'Human-centred systems'],
        officialUrl: 'https://constructor.university/faculty-member/jakob-suchan',
        sourceUrl: 'https://constructorcampus.org/programs/undergraduate-education/robotics-intelligent-systems',
        checkedDate
      },
      {
        id: 'qais-mohammed-kamel-al-ramahi',
        name: 'Al-Ramahi, Qais Mohammed Kamel'
      },
      {
        id: 'tim-william-bense',
        name: 'Bense, Tim William'
      }
    ],
    groups: [
      {
        slug: 'marine-systems-and-robotics',
        name: 'Marine Systems and Robotics',
        leader: 'Prof. Dr. Francesco Maurelli',
        summary: 'The group develops intelligent capabilities for autonomous platforms, with emphasis on positioning and navigation, filtering and data fusion, fault management, perception, and autonomy across domains from underwater to space.',
        themes: [
          'Autonomous underwater and surface platforms',
          'Positioning, navigation, and AUV localisation',
          'Advanced filtering and data fusion',
          'Fault management for autonomous systems',
          'Perception with inertial, acoustic, video, and LiDAR sensing'
        ],
        officialUrl: 'https://constructor.university/research/school-computer-science-engineering/marine-systems-and-robotics',
        checkedDate
      }
    ],
    publications: [
      {
        title: 'AUV localisation: a review of passive and active techniques',
        authors: 'F. Maurelli, S. Krupinski, X. Xiang, Y. Petillot',
        year: '2021',
        venue: 'International Journal of Intelligent Robotics and Applications',
        tags: ['marine', 'autonomy'],
        sourceUrl: 'https://constructor.university/faculty-member/prof-dr-francesco-maurelli',
        doiUrl: 'https://doi.org/10.1007/s41315-021-00215-x',
        checkedDate
      },
      {
        title: 'Robotics and Intelligent Systems: a new curriculum development and adaptations needed in Coronavirus times',
        authors: 'F. Maurelli, E. Dineva, A. Nabor, A. Birk',
        year: '2021',
        venue: 'Robotics in Education (RiE), Advances in Intelligent Systems and Computing',
        tags: ['education'],
        sourceUrl: 'https://robotics.constructor.university/publications/',
        doiUrl: 'https://doi.org/10.1007/978-3-030-82544-7_9',
        checkedDate
      },
      {
        title: 'A Robotics Course during COVID-19: Lessons Learned and Best Practices for Online Teaching beyond the Pandemic',
        authors: 'A. Birk, E. Dineva, F. Maurelli, A. Nabor',
        year: '2021',
        venue: 'Robotics',
        tags: ['education'],
        sourceUrl: 'https://robotics.constructor.university/publications/',
        doiUrl: 'https://doi.org/10.3390/robotics10010005',
        checkedDate
      },
      {
        title: 'Persistent autonomy: the challenges of the PANDORA project',
        authors: 'D. M. Lane, F. Maurelli, P. Kormushev, M. Carreras, M. Fox, K. Kyriakopoulos',
        year: '2012',
        venue: 'IFAC Proceedings Volumes',
        tags: ['marine', 'autonomy'],
        sourceUrl: 'https://constructor.university/faculty-member/prof-dr-francesco-maurelli',
        doiUrl: 'https://doi.org/10.3182/20120919-3-IT-2046.00046',
        checkedDate
      },
      {
        title: 'The PANDORA project: A success story in AUV autonomy',
        authors: 'F. Maurelli, M. Carreras, J. Salvi, D. Lane, K. Kyriakopoulos, G. Karras, M. Fox, et al.',
        year: '2016',
        venue: 'OCEANS 2016 - Shanghai',
        tags: ['marine', 'autonomy'],
        sourceUrl: 'https://constructor.university/faculty-member/prof-dr-francesco-maurelli',
        scholarUrl: 'https://scholar.google.com/scholar?q=The+PANDORA+project+A+success+story+in+AUV+autonomy+Maurelli',
        checkedDate
      },
      {
        title: 'EKF-SLAM for AUV navigation under probabilistic sonar scan-matching',
        authors: 'A. Mallios, P. Ridao, D. Ribas, F. Maurelli, Y. Petillot',
        year: '2010',
        venue: 'IEEE/RSJ International Conference on Intelligent Robots and Systems',
        tags: ['marine', 'slam'],
        sourceUrl: 'https://constructor.university/faculty-member/prof-dr-francesco-maurelli',
        scholarUrl: 'https://scholar.google.com/scholar?q=EKF-SLAM+for+AUV+navigation+under+probabilistic+sonar+scan-matching',
        checkedDate
      },
      {
        title: 'A particle filter approach for AUV localization',
        authors: 'F. Maurelli, S. Krupinski, Y. Petillot, J. Salvi',
        year: '2008',
        venue: 'OCEANS 2008',
        tags: ['marine'],
        sourceUrl: 'https://constructor.university/faculty-member/prof-dr-francesco-maurelli',
        scholarUrl: 'https://scholar.google.com/scholar?q=A+particle+filter+approach+for+AUV+localization+Maurelli',
        checkedDate
      },
      {
        title: 'A 3D laser scanner system for autonomous vehicle navigation',
        authors: 'F. Maurelli, D. Droeschel, T. Wisspeintner, S. May, H. Surmann',
        year: '2009',
        venue: 'International Conference on Advanced Robotics',
        tags: ['perception'],
        sourceUrl: 'https://constructor.university/faculty-member/prof-dr-francesco-maurelli',
        scholarUrl: 'https://scholar.google.com/scholar?q=A+3D+laser+scanner+system+for+autonomous+vehicle+navigation+Maurelli',
        checkedDate
      },
      {
        title: 'Pose-based SLAM with probabilistic scan matching algorithm using a mechanical scanned imaging sonar',
        authors: 'A. Mallios, P. Ridao, E. Hernandez, D. Ribas, F. Maurelli, Y. Petillot',
        year: '2009',
        venue: 'OCEANS 2009 - Europe',
        tags: ['marine', 'slam'],
        sourceUrl: 'https://constructor.university/faculty-member/prof-dr-francesco-maurelli',
        scholarUrl: 'https://scholar.google.com/scholar?q=Pose-based+SLAM+with+probabilistic+scan+matching+algorithm+using+a+mechanical+scanned+imaging+sonar',
        checkedDate
      },
      {
        title: 'Blue sky ideas in artificial intelligence education from the EAAI 2017 new and future AI educator program',
        authors: 'E. Eaton, S. Koenig, C. Schulz, F. Maurelli, J. Lee, J. Eckroth, M. Crowley, et al.',
        year: '2017',
        venue: 'AI Matters',
        tags: ['education'],
        sourceUrl: 'https://constructor.university/faculty-member/prof-dr-francesco-maurelli',
        scholarUrl: 'https://scholar.google.com/scholar?q=Blue+sky+ideas+in+artificial+intelligence+education+Maurelli',
        checkedDate
      }
    ]
  };
})();
