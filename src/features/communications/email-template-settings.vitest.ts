import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  emailSettingsApi,
  getCurrentUser,
  setCurrentUser,
} from "@/lib/api";

function createStorage() {
  const values = new Map<string, string>();

  return {
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
    removeItem(key: string) {
      values.delete(key);
    },
    clear() {
      values.clear();
    },
  };
}

describe("shared email template settings", () => {
  beforeEach(() => {
    const localStorage = createStorage();

    vi.stubGlobal("window", {
      localStorage,
      location: {
        pathname: "/settings",
        href: "",
      },
    });

    vi.stubGlobal("localStorage", localStorage);
    vi.restoreAllMocks();
  });

  it("preserves the template-management permission on the logged-in user", () => {
    setCurrentUser({
      id: "2",
      name: "Samuel Ngugi",
      email: "sam@example.com",
      role: "sales",
      can_manage_communication_templates: true,
    } as any);

    expect(
      getCurrentUser()?.can_manage_communication_templates,
    ).toBe(true);
  });

  it("updates the central email templates through the settings API", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            updated: 5,
            updated_by: "Samuel Ngugi",
            message: "5 settings updated",
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          },
        ),
      );

    await emailSettingsApi.update({
      sender_name: "Nyumba Zetu Sales",
      template_cold: {
        subject: "Book a demo",
        body: "Hello {contact_name}\n\nRegards,\n{rep_name}",
      },
      template_followup: {
        subject: "Following up",
        body: "Hello {contact_name}\n\nRegards,\n{rep_name}",
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/settings/email"),
      expect.objectContaining({
        method: "PUT",
      }),
    );
  });
});
