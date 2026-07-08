import React from 'react';

/**
 * Skeleton loading component with a shimmer effect
 * typically used by large companies like Facebook, LinkedIn, etc.
 */
const Skeleton = ({ className = '', variant = 'rectangular', ...props }) => {
  const baseClasses = 'relative overflow-hidden bg-surface-variant/40';
  
  const variantClasses = {
    rectangular: 'rounded-md',
    circular: 'rounded-full',
    text: 'rounded-sm h-4 w-full',
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant] || variantClasses.rectangular} ${className}`}
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_1.5s_infinite]"></div>
    </div>
  );
};

export default Skeleton;
