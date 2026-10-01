"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Pencil, Plus, Shield, Trash2 } from "lucide-react";
import type { User } from "@/lib/types";
import { api } from "@/lib/api";
import { roleLabel } from "@/lib/roles";
import { getStoredUserId } from "@/lib/storage";
import {
  cn,
  formatDate,
  isValidIndianPhone,
  isValidPersonName,
  sanitizePersonName,
} from "@/lib/utils";
import { useAccess } from "@/components/AccessProvider";
import { AddButton, AppPage } from "@/components/AppPage";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ButtonLoader, ListSkeleton } from "@/components/Loader";
import { ListPagination } from "@/components/ListPagination";
import { Modal } from "@/components/Modal";
import { PhoneField } from "@/components/PhoneField";
import { UserAvatar } from "@/components/UserAvatar";
import { usePagination } from "@/hooks/usePagination";
import {
  fieldErrorBorder,
  fieldErrorText,
  formErrorBanner,
} from "@/lib/form-errors";

const inputClass =
  "w-full rounded-[10px] border border-border bg-surface px-3 py-2.5 text-sm text-primary outline-none focus:border-primary";

function roleRank(role: User["role"]) {
  if (role === "SUPERADMIN") return 0;
  if (role === "ADMIN") return 1;
  return 2;
}

function clampLimit(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(500, Math.floor(value)));
}

export default function UsersPage() {
  const router = useRouter();
  const { role, canManageUsers, userLimit, usersCreated, ready } = useAccess();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      setUsers(await api.listUsers());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!canManageUsers) {
      router.replace("/today");
      return;
    }
    load();
  }, [ready, canManageUsers, load, router]);

  const ordered = useMemo(
    () =>
      [...users].sort(
        (a, b) => roleRank(a.role) - roleRank(b.role) || a.name.localeCompare(b.name),
      ),
    [users],
  );

  const isSuperAdmin = role === "SUPERADMIN";
  const { page, setPage, totalPages, paginatedItems, pageSize, total } =
    usePagination(ordered);
  const mine = ordered.find((entry) => entry.id === getStoredUserId());
  const limit = mine?.userLimit ?? userLimit;
  const created = mine?.usersCreated ?? usersCreated;
  const remaining = Math.max(0, limit - created);
  const atLimit = ready && !isSuperAdmin && remaining <= 0;

  const saveLimit = async (user: User, nextLimit: number) => {
    setSavingId(user.id);
    setError("");
    try {
      const updated = await api.updateUser(user.id, { userLimit: nextLimit });
      setUsers((current) =>
        current.map((entry) => (entry.id === updated.id ? updated : entry)),
      );
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update admin");
      return false;
    } finally {
      setSavingId(null);
    }
  };

  const setDisabled = async (user: User, disabled: boolean) => {
    setSavingId(user.id);
    setError("");
    try {
      const updated = await api.updateUser(user.id, { disabled });
      setUsers((current) =>
        current.map((entry) => (entry.id === updated.id ? updated : entry)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setSavingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeletingBusy(true);
    setError("");
    try {
      await api.deleteUser(deleting.id);
      setDeleting(null);
      await load(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
      setDeleting(null);
    } finally {
      setDeletingBusy(false);
    }
  };

  return (
    <AppPage
      title="Users"
      subtitle={
        !ready
          ? undefined
          : isSuperAdmin
            ? "Add, edit, and remove accounts. Set how many brokers each admin can add."
            : atLimit
              ? `You have added all ${limit} broker${limit === 1 ? "" : "s"}. Ask a super admin to raise the limit.`
              : `You can add ${remaining} more broker${remaining === 1 ? "" : "s"}.`
      }
      action={
        canManageUsers ? (
          <AddButton onClick={() => setAddOpen(true)} disabled={atLimit} />
        ) : undefined
      }
    >
      {error && <p className={`mb-4 ${formErrorBanner}`}>{error}</p>}

      {!ready || loading ? (
        <ListSkeleton count={4} />
      ) : ordered.length === 0 ? (
        <div className="rounded-2xl bg-surface px-4 py-9 text-center text-[13.5px] leading-relaxed text-muted">
          <Shield size={36} strokeWidth={1.5} className="mx-auto mb-3 text-upcoming" />
          No users yet.
        </div>
      ) : (
        <>
        <div className="overflow-x-auto rounded-[14px] border border-border bg-surface shadow-sm">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="border-b border-border bg-background text-[11px] font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-3 py-3 font-semibold">Phone No.</th>
                <th className="px-3 py-3 font-semibold">User Type</th>
                <th className="px-3 py-3 font-semibold">Disabled</th>
                {/* <th className="px-3 py-3 font-semibold">Created By</th> */}
                <th className="px-3 py-3 font-semibold">Created Date</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((user) => (
                <tr key={user.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <UserAvatar
                        name={user.name}
                        imageUrl={user.profilePictureUrl}
                        size={36}
                      />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-primary">{user.name}</p>
                        {user.role !== "USER" && (
                          <p className="truncate text-xs text-muted">
                            {user.username || "No username"}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-primary">
                    {user.phone || "—"}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        user.role === "SUPERADMIN"
                          ? "bg-primary/10 text-primary"
                          : user.role === "ADMIN"
                            ? "bg-secondary-tint text-secondary"
                            : "bg-background text-muted",
                      )}
                    >
                      {roleLabel(user.role)}
                    </span>
                    {isSuperAdmin && user.role === "ADMIN" && (
                      <UserLimitControl
                        user={user}
                        disabled={savingId === user.id}
                        onSave={(next) => saveLimit(user, next)}
                      />
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {isSuperAdmin && user.role !== "SUPERADMIN" ? (
                      <button
                        type="button"
                        role="switch"
                        aria-checked={user.disabled === true}
                        aria-label={
                          user.disabled
                            ? `Enable ${user.name}`
                            : `Disable ${user.name}`
                        }
                        disabled={savingId === user.id}
                        onClick={() => setDisabled(user, user.disabled !== true)}
                        className={cn(
                          "relative h-6 w-11 rounded-full transition-colors disabled:opacity-50",
                          user.disabled ? "bg-red-500" : "bg-zinc-300",
                        )}
                      >
                        <span
                          className={cn(
                            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                            user.disabled ? "left-5" : "left-0.5",
                          )}
                        />
                      </button>
                    ) : (
                      <span className="text-muted">{user.disabled ? "Yes" : "No"}</span>
                    )}
                  </td>
                  {/* <td className="whitespace-nowrap px-3 py-3 text-primary">
                    {user.createdByName || "—"}
                  </td> */}
                  <td className="whitespace-nowrap px-3 py-3 text-primary">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    {isSuperAdmin && user.role !== "SUPERADMIN" ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label={`Edit ${user.name}`}
                          onClick={() => setEditing(user)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-background hover:text-primary"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${user.name}`}
                          onClick={() => setDeleting(user)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ListPagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          onPageChange={setPage}
        />
        </>
      )}

      <UserFormModal
        open={addOpen}
        allowAdmin={isSuperAdmin}
        onClose={() => setAddOpen(false)}
        onSaved={() => {
          setAddOpen(false);
          load(true);
        }}
      />
      <UserFormModal
        open={editing !== null}
        user={editing}
        allowAdmin={isSuperAdmin}
        onClose={() => setEditing(null)}
        onSaved={(updated) => {
          setUsers((current) =>
            current.map((entry) => (entry.id === updated.id ? updated : entry)),
          );
          setEditing(null);
        }}
      />
      <ConfirmDialog
        open={deleting !== null}
        title={deleting ? `Delete ${deleting.name}?` : "Delete user?"}
        description={
          deleting?.role === "ADMIN"
            ? "Their login stops working. Brokers they added stay in the app."
            : "Their leads and properties are removed too."
        }
        confirmLabel="Delete"
        loading={deletingBusy}
        onCancel={() => {
          if (!deletingBusy) setDeleting(null);
        }}
        onConfirm={confirmDelete}
      />
    </AppPage>
  );
}

function UserLimitControl({
  user,
  disabled,
  onSave,
}: {
  user: User;
  disabled: boolean;
  onSave: (limit: number) => Promise<boolean>;
}) {
  const saved = user.userLimit ?? 0;
  const created = user.usersCreated ?? 0;
  const [draft, setDraft] = useState(String(saved));

  useEffect(() => {
    setDraft(String(saved));
  }, [saved, user.id]);

  const commit = async (next: number) => {
    const limit = clampLimit(next);
    setDraft(String(limit));
    if (limit === saved) return;
    const ok = await onSave(limit);
    if (!ok) setDraft(String(saved));
  };

  return (
    <div className="mt-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
        Brokers they can add
      </p>
      <div className="mt-1 flex items-center gap-1.5">
        <button
          type="button"
          aria-label={`Lower ${user.name}'s user limit`}
          disabled={disabled || saved <= 0}
          onClick={() => commit(saved - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-primary disabled:opacity-40"
        >
          <Minus size={14} />
        </button>
        <input
          inputMode="numeric"
          aria-label={`How many users ${user.name} can add`}
          value={draft}
          disabled={disabled}
          onChange={(event) => setDraft(event.target.value.replace(/\D/g, "").slice(0, 3))}
          onBlur={() => commit(Number(draft))}
          className="h-8 w-14 rounded-lg border border-border bg-background text-center text-sm font-semibold text-primary outline-none focus:border-primary disabled:opacity-50"
        />
        <button
          type="button"
          aria-label={`Raise ${user.name}'s user limit`}
          disabled={disabled || saved >= 500}
          onClick={() => commit(saved + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-primary disabled:opacity-40"
        >
          <Plus size={14} />
        </button>
        <span
          className={cn(
            "text-xs",
            created > saved ? "text-overdue-muted" : "text-muted",
          )}
        >
          {created} added
        </span>
      </div>
    </div>
  );
}

function UserFormModal({
  open,
  user,
  allowAdmin,
  onClose,
  onSaved,
}: {
  open: boolean;
  user?: User | null;
  allowAdmin: boolean;
  onClose: () => void;
  onSaved: (user: User) => void;
}) {
  const editing = Boolean(user);
  const [kind, setKind] = useState<"USER" | "ADMIN">("USER");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [userLimit, setUserLimit] = useState("0");
  const [error, setError] = useState("");
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [limitError, setLimitError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setKind(user?.role === "ADMIN" ? "ADMIN" : "USER");
    setName(user?.name ?? "");
    setPhone(user?.phone ?? "");
    setUsername(user?.username ?? "");
    setPassword("");
    setUserLimit(String(user?.userLimit ?? 0));
    setError("");
    setNameError("");
    setPhoneError("");
    setUsernameError("");
    setPasswordError("");
    setLimitError("");
  }, [open, user]);

  const isAdminForm = kind === "ADMIN";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextNameError = !name.trim()
      ? "Name is required"
      : !isValidPersonName(name)
        ? "Name can only contain letters"
        : "";
    const nextPhoneError =
      !isAdminForm && !isValidIndianPhone(phone)
        ? "Enter a valid 10-digit mobile number"
        : "";
    const nextUsernameError =
      isAdminForm && !/^[a-z0-9._-]{3,32}$/.test(username.trim().toLowerCase())
        ? "Use 3–32 letters, numbers, dots, or dashes"
        : "";
    const nextPasswordError = isAdminForm
      ? !editing && password.length < 8
        ? "Password must be at least 8 characters"
        : editing && password.length > 0 && password.length < 8
          ? "Password must be at least 8 characters"
          : ""
      : "";
    const parsedLimit = clampLimit(Number(userLimit));
    const nextLimitError =
      isAdminForm && !editing && (userLimit.trim() === "" || Number(userLimit) > 500)
        ? "Enter a limit from 0 to 500"
        : "";

    setNameError(nextNameError);
    setPhoneError(nextPhoneError);
    setUsernameError(nextUsernameError);
    setPasswordError(nextPasswordError);
    setLimitError(nextLimitError);
    setError("");
    if (nextNameError || nextPhoneError || nextUsernameError || nextPasswordError || nextLimitError) {
      return;
    }

    setSaving(true);
    try {
      const saved = editing && user
        ? await api.updateUser(user.id, {
            name: name.trim(),
            ...(isAdminForm
              ? {
                  username: username.trim().toLowerCase(),
                  ...(password ? { password } : {}),
                }
              : { phone }),
          })
        : await api.createUser(
            isAdminForm
              ? {
                  name: name.trim(),
                  role: "ADMIN",
                  username: username.trim().toLowerCase(),
                  password,
                  userLimit: parsedLimit,
                }
              : { name: name.trim(), phone, role: "USER" },
          );
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save user");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? (isAdminForm ? "Edit admin" : "Edit broker") : "Add user"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-muted">
          {isAdminForm
            ? "Admins sign in with a username and password. Set how many brokers they can add."
            : "They sign in with this phone number and the SMS code."}
        </p>
        {error && <p className={formErrorBanner}>{error}</p>}
        {allowAdmin && !editing && (
          <div className="grid grid-cols-2 gap-2">
            {(["USER", "ADMIN"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setKind(option)}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-sm font-semibold",
                  kind === option
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-surface text-primary",
                )}
              >
                {option === "ADMIN" ? "Admin" : "Broker"}
              </button>
            ))}
          </div>
        )}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted">Name</label>
          <input
            value={name}
            onChange={(event) => {
              setName(sanitizePersonName(event.target.value));
              if (nameError) setNameError("");
            }}
            className={cn(inputClass, nameError && fieldErrorBorder)}
          />
          {nameError && <p className={fieldErrorText}>{nameError}</p>}
        </div>
        {isAdminForm ? (
          <>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted">
                Username
              </label>
              <input
                value={username}
                autoComplete="off"
                onChange={(event) => {
                  setUsername(event.target.value.toLowerCase());
                  if (usernameError) setUsernameError("");
                }}
                className={cn(inputClass, usernameError && fieldErrorBorder)}
              />
              {usernameError && <p className={fieldErrorText}>{usernameError}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted">
                {editing ? "New password" : "Password"}
              </label>
              <input
                type="password"
                value={password}
                autoComplete="new-password"
                placeholder={editing ? "Leave blank to keep the current password" : ""}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (passwordError) setPasswordError("");
                }}
                className={cn(inputClass, passwordError && fieldErrorBorder)}
              />
              {passwordError && <p className={fieldErrorText}>{passwordError}</p>}
            </div>
            {!editing && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-muted">
                  Brokers they can add
                </label>
                <input
                  inputMode="numeric"
                  value={userLimit}
                  onChange={(event) => {
                    setUserLimit(event.target.value.replace(/\D/g, "").slice(0, 3));
                    if (limitError) setLimitError("");
                  }}
                  className={cn(inputClass, limitError && fieldErrorBorder)}
                />
                <p className="mt-1 text-xs text-muted">0 means they cannot add users.</p>
                {limitError && <p className={fieldErrorText}>{limitError}</p>}
              </div>
            )}
          </>
        ) : (
          <PhoneField
            value={phone}
            onChange={(value) => {
              setPhone(value);
              if (phoneError) setPhoneError("");
            }}
            label="Phone"
            variant="add"
            error={phoneError}
          />
        )}
        <button
          type="submit"
          disabled={saving}
          className="flex w-full items-center justify-center rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {saving ? (
            <ButtonLoader label={editing ? "Saving" : "Adding"} />
          ) : editing ? (
            "Save"
          ) : (
            "Add user"
          )}
        </button>
      </form>
    </Modal>
  );
}
