export interface User {
  id: string;
  name: string;
  phone: string;
  profilePictureUrl?: string | null;
  createdAt: string;
}

export type UserProfileData = Pick<User, "name" | "phone" | "profilePictureUrl">;

export interface OtpVerifyResult {
  verified: true;
  token: string;
  user: User | null;
}

export interface Lead {
  id: string;
  userId: string;
  name: string;
  phone: string;
  requirement?: string | null;
  location?: string | null;
  budget?: string | null;
  source?: string | null;
  notes?: string | null;
  followUpDate?: string | null;
  followUpDone: boolean;
  status?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Property {
  id: string;
  userId: string;
  title: string;
  location: string;
  price: string;
  configuration?: string | null;
  area?: string | null;
  availability?: string | null;
  notes?: string | null;
  photoUrls: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ParsedLead {
  name?: string;
  phone?: string;
  requirement?: string;
  location?: string;
  budget?: string;
  source?: string;
  notes?: string;
  followUpDate?: string;
}

export type LeadFormData = Omit<
  Lead,
  "id" | "userId" | "createdAt" | "updatedAt" | "followUpDone"
> & { followUpDone?: boolean; status?: string | null };

export type PropertyFormData = Omit<
  Property,
  "id" | "userId" | "createdAt" | "updatedAt"
>;

export type SpeechLanguage = "en-IN" | "hi-IN" | "pa-IN";
