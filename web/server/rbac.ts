import type { RoleName } from "./context"

export type Action =
  | "manage_users"
  | "read_users"
  | "create_trainer"
  | "read_onboarding"
  | "move_onboarding"
  | "read_payments"
  | "update_payment"

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
    default:
      return false
  }
}


