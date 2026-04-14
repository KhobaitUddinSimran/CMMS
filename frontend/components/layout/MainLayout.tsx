// Main Layout - Wrapper for authenticated pages
export const MainLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <div className="main-layout">{children}</div>
}
