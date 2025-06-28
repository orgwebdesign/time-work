export interface Task {
  id: string;
  listId: string;
  text: string;
  completed: boolean;
  createdAt: string;
  dueDate?: string; // Storing as ISO string for localStorage compatibility
  alarmEnabled?: boolean;
}

export interface List {
  id: string;
  name: string;
}

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

export interface Report {
  id: string;
  userId: string;
  userFullName: string;
  userEmail: string;
  subject: string;
  description: string;
  createdAt: string;
}
