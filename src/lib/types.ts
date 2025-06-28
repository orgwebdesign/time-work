export interface Task {
  id: string;
  listId: string;
  text: string;
  completed: boolean;
  dueDate?: string; // Storing as ISO string for localStorage compatibility
}

export interface List {
  id: string;
  name: string;
}
