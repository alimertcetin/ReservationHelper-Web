export function dateToData(date) {
  return date.toISOString().split('T')[0]
}

export function dataToDate(data) {
	// new Date("YYYY-MM-DD") is treated as UTC, which can shift the date depending on the user's timezone.
	const [year, month, day] = data.split('-').map(Number)
	return new Date(year, month - 1, day)
}