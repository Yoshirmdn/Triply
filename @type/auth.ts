export type AppRole = "SUPER_ADMIN" | "USER";

export type Actor = {
  id: string;
  email: string;
  name: string | null;
  role: AppRole;
};