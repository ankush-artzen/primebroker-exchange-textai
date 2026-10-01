import { CircleUser, Home, LandPlot, Shield, Users } from "lucide-react";

export function getNavTabs(showUsers: boolean, includeCrm = true) {
  return [
    ...(includeCrm
      ? [
          { href: "/today", label: "Today", icon: Home },
          { href: "/leads", label: "Leads", icon: Users },
          { href: "/properties", label: "Properties", icon: LandPlot },
        ]
      : []),
    ...(showUsers ? [{ href: "/users", label: "Users", icon: Shield }] : []),
    { href: "/account", label: "Account", icon: CircleUser },
  ];
}
