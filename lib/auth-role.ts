export const ADMIN_EMAIL = "admin@ibdaa.com";

export const normalizeEmail = (email?: string | null) =>
  email?.trim().toLowerCase() ?? "";

export const isAdminEmail = (email?: string | null) =>
  normalizeEmail(email) === ADMIN_EMAIL;

export const resolveUserRole = (
  email?: string | null,
  profileRole?: string | null
) => {
  if (isAdminEmail(email)) return "admin";
  return profileRole === "admin" ? "admin" : "customer";
};
