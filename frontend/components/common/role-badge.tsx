import { ROLE_NAMES, ROLE_COLORS } from "@/lib/constants";
import type { RoleId } from "@/types/common.types";
import { cn } from "@/lib/utils";

interface RoleBadgeProps {
  roleId: RoleId | number;
  className?: string;
}

/** Color-coded role indicator chip (Student, Teacher, Parent, Admin) */
export function RoleBadge({ roleId, className }: RoleBadgeProps) {
  const validRoleId = (roleId in ROLE_NAMES ? roleId : 1) as RoleId;
  const name = ROLE_NAMES[validRoleId];
  const color = ROLE_COLORS[validRoleId];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider",
        className
      )}
      style={{
        color: color,
        backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
      }}
    >
      {name}
    </span>
  );
}
