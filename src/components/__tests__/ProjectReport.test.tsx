import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import ProjectReport from "../ProjectReport";
import { Project, ProjectMaterial, Subproject } from "../../types";

const { mockSupabaseClient } = vi.hoisted(() => ({
  mockSupabaseClient: {
    from: vi.fn(),
  },
}));

vi.mock("../../utils/supabaseClient", () => ({
  default: mockSupabaseClient,
}));

const projects: Project[] = [
  {
    id: "project-1",
    user_id: "user-1",
    name: "Garage Shelving",
    description: null,
    estimated_time: 3,
    is_public: false,
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-02T00:00:00.000Z",
  },
  {
    id: "project-2",
    user_id: "user-1",
    name: "Garden Planter",
    description: null,
    estimated_time: 2,
    is_public: false,
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-02T00:00:00.000Z",
  },
];

type ReportMaterial = ProjectMaterial & {
  inventory_items: {
    unit_cost: number | null;
  } | null;
};

function mockReportFetches({
  projectMaterials,
  subprojectMaterials = [],
  subprojects,
  materialError = null,
}: {
  projectMaterials: ReportMaterial[];
  subprojectMaterials?: ReportMaterial[];
  subprojects: Subproject[];
  materialError?: Error | null;
}) {
  let projectMaterialsCallCount = 0;

  mockSupabaseClient.from.mockImplementation((table: string) => {
    if (table === "project_materials") {
      return {
        select: vi.fn(() => ({
          in: vi.fn(() => {
            projectMaterialsCallCount += 1;

            if (projectMaterialsCallCount === 1) {
              return Promise.resolve({
                data: projectMaterials,
                error: materialError,
              });
            }

            return Promise.resolve({
              data: subprojectMaterials,
              error: materialError,
            });
          }),
        })),
      };
    }

    if (table === "subprojects") {
      return {
        select: vi.fn(() => ({
          in: vi.fn().mockResolvedValue({
            data: subprojects,
            error: null,
          }),
        })),
      };
    }

    throw new Error(`Unexpected table in ProjectReport test: ${table}`);
  });
}

describe("ProjectReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calculates total cost from quantity multiplied by unit cost", async () => {
    mockReportFetches({
      projectMaterials: [
        {
          id: "m-1",
          project_id: "project-1",
          subproject_id: null,
          inventory_item_id: "inv-1",
          quantity_needed: 2,
          is_fulfilled: false,
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
          inventory_items: { unit_cost: 5 },
        },
        {
          id: "m-2",
          project_id: "project-1",
          subproject_id: null,
          inventory_item_id: "inv-2",
          quantity_needed: 3,
          is_fulfilled: false,
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
          inventory_items: { unit_cost: 2 },
        },
        {
          id: "m-3",
          project_id: "project-2",
          subproject_id: null,
          inventory_item_id: "inv-3",
          quantity_needed: 1,
          is_fulfilled: false,
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
          inventory_items: { unit_cost: 4 },
        },
      ],
      subprojectMaterials: [],
      subprojects: [],
    });

    render(
      <ProjectReport show onHide={vi.fn()} projects={projects} />
    );

    await waitFor(() => {
      expect(screen.getByText("$16.00")).toBeInTheDocument();
      expect(screen.getByText("$4.00")).toBeInTheDocument();
      expect(screen.getByText("$20.00")).toBeInTheDocument();
    });
  });

  it("includes subproject materials in project cost totals", async () => {
    mockReportFetches({
      projectMaterials: [],
      subprojectMaterials: [
        {
          id: "sm-1",
          project_id: null,
          subproject_id: "subproject-1",
          inventory_item_id: "inv-4",
          quantity_needed: 2,
          is_fulfilled: false,
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
          inventory_items: { unit_cost: 7 },
        },
      ],
      subprojects: [
        {
          id: "subproject-1",
          project_id: "project-1",
          name: "Framing",
          description: null,
          estimated_time: 1,
          order_index: 0,
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        },
      ],
    });

    render(
      <ProjectReport show onHide={vi.fn()} projects={projects} />
    );

    await waitFor(() => {
      expect(screen.getAllByText("$14.00")).toHaveLength(2);
    });
  });

  it("shows a clear error message when report data fetch fails", async () => {
    mockReportFetches({
      projectMaterials: [],
      subprojectMaterials: [],
      subprojects: [],
      materialError: new Error("Report fetch failed"),
    });

    render(
      <ProjectReport show onHide={vi.fn()} projects={projects} />
    );

    expect(await screen.findByText("Report fetch failed")).toBeInTheDocument();
  });
});
