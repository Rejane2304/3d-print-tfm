/**
 * Componente PhoneInput
 * Input de teléfono con formato automático (grupos de 3 dígitos)
 * Compatible con números españoles (9 dígitos) e internacionales
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
  placeholder = "612 345 678",
  required = false,
  disabled = false,
  className = ""
}: PhoneInputProps) {
  // Función para formatear el número
  const formatPhoneNumber = (input: string): string => {
    // Eliminar todo excepto dígitos
    const digits = input.replace(/\D/g, '');
    
    // Para números españoles (9 dígitos) o internacionales
    if (digits.length <= 9) {
      // Formato: XXX XXX XXX
      const groups = [];
      for (let i = 0; i < digits.length; i += 3) {
        groups.push(digits.slice(i, i + 3));
      }
      return groups.join(' ');
    } else {
      // Para números internacionales (más de 9 dígitos)
      // Detectar si empieza con prefijo internacional
      let formatted = '';
      let remaining = digits;
      
      // Si empieza con 34 (España) o +34
      if (digits.startsWith('34') && digits.length > 2) {
        formatted = '+34 ';
        remaining = digits.slice(2);
      } else if (digits.startsWith('0034') && digits.length > 4) {
        formatted = '+34 ';
        remaining = digits.slice(4);
      }
      
      // Agrupar el resto en grupos de 3
      const groups = [];
      for (let i = 0; i < remaining.length; i += 3) {
        groups.push(remaining.slice(i, i + 3));
      }
      
      return formatted + groups.join(' ');
    }
  };

  // Handler para el cambio
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    
    // Si el usuario está borrando, permitirlo
    if (rawValue.length < value.length) {
      // Eliminar el último carácter significativo
      const newValue = value.replace(/\s$/, '').slice(0, -1);
      onChange(newValue.replace(/\s/g, ''));
      return;
    }
    
    // Obtener solo los dígitos del nuevo valor
    const digits = rawValue.replace(/\D/g, '');
    
    // Limitar a 15 dígitos máximo (número internacional completo)
    const limitedDigits = digits.slice(0, 15);
    
    onChange(limitedDigits);
  };

  // Handler para keydown (manejar backspace en espacios)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && value.endsWith(' ')) {
      e.preventDefault();
      onChange(value.replace(/\s$/, '').slice(0, -1).replace(/\s/g, ''));
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
