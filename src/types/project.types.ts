import { BaseProject } from "./base-project.types";

export interface Project extends BaseProject {
  user_id: string;
  is_public: boolean;
}

export type CreateProject = Omit<Project, "id" | "created_at" | "updated_at">;
