import type { RoleName } from "./context"

export type Action =
  | "manage_users"
  | "read_users"
  | "create_trainer"
  | "read_onboarding"
  | "move_onboarding"
  | "read_payments"
  | "update_payment"
  | "students.read" | "students.write"
  | "services.read" | "services.write"
  | "kanban.read" | "kanban.write"
  | "occurrences.read" | "occurrences.write" | "occurrences.close" | "occurrences.manage"
  | "settings.users.read" | "settings.users.write"
  | "settings.roles.read" | "settings.roles.write"

export function can(role: RoleName, action: Action): boolean {
  switch (action) {
    case "manage_users":
      return role === "admin" || role === "manager"
    case "read_users":
      return role === "admin" || role === "manager" || role === "support"
    case "create_trainer":
      return role === "admin" || role === "manager"
    case "read_onboarding":
      return true
    case "move_onboarding":
      return role === "admin" || role === "manager" || role === "trainer"
    case "read_payments":
      return role === "admin" || role === "manager" || role === "seller"
    case "update_payment":
      return role === "admin" || role === "manager"
    case "students.read":
      return role === "admin" || role === "manager" || role === "seller" || role === "support"
    case "students.write":
      return role === "admin" || role === "manager" || role === "seller"
    case "services.read":
      return true
    case "services.write":
      return role === "admin" || role === "manager"
    case "kanban.read":
      return true
    case "kanban.write":
      return role === "admin" || role === "manager" || role === "trainer"
    case "occurrences.read":
      return role === "admin" || role === "manager" || role === "seller" || role === "support" || role === "trainer"
    case "occurrences.write":
      return role === "admin" || role === "manager" || role === "seller" || role === "trainer"
    case "occurrences.close":
      return role === "admin" || role === "manager" || role === "trainer"
    case "occurrences.manage":
      return role === "admin" || role === "manager"
    case "settings.users.read":
      return role === "admin" || role === "manager" || role === "support"
    case "settings.users.write":
      return role === "admin" || role === "manager"
    case "settings.roles.read":
      return role === "admin" || role === "manager" || role === "support"
    case "settings.roles.write":
      return role === "admin"
    default:
      return false
  }
}


