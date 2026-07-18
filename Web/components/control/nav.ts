// Single source of truth for Control Center navigation — consumed by the
// sidebar and the command palette.

export interface NavItem {
  href: string;
  label: string;
  hint?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Vue d'ensemble",
    items: [
      { href: "/", label: "Dashboard", hint: "KPIs, workflows actifs, activité" },
      { href: "/workflows", label: "Workflows", hint: "Toutes les exécutions de la pipeline" },
      { href: "/queue", label: "File d'attente", hint: "Task Queue du moteur" },
      { href: "/logs", label: "Logs & événements", hint: "Event Bus, logs des étapes" },
    ],
  },
  {
    title: "Pipeline",
    items: [
      { href: "/trends", label: "Trend Discovery" },
      { href: "/market", label: "Market Analysis" },
      { href: "/scoring", label: "Opportunity Scoring" },
      { href: "/planner", label: "Product Planner" },
      { href: "/generator", label: "Product Generator" },
      { href: "/images", label: "Image Generator" },
      { href: "/mockups", label: "Mockup Generator" },
      { href: "/seo", label: "SEO Generator" },
      { href: "/qa", label: "Quality Assurance" },
      { href: "/validation", label: "Validation", hint: "Point de contrôle humain" },
      { href: "/publishing", label: "Publishing" },
    ],
  },
  {
    title: "Insights",
    items: [
      { href: "/analytics", label: "Analytics" },
      { href: "/learning", label: "Learning" },
    ],
  },
  {
    title: "Système",
    items: [
      { href: "/assets", label: "Assets (R2)" },
      { href: "/mcp", label: "MCP" },
      { href: "/config", label: "Configuration" },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);
