export const format = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const day = 86400000;

  if (diff < day && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diff < 2 * day) return "Yesterday";
  return date.toLocaleDateString([], { day: "2-digit", month: "2-digit", year: "2-digit" });
};
