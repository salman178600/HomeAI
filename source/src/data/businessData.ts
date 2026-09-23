import { BusinessProfile } from '../types.js';

export const defaultBusinessProfile: BusinessProfile = {
  name: "All-in-One Home Services",
  services: "Plumber (Water tap/pipe repair, leakages, sanitary fittings), Electrician (Wiring, Switch/Socket repair, Fan installation/repair, Light installation/repair, Chandelier fitting/repair), Painter (Interior/exterior painting, touch-ups, waterproofing), Carpenter (Furniture repair/installation, Door/Lock repair), AC installation/repair/servicing, Appliance installation/repair, and other home maintenance services.",
  prices: "",
  timings: "Service visit timings depend on technician availability and customer requirements. Our team will confirm the visit timing directly with the customer.",
  location: "",
  contactDetails: "",
  tagline: "All-in-One Home Services Lead Collector",
  description: "AI-powered all-in-one home services lead collector for plumbing, electrical, carpentry, painting, AC services, and home maintenance. Understands customer requirements in English and Hinglish, collects Name, Phone Number, and Work Requirement. Service visit timings depend on technician availability and customer requirements, and the team confirms the visit timing with the customer.",
  bookingSystemStatus: "No automated booking system is connected. Service visit timings depend on technician availability and customer requirements, and our team confirms the visit timing with the customer (recorded as 'Pending Confirmation').",
  appointmentPolicy: {
    bookingSystemConnected: false,
    bookingSystemStatus: "Service visit timings depend on technician availability and customer requirements. Visit requests are recorded as 'Pending Confirmation', and our team will confirm the exact visit timing directly with the customer.",
    notice: "No automatic booking. Service visit timings depend on technician availability and customer requirements; our team verifies schedules and confirms visit timings directly with the customer.",
  },
};

