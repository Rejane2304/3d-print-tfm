/**
 * Password Strength Component
 * Displays real-time password strength with visual indicators
 */
"use client";

import { useMemo } from "react";
import { Check, X, Shield, ShieldAlert, ShieldCheck } from "lucide-react";

interface PasswordStrengthProps {
  password: string;
}

// Common passwords to check against
const commonPasswords = [
  "password",
  "123456",
  "12345678",
  "1234567890",
  "qwerty",
  "qwerty123",
  "admin",
  "admin123",
  "letmein",
  "welcome",
  "monkey",
  "dragon",
  "baseball",
  "football",
  "superman",
  "batman",
  "master",
  "login",
  "abc123",
  "password123",
  "123123",
  "111111",
  "000000",
  "iloveyou",
  "trustno1",
  "sunshine",
  "princess",
  "starwars",
];

interface Requirement {
  id: string;
  label: string;
  met: boolean;
}

interface PasswordAnalysis {
  strength: number;
  requirements: Requirement[];
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
  isCommon: boolean;
  hasRepeatedChars: boolean;
}

export function calculatePasswordStrength(password: string): PasswordAnalysis {
  const requirements: Requirement[] = [];

  // Check minimum 10 characters
  const hasMinLength = password.length >= 10;
  requirements.push({
    id: "minLength",
    label: "Mínimo 10 caracteres",
    met: hasMinLength,
  });

  // Check uppercase
  const hasUppercase = /[A-Z]/.test(password);
  requirements.push({
    id: "uppercase",
    label: "Al menos 1 mayúscula",
    met: hasUppercase,
  });

  // Check lowercase
  const hasLowercase = /[a-z]/.test(password);
  requirements.push({
    id: "lowercase",
    label: "Al menos 1 minúscula",
    met: hasLowercase,
  });

  // Check number
  const hasNumber = /[0-9]/.test(password);
  requirements.push({
    id: "number",
    label: "Al menos 1 número",
    met: hasNumber,
  });

  // Check special symbol
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,./<>?]/.test(password);
  requirements.push({
    id: "symbol",
    label: "Al menos 1 símbolo especial",
    met: hasSymbol,
  });

  // Check common passwords
  const isCommon = commonPasswords.includes(password.toLowerCase());
  requirements.push({
    id: "notCommon",
    label: "No es una contraseña común",
    met: !isCommon,
  });

  // Check repeated characters (3+ consecutive same characters)
  const hasRepeatedChars = /(.)\1{2,}/.test(password);

  // Calculate strength score
  let strength = 0;

  // Base: length * 4 (max 40 points)
  strength += Math.min(password.length * 4, 40);

  // Bonus for character types
  if (hasUppercase) strength += 10;
  if (hasLowercase) strength += 10;
  if (hasNumber) strength += 10;
  if (hasSymbol) strength += 15;

  // Penalties
  if (isCommon) strength -= 50;
  if (hasRepeatedChars) strength -= 5;

  // Cap at 100
  strength = Math.max(0, Math.min(100, strength));

  return {
    strength,
    requirements,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSymbol,
    isCommon,
    hasRepeatedChars,
  };
}

function getStrengthColor(strength: number): {
  bg: string;
  text: string;
  bar: string;
} {
  if (strength <= 40) {
    return {
      bg: "bg-red-50 dark:bg-red-900/20",
      text: "text-red-600 dark:text-red-400",
      bar: "bg-red-500",
    };
  }
  if (strength <= 70) {
    return {
      bg: "bg-yellow-50 dark:bg-yellow-900/20",
      text: "text-yellow-600 dark:text-yellow-400",
      bar: "bg-yellow-500",
    };
  }
  return {
    bg: "bg-green-50 dark:bg-green-900/20",
    text: "text-green-600 dark:text-green-400",
    bar: "bg-green-500",
  };
}

function getStrengthLabel(strength: number): string {
  if (strength <= 40) return "Débil";
  if (strength <= 70) return "Media";
  return "Fuerte";
}

function getStrengthIcon(strength: number) {
  if (strength <= 40) {
    return <ShieldAlert className="h-5 w-5 text-red-500" />;
  }
  if (strength <= 70) {
    return <Shield className="h-5 w-5 text-yellow-500" />;
  }
  return <ShieldCheck className="h-5 w-5 text-green-500" />;
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  const analysis = useMemo(
    () => calculatePasswordStrength(password),
    [password],
  );
  const colors = getStrengthColor(analysis.strength);

  // Don't render if password is empty
  if (!password) {
    return null;
  }

  return (
    <div className="mt-3 space-y-3">
      {/* Progress bar section */}
      <div
        className={`p-3 rounded-lg ${colors.bg} transition-colors duration-300`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {getStrengthIcon(analysis.strength)}
            <span className={`text-sm font-medium ${colors.text}`}>
              Fortaleza: {getStrengthLabel(analysis.strength)}
            </span>
          </div>
          <span className={`text-sm font-bold ${colors.text}`}>
            {analysis.strength}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${colors.bar} transition-all duration-300 ease-out`}
            style={{ width: `${analysis.strength}%` }}
            role="progressbar"
            aria-valuenow={analysis.strength}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Fortaleza de contraseña: ${analysis.strength}%`}
          />
        </div>
      </div>

      {/* Requirements checklist */}
      <div className="space-y-1.5">
        {analysis.requirements.map((req) => (
          <div
            key={req.id}
            className={`flex items-center gap-2 text-sm transition-colors duration-200 ${
              req.met
                ? "text-green-600 dark:text-green-400"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            <span
              className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center transition-all duration-200 ${
                req.met
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-400"
              }`}
            >
              {req.met ? (
                <Check className="h-3 w-3" strokeWidth={3} />
              ) : (
                <X className="h-3 w-3" strokeWidth={3} />
              )}
            </span>
            <span className={req.met ? "font-medium" : ""}>{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Export helper to check if password meets all requirements
export function isPasswordValid(password: string): boolean {
  const analysis = calculatePasswordStrength(password);
  return analysis.requirements.every((req) => req.met);
}
