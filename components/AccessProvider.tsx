"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { mayAddUsers } from "@/lib/roles";
import {
  getStoredCanAddUsers,
  getStoredRole,
  getStoredUserId,
  getStoredUserLimit,
  setStoredUser,
} from "@/lib/storage";
import type { Role } from "@/lib/types";

type AccessState = {
  role: Role | null;
  canAddUsers: boolean;
  userLimit: number;
  usersCreated: number;
  canManageUsers: boolean;
  ready: boolean;
};

const AccessContext = createContext<AccessState>({
  role: null,
  canAddUsers: false,
  userLimit: 0,
  usersCreated: 0,
  canManageUsers: false,
  ready: false,
});

export function AccessProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);
  const [canAddUsers, setCanAddUsers] = useState(false);
  const [userLimit, setUserLimit] = useState(0);
  const [usersCreated, setUsersCreated] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storedRole = getStoredRole();
    const storedLimit = getStoredUserLimit();
    const storedCanAdd = getStoredCanAddUsers();
    setRole(storedRole);
    setUserLimit(storedLimit);
    setCanAddUsers(storedRole === "SUPERADMIN" || storedLimit > 0 || storedCanAdd);

    let cancelled = false;
    api
      .getProfile()
      .then((user) => {
        if (cancelled) return;
        const userId = getStoredUserId();
        if (userId) {
          setStoredUser(userId, {
            name: user.name,
            phone: user.phone,
            profilePictureUrl: user.profilePictureUrl,
            role: user.role,
            username: user.username,
            canAddUsers: user.canAddUsers,
            userLimit: user.userLimit,
          });
        }
        setRole(user.role);
        setUserLimit(user.userLimit ?? 0);
        setUsersCreated(user.usersCreated ?? 0);
        setCanAddUsers(mayAddUsers(user.role, user.userLimit));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AccessContext.Provider
      value={{
        role,
        canAddUsers,
        userLimit,
        usersCreated,
        canManageUsers: mayAddUsers(role, userLimit),
        ready,
      }}
    >
      {children}
    </AccessContext.Provider>
  );
}

export function useAccess() {
  return useContext(AccessContext);
}
