import React from 'react';
import { FailureCategory } from '../../types/domain';

interface FailureCategoryChipProps {
  category: FailureCategory | null;
  size?: 'sm' | 'md';
}

export const FailureCategoryChip: React.FC<FailureCategoryChipProps> = ({
  category,
  size = 'md',
}) => {
  if (!category) {
    return <span className="text-text-muted text-xs">—</span>;
  }

  const getConfig = (cat: FailureCategory) => {
    switch (cat) {
      case 'LOCATOR_DRIFT':
        return {
          label: 'Selector Drift',
          icon: 'near_me',
          classes: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
        };
      case 'UI_FUNCTIONAL_REGRESSION':
        return {
          label: 'UI Regression',
          icon: 'broken_image',
          classes: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
        };
      case 'API_FAILURE':
        return {
          label: 'API Failure',
          icon: 'cloud_off',
          classes: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30',
        };
      case 'CONTRACT_MISMATCH':
        return {
          label: 'Contract Mismatch',
          icon: 'difference',
          classes: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
        };
      case 'ASSERTION_FAILURE':
        return {
          label: 'Assertion Failed',
          icon: 'rule',
          classes: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
        };
      case 'ENVIRONMENT_FAILURE':
        return {
          label: 'Environment Error',
          icon: 'dns',
          classes: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30',
        };
      case 'AMBIGUOUS_REQUIRES_REVIEW':
        return {
          label: 'Needs Review',
          icon: 'rate_review',
          classes: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
        };
      default:
        return {
          label: cat,
          icon: 'warning',
          classes: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30',
        };
    }
  };

  const config = getConfig(category);
  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-lg border font-medium ${sizeClasses} ${config.classes}`}
    >
      <span className="material-symbols-outlined text-[14px] shrink-0">
        {config.icon}
      </span>
      <span>{config.label}</span>
    </span>
  );
};
