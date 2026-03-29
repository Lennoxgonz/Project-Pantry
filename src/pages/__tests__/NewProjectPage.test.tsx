import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import NewProjectPage from "../NewProjectPage";

const { mockSupabaseClient } = vi.hoisted(() => ({
  mockSupabaseClient: {
    auth: {
      getSession: vi.fn(),
    },
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

vi.mock("../../utils/supabaseClient", () => ({
  default: mockSupabaseClient,
}));

function mockInventoryFetch() {
  mockSupabaseClient.from.mockImplementation((table: string) => {
    if (table !== "inventory_items") {
      throw new Error(`Unexpected table access in NewProjectPage: ${table}`);
    }

    return {
      select: vi.fn(() => ({
        order: vi.fn().mockResolvedValue({
          data: [
            {
              id: "inv-1",
              user_id: "user-1",
              name: "Wood Plank",
              description: null,
              quantity: 10,
              unit: "pieces",
              unit_cost: 5,
              created_at: "2024-01-01",
              updated_at: "2024-01-01",
            },
          ],
          error: null,
        }),
      })),
    };
  });
}

describe("NewProjectPage transactional save flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInventoryFetch();

    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: "user-1" } } },
      error: null,
    });
  });

  it("submits create flow through a single transactional RPC call", async () => {
    mockSupabaseClient.rpc.mockResolvedValue({
      data: { success: true, project_id: "project-1" },
      error: null,
    });

    render(
      <BrowserRouter>
        <NewProjectPage />
      </BrowserRouter>
    );

    fireEvent.change(screen.getAllByRole("textbox")[0], {
      target: { value: "Garage Shelves" },
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: /create project/i,
      })
    );

    await waitFor(() => {
      expect(mockSupabaseClient.rpc).toHaveBeenCalledTimes(1);
    });

    const [rpcFunctionName, rpcPayload] = mockSupabaseClient.rpc.mock.calls[0];
    expect(rpcFunctionName).toBe(
      "save_new_project_with_materials_and_subprojects"
    );
    expect(rpcPayload).toMatchObject({
      p_user_id: "user-1",
      p_payload: {
        name: "Garage Shelves",
      },
    });
    expect(
      await screen.findByText(/project created successfully!/i)
    ).toBeInTheDocument();
  });

  it("shows save failure and preserves form state for retry", async () => {
    mockSupabaseClient.rpc.mockResolvedValue({
      data: { success: false, error: "Failed to save project transaction" },
      error: null,
    });

    render(
      <BrowserRouter>
        <NewProjectPage />
      </BrowserRouter>
    );

    const projectNameInput = screen.getAllByRole("textbox")[0];
    fireEvent.change(projectNameInput, {
      target: { value: "Garden Deck" },
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: /create project/i,
      })
    );

    expect(
      await screen.findByText(/failed to save project transaction/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/project created successfully!/i)).toBeNull();
    expect(screen.getAllByRole("textbox")[0]).toHaveValue("Garden Deck");
  });
});