export interface ParsedRole {
  current: string
  assignmentReason: string
  primary: string
  secondary: string
}

// assignmentReason: PRIMARY, SECONDARY, FILL_SECONDARY, FILL_PRIMARY, AUTOFILL
// NONE, UNSELECTED
// TOP, MIDDLE, JUNGLE, BOTTOM, UTILITY
export function parseSelectedRole(role: string | null): ParsedRole {
  if (!role) {
    return {
      current: 'NONE',
      assignmentReason: 'NONE',
      primary: 'NONE',
      secondary: 'NONE'
    }
  }

  const segments = role.split('.')
  if (segments.length !== 4) {
    return {
      current: 'NONE',
      assignmentReason: 'NONE',
      primary: 'NONE',
      secondary: 'NONE'
    }
  }

  const [p1, p2, p3, p4] = segments

  return {
    current: p1,
    assignmentReason: p2,
    primary: p3,
    secondary: p4
  }
}
