const USER_ID_KEY = "prime-brokers-user-id";
const USER_NAME_KEY = "prime-brokers-user-name";
const USER_PHONE_KEY = "prime-brokers-user-phone";
const USER_AVATAR_KEY = "prime-brokers-user-avatar";

export interface StoredUserProfile {
  name: string;
  phone?: string;
  profilePictureUrl?: string | null;
}

export function getStoredUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USER_ID_KEY);
}

export function setStoredUser(
  userId: string,
  profile: StoredUserProfile,
): void {
  localStorage.setItem(USER_ID_KEY, userId);
  localStorage.setItem(USER_NAME_KEY, profile.name);
  if (profile.phone) {
    localStorage.setItem(USER_PHONE_KEY, profile.phone);
  }
  if (profile.profilePictureUrl) {
    localStorage.setItem(USER_AVATAR_KEY, profile.profilePictureUrl);
  } else {
    localStorage.removeItem(USER_AVATAR_KEY);
  }
}

export function getStoredUserName(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USER_NAME_KEY);
}

export function getStoredUserPhone(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USER_PHONE_KEY);
}

export function getStoredUserAvatar(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USER_AVATAR_KEY);
}

export function getStoredUserProfile(): StoredUserProfile | null {
  const name = getStoredUserName();
  if (!name) return null;

  return {
    name,
    phone: getStoredUserPhone() ?? undefined,
    profilePictureUrl: getStoredUserAvatar(),
  };
}

export function clearStoredUser(): void {
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(USER_NAME_KEY);
  localStorage.removeItem(USER_PHONE_KEY);
  localStorage.removeItem(USER_AVATAR_KEY);
}
