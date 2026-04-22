/**
 * LoadingSpinner Component
 * Spinner reutilizable con variantes de tamaño y color
 */
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white';
  fullPage?: boolean;
  text?: string;
}

export function LoadingSpinner({ size = 'md', color = 'primary', fullPage = false, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    white: 'text-white',
  };

  const spinner = (
    <div
      className={`animate-spin rounded-full border-2 border-current border-t-transparent ${sizeClasses[size]} ${colorClasses[color]}`}
    />
  );

  if (fullPage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        {spinner}
        {text && <p className="mt-4 text-gray-600">{text}</p>}
      </div>
    );
  }

  return spinner;
}
