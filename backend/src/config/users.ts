// Predefined actors. Keep in sync with the account dropdown in the frontend.
export const USERS = ["Guest 1", "Guest 2", "Guest 3"] as const

export type User = (typeof USERS)[number]

export const isValidUser = (name: unknown): name is User =>
    typeof name === "string" && (USERS as readonly string[]).includes(name)
