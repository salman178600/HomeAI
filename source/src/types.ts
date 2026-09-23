export interface BusinessProfile {
  name: string;
  services: string;
  prices: string;
  timings: string;
  location: string;
  contactDetails: string;
  tagline?: string;
  description?: string;
  bookingSystemStatus: string;
  appointmentPolicy: {
    bookingSystemConnected: boolean;
    bookingSystemStatus: string;
    notice: string;
  };
}

export interface CustomerLead {
  id: string;
  name?: string;
  phone?: string;
  requirement?: string;
  serviceCategory?: string;
  preferredTime?: string;
  status: 'new' | 'contacted' | 'booked' | 'completed';
  capturedAt: string;
  source: 'chat';
  lastMessage?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  text: string;
  timestamp: string;
  leadUpdate?: Partial<CustomerLead>;
}

export interface ChatResponsePayload {
  reply: string;
  extractedLead?: {
    name?: string | null;
    phone?: string | null;
    requirement?: string | null;
    serviceCategory?: string | null;
    preferredTime?: string | null;
  };
  isAppointmentRequest?: boolean;
}
