/**
 * Operational status values for map filtering
 * These represent operational readiness states for job planning
 */
export const OPERATIONAL_STATUSES = [
  'planned',
  'in_progress',
  'ready_for_installation',
] as const;

export type OperationalStatus = typeof OPERATIONAL_STATUSES[number];

/**
 * Human-readable labels for operational statuses
 */
export const STATUS_LABELS: Record<OperationalStatus, string> = {
  planned: 'Planned',
  in_progress: 'In Progress',
  ready_for_installation: 'Ready for Installation',
};

/**
 * Map database stone_status to operational status
 * 
 * @param stoneStatus - Database stone_status value ('NA', 'Ordered', 'In Stock')
 * @returns Operational status for map filtering
 */
export function mapStoneStatusToOperational(stoneStatus: string): OperationalStatus {
  switch (stoneStatus) {
    case 'NA':
      return 'planned';
    case 'Ordered':
      return 'in_progress';
    case 'In Stock':
      return 'ready_for_installation';
    default:
      return 'planned'; // Default fallback
  }
}

