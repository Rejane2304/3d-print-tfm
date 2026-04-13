/**
 * PhoneInput Component
 * Phone input with automatic formatting (groups of 3 digits)
 * Compatible with Spanish (9 digits) and international numbers
 */

import { Phone } from 'lucide-react';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function PhoneInput({
  value,
  onChange,
  placeholder = '612 345 678',
  required = false,
  disabled = false,
  className = '',
}: Readonly<PhoneInputProps>) {
  // Function to format the phone number
  const formatPhoneNumber = (input: string): string => {
    // Remove everything except digits
    const digits = input.replaceAll(/\D/g, '');

    // For Spanish numbers (9 digits) or international
    if (digits.length <= 9) {
      // Formato: XXX XXX XXX
      const groups = [];
      for (let i = 0; i < digits.length; i += 3) {
        groups.push(digits.slice(i, i + 3));
      }
      return groups.join(' ');
    } else {
      // For international numbers (more than 9 digits)
      // Detect if it starts with international prefix
      let formatted = '';
      let remaining = digits;

      // If it starts with 34 (Spain) or +34
      if (digits.startsWith('34') && digits.length > 2) {
        formatted = '+34 ';
        remaining = digits.slice(2);
      } else if (digits.startsWith('0034') && digits.length > 4) {
        formatted = '+34 ';
        remaining = digits.slice(4);
      }

      // Group the rest in sets of 3
      const groups = [];
      for (let i = 0; i < remaining.length; i += 3) {
        groups.push(remaining.slice(i, i + 3));
      }

      return formatted + groups.join(' ');
    }
  };

  // Handler for input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;

    // If user is deleting, allow it
    if (rawValue.length < value.length) {
      // Remove the last significant character
      const newValue = value.replace(/\s$/, '').slice(0, -1);
      onChange(newValue.replaceAll(/\s/g, ''));
      return;
    }

    // Get only digits from the new value
    const digits = rawValue.replaceAll(/\D/g, '');

    // Limit to maximum 15 digits (complete international number)
    const limitedDigits = digits.slice(0, 15);

    onChange(limitedDigits);
  };

  // Handler for keydown (handle backspace on spaces)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && value.endsWith(' ')) {
      e.preventDefault();
      onChange(value.replace(/\s$/, '').slice(0, -1).replaceAll(/\s/g, ''));
    }
  };

  return (
    <div className="relative">
      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
      <input
        type="tel"
        value={formatPhoneNumber(value)}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-500 ${className}`}
        maxLength={17} // +34 XXX XXX XXX (máximo)
      />
    </div>
  );
}
