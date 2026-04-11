export const dateToData = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function dataToDate(data) {
	// new Date("YYYY-MM-DD") is treated as UTC, which can shift the date depending on the user's timezone.
	const [year, month, day] = data.split('-').map(Number)
	return new Date(year, month - 1, day)
}