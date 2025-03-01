export interface ProjectFile {
  id: string;
  project_id: string | null;
  subproject_id: string | null;
  file_path: string;
  file_type: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export function isProjectFile(file: ProjectFile): boolean {
  return file.project_id !== null && file.subproject_id === null;
}

export function isSubprojectFile(file: ProjectFile): boolean {
  return file.project_id === null && file.subproject_id !== null;
}

export type CreateProjectFile = Omit<
  ProjectFile,
  "id" | "created_at" | "updated_at"
>;
