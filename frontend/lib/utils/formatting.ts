// Formatting - Data format helpers
export const formatters = {
  capitalize: (str: string) => str.charAt(0).toUpperCase() + str.slice(1),
  toTitleCase: (str: string) => str.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
}
