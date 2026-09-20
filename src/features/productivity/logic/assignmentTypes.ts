export type AssignmentStatus = 'not-started' | 'in-progress' | 'submitted';

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  status: AssignmentStatus;
  grade?: string;
  createdAt: string;
}

export const STATUS_LABEL: Record<AssignmentStatus, string> = {
  'not-started': 'Not started',
  'in-progress': 'In progress',
  submitted: 'Submitted',
};
