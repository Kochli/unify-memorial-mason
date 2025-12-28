import React from 'react';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Label } from '@/shared/components/ui/label';
import { Button } from '@/shared/components/ui/button';
import { OPERATIONAL_STATUSES, STATUS_LABELS, type OperationalStatus } from '../utils/orderStatusMap';

interface StatusFilterControlProps {
  enabledStatuses: Set<OperationalStatus>;
  onStatusToggle: (status: OperationalStatus) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}

export const StatusFilterControl: React.FC<StatusFilterControlProps> = ({
  enabledStatuses,
  onStatusToggle,
  onSelectAll,
  onClearAll,
}) => {
  const allEnabled = OPERATIONAL_STATUSES.every(status => enabledStatuses.has(status));
  
  return (
    <div className="space-y-2 p-3 bg-white rounded-lg border shadow-sm mb-4">
      <div className="flex items-center justify-between mb-2">
        <Label className="text-sm font-semibold">Filter by Status</Label>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={onSelectAll} className="h-6 text-xs">
            All
          </Button>
          <Button variant="ghost" size="sm" onClick={onClearAll} className="h-6 text-xs">
            None
          </Button>
        </div>
      </div>
      {OPERATIONAL_STATUSES.map((status) => (
        <div key={status} className="flex items-center space-x-2">
          <Checkbox
            id={`status-${status}`}
            checked={enabledStatuses.has(status)}
            onCheckedChange={() => onStatusToggle(status)}
          />
          <Label
            htmlFor={`status-${status}`}
            className="text-sm font-normal cursor-pointer"
          >
            {STATUS_LABELS[status]}
          </Label>
        </div>
      ))}
    </div>
  );
};

