export type SavedAccountRole =
  | "patient"
  | "caregiver"
  | "admin";

export interface SavedAccount {
  email: string;
  name: string;
  role: SavedAccountRole;
  lastUsedAt: number;
}

const STORAGE_KEY =
  "medicare_saved_accounts_v1";

function isValidRole(
  role: string
): role is SavedAccountRole {
  return (
    role === "patient" ||
    role === "caregiver" ||
    role === "admin"
  );
}

export function getSavedAccounts(): SavedAccount[] {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed: unknown =
      JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (account): account is SavedAccount => {
        if (
          typeof account !== "object" ||
          account === null
        ) {
          return false;
        }

        const item =
          account as Record<string, unknown>;

        return (
          typeof item.email === "string" &&
          typeof item.name === "string" &&
          typeof item.role === "string" &&
          isValidRole(item.role) &&
          typeof item.lastUsedAt === "number"
        );
      }
    );
  } catch {
    return [];
  }
}

export function saveAccount(
  account: Omit<SavedAccount, "lastUsedAt">
) {
  const existing =
    getSavedAccounts();

  const normalizedEmail =
    account.email.trim().toLowerCase();

  const updated = [
    {
      ...account,
      email: normalizedEmail,
      lastUsedAt: Date.now(),
    },
    ...existing.filter(
      (item) =>
        item.email.toLowerCase() !==
          normalizedEmail ||
        item.role !== account.role
    ),
  ].slice(0, 20);

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updated)
  );
}

export function removeSavedAccount(
  email: string,
  role: SavedAccountRole
) {
  const updated =
    getSavedAccounts().filter(
      (account) =>
        !(
          account.email.toLowerCase() ===
            email.toLowerCase() &&
          account.role === role
        )
    );

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updated)
  );
}

export function getSavedAccountsForRole(
  role: SavedAccountRole,
  query = ""
) {
  const normalizedQuery =
    query.trim().toLowerCase();

  return getSavedAccounts()
    .filter(
      (account) =>
        account.role === role
    )
    .filter(
      (account) =>
        !normalizedQuery ||
        account.email
          .toLowerCase()
          .includes(normalizedQuery) ||
        account.name
          .toLowerCase()
          .includes(normalizedQuery)
    )
    .sort(
      (a, b) =>
        b.lastUsedAt -
        a.lastUsedAt
    );
}