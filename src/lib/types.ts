
export interface Weather {
  location: string;
  temperature: number;
  condition: 'Sunny' | 'Cloudy' | 'Rainy' | 'Clear' | 'Partly Cloudy';
  icon: React.ElementType;
  isDay: boolean;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
  password?: string; // In a real app, this would be a hash.
  loginCount?: number;
  lastLogin?: string;
  adminNotes?: string;
}

export interface ActivityEvent {
    action: 'Start Day' | 'Take a Break' | 'Resume Work' | 'End Day';
    timestamp: string; // ISO string
}
