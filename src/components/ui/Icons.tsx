type P = { className?: string };
const base = "fill-none stroke-current stroke-[1.8]";

export const CartIcon = ({ className = "size-5" }: P) => (
  <svg viewBox="0 0 24 24" className={`${base} ${className}`} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="20" r="1.4" />
    <circle cx="18" cy="20" r="1.4" />
    <path d="M2.5 3.5h2.6l2.3 11.2a1.8 1.8 0 0 0 1.8 1.4h8.5a1.8 1.8 0 0 0 1.7-1.3l1.8-6.3H6.3" />
  </svg>
);

export const UserIcon = ({ className = "size-5" }: P) => (
  <svg viewBox="0 0 24 24" className={`${base} ${className}`} strokeLinecap="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20.5c1.4-3.6 4.4-5.5 8-5.5s6.6 1.9 8 5.5" />
  </svg>
);

export const SearchIcon = ({ className = "size-5" }: P) => (
  <svg viewBox="0 0 24 24" className={`${base} ${className}`} strokeLinecap="round">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export const TruckIcon = ({ className = "size-6" }: P) => (
  <svg viewBox="0 0 24 24" className={`${base} ${className}`} strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 6h11v10H2zM13 9h4.5l3.5 3.5V16h-8" />
    <circle cx="6.5" cy="17.5" r="1.8" />
    <circle cx="17" cy="17.5" r="1.8" />
  </svg>
);

export const ShieldIcon = ({ className = "size-6" }: P) => (
  <svg viewBox="0 0 24 24" className={`${base} ${className}`} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8 7.5 9.5 4.3-1.5 7.5-4.9 7.5-9.5V6z" />
    <path d="m8.8 12 2.2 2.2 4.3-4.4" />
  </svg>
);

export const ChipIcon = ({ className = "size-6" }: P) => (
  <svg viewBox="0 0 24 24" className={`${base} ${className}`} strokeLinecap="round">
    <rect x="6" y="6" width="12" height="12" rx="2" />
    <path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" />
  </svg>
);
