import { BaseProject } from "./base-project.types";

export interface Subproject extends BaseProject {
  project_id: string;
  order_index: number;
}

export type CreateSubproject = Omit<
  Subproject,
  "id" | "created_at" | "updated_at"
>;
