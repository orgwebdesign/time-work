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
