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
  { label: "Home", href: "#top" },
  { label: "About Us", href: "#about" },
  { label: "Rides", href: "#rides" },
  { label: "Attractions", href: "#attractions" },
  { label: "Media Gallery", href: "#gallery" },
  { label: "Contact Us", href: "#contact" },
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
  {
    area: "Karachi",
    name: "DHA Phase IV",
    note: "Adjacent Nisar Shaheed Park",
    directions: "https://www.google.com/maps/search/?api=1&query=Chunky+Monkey+DHA+Phase+4+Karachi",
  },
  {
    area: "At the mall",
    name: "Saima Jinnah Icon Mall",
    note: "Come and find us at the mall.",
    directions: "https://www.google.com/maps/search/?api=1&query=Saima+Jinnah+Icon+Mall",
  },
];

export const attractions = [
  { name: "Indoor Rides", line: "Games and rides for children from 1 to 5, with comfortable seats for the parents watching.", image: "/media/photos/indoor.jpg" },
  { name: "Outdoor Rides", line: "Take in the sights or get your adrenaline pumping. There's a ride here for every age.", image: "/media/photos/outdoor.jpg" },
  { name: "Food & Drink", line: "Fast food, desi cuisine, snacks and drinks, in a separate cafeteria.", image: "/media/photos/food.jpg" },
  { name: "Events & Parties", line: "Music, catering, decorations and a team that shapes it all around your birthday or corporate event.", image: "/media/photos/event.jpg" },
];

/** two rows of photos for the gallery */
export const gallery = [
  ["flying-chair-night", "bumper-cars", "frisbee-night", "clown", "octopus", "gyro-night", "family-coaster"],
  ["dodgem-night", "kid-rides", "flash-tower", "monkey-board-2", "action-arm", "stilts", "caterpillar"],
].map(row => row.map(name => `/media/photos/${name}.jpg`));

export const facilities = [
  { name: "Dedicated parking", icon: "parking" },
  { name: "Lost & found", icon: "search" },
  { name: "First aid", icon: "aid" },
  { name: "Security", icon: "shield" },
  { name: "Separate toilets", icon: "wc" },
  { name: "Separate prayer rooms", icon: "prayer" },
] as const;

export const stats = [
  { value: 2, suffix: "", label: "Branches" },
  { value: 30, suffix: "+", label: "Rides" },
  { value: 100, suffix: "+", label: "Arcade machines" },
  { value: 30, suffix: "", label: "Years in business" },
];
