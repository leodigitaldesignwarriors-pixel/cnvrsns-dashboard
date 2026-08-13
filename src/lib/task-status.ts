import { ProjectStatus, TaskPriority, TaskStatus } from "@/lib/types";

type Tone = "green" | "yellow" | "red" | "slate" | "blue";

export const PROJECT_STATUS_TONE: Record<ProjectStatus, Tone> = {
  not_started: "slate",
  in_progress: "blue",
  in_review: "yellow",
  completed: "green",
};

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  in_review: "In Review",
  completed: "Completed",
};

export const TASK_STATUS_TONE: Record<TaskStatus, Tone> = {
  todo: "slate",
  in_progress: "blue",
  blocked: "red",
  done: "green",
};

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  blocked: "Blocked",
  done: "Done",
};

export const TASK_PRIORITY_TONE: Record<TaskPriority, Tone> = {
  low: "slate",
  medium: "yellow",
  high: "red",
};

export const TASK_PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export function isTaskOverdue(dueDate: string | null, status: TaskStatus) {
  if (!dueDate || status === "done") return false;
  return dueDate < new Date().toISOString().slice(0, 10);
}

export function isProjectOverdue(dueDate: string | null, status: ProjectStatus) {
  if (!dueDate || status === "completed") return false;
  return dueDate < new Date().toISOString().slice(0, 10);
}
