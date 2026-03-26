export type StrengthLevel = 'weak' | 'medium' | 'strong' | 'very-strong';

export function getStrength(password: string): StrengthLevel {
  if (password.length < 8) return 'weak';
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);
  const isPureDigits = /^\d+$/.test(password);
  const isPureLetters = /^[a-zA-Z]+$/.test(password);
  if (isPureDigits || isPureLetters) return 'weak';
  const allFour = hasLower && hasUpper && hasDigit && hasSymbol;
  if (password.length >= 16 && allFour) return 'very-strong';
  if (password.length >= 12 && allFour) return 'strong';
  if (password.length >= 8 && (hasLower || hasUpper) && hasDigit) return 'medium';
  return 'weak';
}

interface Props {
  password: string;
  t: (key: string) => string;
}

const config = {
  'weak':       { key: 'weak',       color: 'bg-red-500',     text: 'text-red-400',     bars: 1 },
  'medium':     { key: 'medium',     color: 'bg-amber-400',   text: 'text-amber-400',   bars: 2 },
  'strong':     { key: 'strong',     color: 'bg-emerald-500', text: 'text-emerald-400', bars: 3 },
  'very-strong':{ key: 'very_strong', color: 'bg-primary',     text: 'text-primary',     bars: 4 },
};

export default function PasswordStrength({ password, t }: Props) {
  if (!password) return null;
  const level = getStrength(password);
  const { key, color, text, bars } = config[level];
  const label = t(`strength.${key}`);
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-200 ${i <= bars ? color : 'bg-muted'}`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${text}`}>{label}</p>
    </div>
  );
}
