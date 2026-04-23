// String Utils - String helpers
export const truncate = (str: string, maxLength: number) =>
  str.length > maxLength ? str.substring(0, maxLength) + '...' : str
