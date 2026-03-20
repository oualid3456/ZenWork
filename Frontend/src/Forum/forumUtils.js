export function normalizeRole(role) {
  return String(role || "").trim().toLowerCase();
}

export function isHR(role) {
  return normalizeRole(role) === "rh";
}

export function isAdminLike(role) {
  const normalized = normalizeRole(role);
  return ["rh", "direction", "admin", "administrateur"].includes(normalized);
}

export function getUserDisplayName(user, profile = null) {
  return (
    profile?.prenom ||
    user?.user_metadata?.prenom ||
    user?.user_metadata?.full_name ||
    "Utilisateur"
  );
}

export function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}