export enum UserRole {
  STUDENT = "STUDENT",
  SIWES_COORDINATOR = "SIWES_COORDINATOR",
  IT_SUPERVISOR = "IT_SUPERVISOR",
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface LogEntry {
  id: string;
  studentId: string;
  date: string;
  activities: string;
  submittedAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}
