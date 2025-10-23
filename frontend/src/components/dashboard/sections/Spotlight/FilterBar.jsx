import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const filterOptions = {
  post_type: [
    { value: 'all', label: 'All Types' },
    { value: 'update', label: 'Case Updates' },
    { value: 'memorial', label: 'Memorial' },
    { value: 'appeal', label: 'Public Appeals' },
    { value: 'news', label: 'News' },
    { value: 'evidence', label: 'Evidence' }
  ],
  priority: [
    { value: 'all', label: 'All Priorities' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ]
};

export default function FilterBar({ filters, onFilterChange, onClearFilters }) {
  const activeFiltersCount = Object.values(filters).filter(f => f !== 'all').length;

  return (
    <div className="flex flex-wrap items-center gap-4 mb-8">
      <div className="flex items-center gap-3">
        <Filter className="w-5 h-5 text-slate-500" />
        <span className="font-medium text-slate-700">Filter by:</span>
      </div>
      
      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="rounded-full">
              Type: {filterOptions.post_type.find(opt => opt.value === filters.post_type)?.label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {filterOptions.post_type.map((option) => (
              <DropdownMenuItem 
                key={option.value}
                onClick={() => onFilterChange('post_type', option.value)}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="rounded-full">
              Priority: {filterOptions.priority.find(opt => opt.value === filters.priority)?.label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {filterOptions.priority.map((option) => (
              <DropdownMenuItem 
                key={option.value}
                onClick={() => onFilterChange('priority', option.value)}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="rounded-full">
            {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-6 w-6 p-0 rounded-full"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}