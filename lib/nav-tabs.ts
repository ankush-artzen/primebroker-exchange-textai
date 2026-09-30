import { CircleUser, Home, LandPlot, Users } from "lucide-react";

export const navTabs = [
  { href: "/today", label: "Today", icon: Home },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/properties", label: "Properties", icon: LandPlot },
  { href: "/account", label: "Account", icon: CircleUser },
] as const;
