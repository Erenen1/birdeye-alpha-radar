/**
 * types/declarations.d.ts
 * =======================
 * Ambient module declarations for packages that ship without bundled types.
 * lucide-react v0.378.0 is installed without its dist/ build artifacts,
 * so we declare it here as a workaround until the package is properly rebuilt.
 */
declare module "lucide-react" {
  import * as React from "react";

  export interface LucideProps extends React.SVGAttributes<SVGElement> {
    size?: number | string;
    strokeWidth?: number | string;
    absoluteStrokeWidth?: boolean;
    color?: string;
  }

  export type LucideIcon = React.ForwardRefExoticComponent<
    LucideProps & React.RefAttributes<SVGSVGElement>
  >;

  // Subset of icons used in this project
  export const Activity: LucideIcon;
  export const AlertTriangle: LucideIcon;
  export const Bell: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const ChevronUp: LucideIcon;
  export const Copy: LucideIcon;
  export const ExternalLink: LucideIcon;
  export const Search: LucideIcon;
  export const TrendingUp: LucideIcon;
  export const Wallet: LucideIcon;
  export const Zap: LucideIcon;
}
