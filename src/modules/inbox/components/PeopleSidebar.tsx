import React, { useMemo, useState } from 'react';
import { Input } from '@/shared/components/ui/input';
import { Search, Users, Unlink } from 'lucide-react';
import { useCustomersList, type Customer } from '@/modules/customers/hooks/useCustomers';

function getPersonDisplayName(c: Customer): string {
  const name = [c.first_name, c.last_name].filter(Boolean).join(' ').trim();
  return name || c.email || c.phone || '—';
}

interface PeopleSidebarProps {
  selectedPersonId: string | null;
  onSelectPerson: (personId: string | null) => void;
}

export const PeopleSidebar: React.FC<PeopleSidebarProps> = ({ selectedPersonId, onSelectPerson }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: customers = [], isLoading } = useCustomersList();

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        (c.first_name?.toLowerCase().includes(q) ?? false) ||
        (c.last_name?.toLowerCase().includes(q) ?? false) ||
        (c.email?.toLowerCase().includes(q) ?? false) ||
        (c.phone?.toLowerCase().includes(q) ?? false)
    );
  }, [customers, searchQuery]);

  return (
    <div className="flex flex-col h-full border-r bg-slate-50/50 w-56 shrink-0">
      <div className="p-2 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search people..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <button
          type="button"
          onClick={() => onSelectPerson(null)}
          className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-100 ${
            selectedPersonId === null ? 'bg-blue-50 text-blue-700 font-medium' : ''
          }`}
        >
          <Unlink className="h-4 w-4 shrink-0" />
          Unlinked
        </button>
        {isLoading ? (
          <div className="px-3 py-4 text-sm text-slate-500">Loading...</div>
        ) : (
          <div className="py-1">
            {filteredCustomers.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelectPerson(c.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-100 truncate ${
                  selectedPersonId === c.id ? 'bg-blue-50 text-blue-700 font-medium' : ''
                }`}
              >
                <Users className="h-4 w-4 shrink-0" />
                <span className="truncate">{getPersonDisplayName(c)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
