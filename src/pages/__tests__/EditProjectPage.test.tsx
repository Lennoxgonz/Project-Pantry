import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import EditProjectPage from "../EditProjectPage";

const { mockGetProjectById, mockUpdateProjectWithDetails, mockSupabaseClient } =
  vi.hoisted(() => ({
    mockGetProjectById: vi.fn(),
    mockUpdateProjectWithDetails: vi.fn(),
    mockSupabaseClient: {
      auth: {
        getSession: vi.fn(),
      },
      from: vi.fn(),
    },
  }));

vi.mock("../../hooks/useProjects", () => ({
  useProjects: () => ({
    getProjectById: mockGetProjectById,
    updateProjectWithDetails: mockUpdateProjectWithDetails,
    error: null,
  }),
}));

vi.mock("../../utils/supabaseClient", () => ({
  default: mockSupabaseClient,
}));

function mockEditPageReads() {
  mockSupabaseClient.from.mockImplementation((table: string) => {
    if (table === "project_materials") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn((column: string) => {
            if (column === "project_id") {
              return {
                is: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              };
            }

            if (column === "subproject_id") {
              return Promise.resolve({
                data: [],
                error: null,
              });
            }

            throw new Error(`Unexpected project_materials column: ${column}`);
          }),
        })),
      };
    }

    if (table === "subprojects") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          })),
        })),
      };
    }

    if (table === "inventory_items") {
      return {
        select: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        })),
      };
    }

    throw new Error(`Unexpected table access in EditProjectPage: ${table}`);
  });
}

function renderPage() {
  render(
    <MemoryRouter initialEntries={["/projects/project-1/edit"]}>
      <Routes>
        <Route path="/projects/:id/edit" element={<EditProjectPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("EditProjectPage transactional save flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEditPageReads();

    mockGetProjectById.mockResolvedValue({
      id: "project-1",
      user_id: "user-1",
      name: "Old Project Name",
      description: "Original description",
      estimated_time: 2,
      is_public: false,
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
    });
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: "user-1" } } },
      error: null,
    });
  });

  it("submits edit flow through one transactional update call", async () => {
    mockUpdateProjectWithDetails.mockResolvedValue(undefined);
    renderPage();

    await screen.findByText(/edit project/i);
    const projectNameInput = screen.getAllByRole("textbox")[0];
    fireEvent.change(projectNameInput, {
      target: { value: "Updated Project Name" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: /save changes/i })[0]);

    await waitFor(() => {
      expect(mockUpdateProjectWithDetails).toHaveBeenCalledTimes(1);
    });

    const [userId, payload] = mockUpdateProjectWithDetails.mock.calls[0];
    expect(userId).toBe("user-1");
    expect(payload).toMatchObject({
      id: "project-1",
      name: "Updated Project Name",
    });
    expect(
      await screen.findByText(/project updated successfully!/i)
    ).toBeInTheDocument();
  });

  it("shows edit failure and keeps user input for retry", async () => {
    mockUpdateProjectWithDetails.mockRejectedValue(
      new Error("Update transaction failed")
    );
    renderPage();

    await screen.findByText(/edit project/i);
    const projectNameInput = screen.getAllByRole("textbox")[0];
    fireEvent.change(projectNameInput, {
      target: { value: "Will Retry Name" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: /save changes/i })[0]);

    expect(
      await screen.findByText(/update transaction failed/i)
    ).toBeInTheDocument();
    expect(screen.getAllByRole("textbox")[0]).toHaveValue("Will Retry Name");
    expect(screen.queryByText(/project updated successfully!/i)).toBeNull();
  });
});
