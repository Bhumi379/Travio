/** Default Information / About page payload (seed + migration fallback). */
module.exports = {
  pageTitle: 'Campus Commute',
  pageSubtitle:
    'Official Schedules for Roadways, Metro, and Auto Services.',
  busSchedules: [
    {
      title: 'Banasthali → Jaipur',
      tag: 'Morning',
      times: [
        { time: '5:15 AM', status: 'Daily' },
        { time: '6:00 AM', status: 'Daily' },
        { time: '7:00 AM', status: 'Daily' },
      ],
    },
    {
      title: 'Jaipur → Banasthali',
      tag: 'Evening',
      times: [
        { time: '4:15 PM', status: 'Daily' },
        { time: '5:00 PM', status: 'Daily' },
        { time: '6:00 PM', status: 'Daily' },
      ],
    },
  ],
  niwaiSlots: [
    { label: 'Morning', time: '6:15 AM' },
    { label: 'Morning', time: '9:30 AM' },
    { label: 'Afternoon', time: '2:30 PM' },
    { label: 'Evening', time: '5:15 PM' },
  ],
  metroDidi: [
    {
      name: 'Sarita Didi',
      route: 'Gate to Market',
      phone: '+91 98765 43210',
      letter: 'S',
    },
    {
      name: 'Rekha Didi',
      route: 'Hostel to Dept',
      phone: '+91 98765 43210',
      letter: 'R',
    },
    {
      name: 'Meena Didi',
      route: 'General Loop',
      phone: '+91 98765 43210',
      letter: 'M',
    },
  ],
  trustedDrivers: [
    {
      name: 'Verified Driver',
      description: 'Campus shuttle routes',
      letter: 'V',
      phone: '',
    },
    {
      name: 'Verified Driver',
      description: 'Airport / long-route support',
      letter: 'R',
      phone: '',
    },
    {
      name: 'Verified Driver',
      description: 'Evening pickups',
      letter: 'M',
      phone: '',
    },
  ],
};
