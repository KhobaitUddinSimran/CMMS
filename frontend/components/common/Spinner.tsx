const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };

export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <div className={`${sizes[size]} border-2 border-[#E5E7EB] border-t-[#C90031] rounded-full animate-spin`} />
  );
}