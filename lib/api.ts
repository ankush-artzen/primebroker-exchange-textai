import type {
  Lead,
  LeadFormData,
  ParsedLead,
  Property,
  PropertyFormData,
  OtpVerifyResult,
  User,
  UserProfileData,
} from "./types";
import { getStoredUserId } from "./storage";

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const userId = getStoredUserId();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (userId) headers["x-user-id"] = userId;
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(path, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data as T;
}

export const api = {
  sendOtp(phone: string) {
    return request<{ ok: true }>("/api/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ phone }),
    });
  },

  verifyOtp(phone: string, code: string) {
    return request<OtpVerifyResult>("/api/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ phone, code }),
    });
  },

  identify(name: string, phone: string, verificationToken: string) {
    return request<User>("/api/users/identify", {
      method: "POST",
      body: JSON.stringify({ name, phone, verificationToken }),
    });
  },

  getProfile() {
    return request<User>("/api/users/me");
  },

  updateProfile(data: Partial<UserProfileData>) {
    return request<User>("/api/users/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  getLeads() {
    return request<Lead[]>("/api/leads");
  },

  getLead(id: string) {
    return request<Lead>(`/api/leads/${id}`);
  },

  getTodayLeads() {
    return request<Lead[]>("/api/leads/today");
  },

  createLead(data: LeadFormData) {
    return request<Lead>("/api/leads", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateLead(id: string, data: Partial<LeadFormData> & { followUpDone?: boolean }) {
    return request<Lead>(`/api/leads/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deleteLead(id: string) {
    return request<{ success: boolean }>(`/api/leads/${id}`, {
      method: "DELETE",
    });
  },

  getProperties() {
    return request<Property[]>("/api/properties");
  },

  getProperty(id: string) {
    return request<Property>(`/api/properties/${id}`);
  },

  createProperty(data: PropertyFormData) {
    return request<Property>("/api/properties", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateProperty(id: string, data: Partial<PropertyFormData>) {
    return request<Property>(`/api/properties/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deleteProperty(id: string) {
    return request<{ success: boolean }>(`/api/properties/${id}`, {
      method: "DELETE",
    });
  },

  parseLead(text: string, language: string) {
    return request<ParsedLead>("/api/ai/parse-lead", {
      method: "POST",
      body: JSON.stringify({ text, language }),
    });
  },

  uploadPhotos(files: File[]) {
    const form = new FormData();
    files.forEach((f) => form.append("files", f));
    return request<{ urls: string[] }>("/api/upload", {
      method: "POST",
      body: form,
    });
  },
};
