import type { Role } from "./types";

const USER_ID_KEY = "prime-brokers-user-id";
const USER_NAME_KEY = "prime-brokers-user-name";
const USER_PHONE_KEY = "prime-brokers-user-phone";
const USER_AVATAR_KEY = "prime-brokers-user-avatar";
const USER_ROLE_KEY = "prime-brokers-user-role";
const USER_USERNAME_KEY = "prime-brokers-user-username";
const USER_CAN_ADD_USERS_KEY = "prime-brokers-can-add-users";
const USER_LIMIT_KEY = "prime-brokers-user-limit";
const SESSION_TOKEN_KEY = "prime-brokers-session";

export interface StoredUserProfile {
  name: string;
  phone?: string | null;
  profilePictureUrl?: string | null;
  role?: Role;
  username?: string | null;
  canAddUsers?: boolean;
  userLimit?: number;
  sessionToken?: string;
}

export function getStoredUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USER_ID_KEY);
}

export function getStoredSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_TOKEN_KEY);
}

export function getStoredRole(): Role | null {
  if (typeof window === "undefined") return null;
  const role = localStorage.getItem(USER_ROLE_KEY);
  return role === "ADMIN" || role === "SUPERADMIN" || role === "USER"
    ? role
    : null;
}

export function getStoredCanAddUsers(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(USER_CAN_ADD_USERS_KEY) === "1";
}

export function getStoredUserLimit(): number {
  if (typeof window === "undefined") return 0;
  const limit = Number(localStorage.getItem(USER_LIMIT_KEY));
  return Number.isInteger(limit) && limit > 0 ? limit : 0;
}

export function setStoredUser(
  userId: string,
  profile: StoredUserProfile,
): void {
  localStorage.setItem(USER_ID_KEY, userId);
  localStorage.setItem(USER_NAME_KEY, profile.name);
  if (profile.phone) {
    localStorage.setItem(USER_PHONE_KEY, profile.phone);
  } else if (profile.phone === null) {
    localStorage.removeItem(USER_PHONE_KEY);
  }
  if (profile.profilePictureUrl) {
    localStorage.setItem(USER_AVATAR_KEY, profile.profilePictureUrl);
  } else {
    localStorage.removeItem(USER_AVATAR_KEY);
  }
  if (profile.role) {
    localStorage.setItem(USER_ROLE_KEY, profile.role);
  }
  if (profile.username) {
    localStorage.setItem(USER_USERNAME_KEY, profile.username);
  } else if (profile.username === null) {
    localStorage.removeItem(USER_USERNAME_KEY);
  }
  if (typeof profile.userLimit === "number" && Number.isFinite(profile.userLimit)) {
    const limit = Math.max(0, Math.floor(profile.userLimit));
    localStorage.setItem(USER_LIMIT_KEY, String(limit));
    if (profile.role === "SUPERADMIN" || limit > 0) {
      localStorage.setItem(USER_CAN_ADD_USERS_KEY, "1");
    } else {
      localStorage.removeItem(USER_CAN_ADD_USERS_KEY);
    }
  } else if (profile.role === "SUPERADMIN" || profile.canAddUsers === true) {
    localStorage.setItem(USER_CAN_ADD_USERS_KEY, "1");
  } else if (profile.canAddUsers === false) {
    localStorage.removeItem(USER_CAN_ADD_USERS_KEY);
  }
  if (profile.sessionToken) {
    localStorage.setItem(SESSION_TOKEN_KEY, profile.sessionToken);
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
    role: getStoredRole() ?? undefined,
    canAddUsers: getStoredCanAddUsers(),
    userLimit: getStoredUserLimit(),
  };
}

export function clearStoredUser(): void {
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(USER_NAME_KEY);
  localStorage.removeItem(USER_PHONE_KEY);
  localStorage.removeItem(USER_AVATAR_KEY);
  localStorage.removeItem(USER_ROLE_KEY);
  localStorage.removeItem(USER_USERNAME_KEY);
  localStorage.removeItem(USER_CAN_ADD_USERS_KEY);
  localStorage.removeItem(USER_LIMIT_KEY);
  localStorage.removeItem(SESSION_TOKEN_KEY);
}
