/** Everything the homepage says, in one place. Facts come from chunkymonkey.com.pk. */

const ORIGIN = "https://chunkymonkey.com.pk";

export const site = {
  name: "Chunky Monkey",
  tagline: "Fun For All",
  url: ORIGIN,
  hours: { days: "Monday – Sunday", time: "4 PM – 12 AM" },
  phone: { label: "+92-21-35899583-4", href: "tel:+922135899583" },
  email: "info@chunkymonkey.com.pk",
  marketingEmail: "marketing@chunkymonkey.com.pk",
  whatsapp: "https://wa.me/923377248659",
  address: "Adjacent Nisar Shaheed Park, DHA Phase IV, Karachi",
  directions: "https://www.google.com/maps/search/?api=1&query=Chunky+Monkey+DHA+Phase+4+Karachi",
  social: {
    Facebook: "https://www.facebook.com/chunkymonkeypark",
    Instagram: "https://www.instagram.com/Chunkymonkey_CM",
  },
  links: {
    about: `${ORIGIN}/about-us/`,
    rides: `${ORIGIN}/park-rides/`,
    attractions: `${ORIGIN}/attractions/`,
    booking: `${ORIGIN}/book-event/`,
    gallery: `${ORIGIN}/media-gallery/`,
    contact: `${ORIGIN}/contact-us/`,
  },
};

export const nav = [
  { label: "Rides", href: "#rides" },
  { label: "Parks", href: "#parks" },
  { label: "Parties", href: "#parties" },
  { label: "Visit", href: "#visit" },
];

export const rides = [
  { name: "Merry Go Round", line: "The classic. Music, lights, and round we go.", image: "/media/rides/merry-go-round.jpg" },
  { name: "Time Travel", line: "Strap in. Next stop: who knows when.", image: "/media/rides/time-travel.jpg" },
  { name: "Speedy Car", line: "Little drivers. Big speed.", image: "/media/rides/speedy-car.jpg" },
  { name: "Flying Chair", line: "Swing out wide and fly over the park.", image: "/media/rides/flying-chair.jpg" },
  { name: "Pirate Party", line: "All aboard for a swashbuckling swing.", image: "/media/rides/pirate-party.jpg" },
  { name: "Bumping Car", line: "Steer. Bump. Laugh. Repeat.", image: "/media/rides/dodgeen-car.jpg" },
  { name: "Flash Tower", line: "Up high. Hold on. Here it comes.", image: "/media/rides/flash-tower.jpg" },
  { name: "Flying Carpet", line: "Lift-off, whoosh, and back again.", image: "/media/rides/flying-carpet.jpg" },
];

export const parks = [
  { city: "Karachi", name: "DHA Phase IV", note: "Adjacent Nisar Shaheed Park", flagship: true },
  { city: "Karachi", name: "Sea View", note: "By the sea, under the lights" },
  { city: "Hyderabad", name: "Hyderabad", note: "Fun for all, up the road" },
];

export const facilities = [
  { name: "Dedicated parking", icon: "parking" },
  { name: "Lost & found", icon: "search" },
  { name: "First aid", icon: "aid" },
  { name: "Security", icon: "shield" },
  { name: "Separate toilets", icon: "wc" },
  { name: "Separate prayer rooms", icon: "prayer" },
] as const;

export const stats = [
  { value: 3, suffix: "", label: "Parks" },
  { value: 8, suffix: "+", label: "Rides" },
  { value: 8, suffix: "", label: "Hours of fun, nightly" },
  { value: 7, suffix: "", label: "Days a week" },
];
