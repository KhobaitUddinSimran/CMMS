// Form Component - Form wrapper
export const Form: React.FC<{ children: React.ReactNode; onSubmit: (e: any) => void }> = ({
  children,
  onSubmit,
}) => <form onSubmit={onSubmit}>{children}</form>
