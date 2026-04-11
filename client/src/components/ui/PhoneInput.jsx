import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

const COUNTRIES = [
  { name: 'United Arab Emirates', code: '+971', iso: 'AE', flag: '🇦🇪' },
  { name: 'Saudi Arabia', code: '+966', iso: 'SA', flag: '🇸🇦' },
  { name: 'India', code: '+91', iso: 'IN', flag: '🇮🇳' },
  { name: 'United States', code: '+1', iso: 'US', flag: '🇺🇸' },
  { name: 'United Kingdom', code: '+44', iso: 'UK', flag: '🇬🇧' },
  { name: 'Qatar', code: '+974', iso: 'QA', flag: '🇶🇦' },
  { name: 'Bahrain', code: '+973', iso: 'BH', flag: '🇧🇭' },
  { name: 'Oman', code: '+968', iso: 'OM', flag: '🇴🇲' },
  { name: 'Kuwait', code: '+965', iso: 'KW', flag: '🇰🇼' },
  { name: 'Germany', code: '+49', iso: 'DE', flag: '🇩🇪' },
  { name: 'France', code: '+33', iso: 'FR', flag: '🇫🇷' },
  { name: 'China', code: '+86', iso: 'CN', flag: '🇨🇳' },
  { name: 'Japan', code: '+81', iso: 'JP', flag: '🇯🇵' },
  { name: 'Singapore', code: '+65', iso: 'SG', flag: '🇸🇬' },
  { name: 'Australia', code: '+61', iso: 'AU', flag: '🇦🇺' },
  { name: 'Canada', code: '+1', iso: 'CA', flag: '🇨🇦' },
  { name: 'Brazil', code: '+55', iso: 'BR', flag: '🇧🇷' },
  { name: 'South Korea', code: '+82', iso: 'KR', flag: '🇰🇷' },
  { name: 'Netherlands', code: '+31', iso: 'NL', flag: '🇳🇱' },
  { name: 'Switzerland', code: '+41', iso: 'CH', flag: '🇨🇭' },
  { name: 'Ireland', code: '+353', iso: 'IE', flag: '🇮🇪' },
  { name: 'Hong Kong', code: '+852', iso: 'HK', flag: '🇭🇰' },
  { name: 'Malaysia', code: '+60', iso: 'MY', flag: '🇲🇾' },
  { name: 'Indonesia', code: '+62', iso: 'ID', flag: '🇮🇩' },
  { name: 'Thailand', code: '+66', iso: 'TH', flag: '🇹🇭' },
  { name: 'Pakistan', code: '+92', iso: 'PK', flag: '🇵🇰' },
  { name: 'Turkey', code: '+90', iso: 'TR', flag: '🇹🇷' },
  { name: 'Egypt', code: '+20', iso: 'EG', flag: '🇪🇬' },
  { name: 'South Africa', code: '+27', iso: 'ZA', flag: '🇿🇦' },
  { name: 'Nigeria', code: '+234', iso: 'NG', flag: '🇳🇬' },
  { name: 'Kenya', code: '+254', iso: 'KE', flag: '🇰🇪' },
  { name: 'Israel', code: '+972', iso: 'IL', flag: '🇮🇱' },
  { name: 'Jordan', code: '+962', iso: 'JO', flag: '🇯🇴' },
  { name: 'Lebanon', code: '+961', iso: 'LB', flag: '🇱🇧' },
  { name: 'Iraq', code: '+964', iso: 'IQ', flag: '🇮🇶' },
  { name: 'Italy', code: '+39', iso: 'IT', flag: '🇮🇹' },
  { name: 'Spain', code: '+34', iso: 'ES', flag: '🇪🇸' },
  { name: 'Sweden', code: '+46', iso: 'SE', flag: '🇸🇪' },
  { name: 'Norway', code: '+47', iso: 'NO', flag: '🇳🇴' },
  { name: 'Denmark', code: '+45', iso: 'DK', flag: '🇩🇰' },
  { name: 'Finland', code: '+358', iso: 'FI', flag: '🇫🇮' },
  { name: 'Poland', code: '+48', iso: 'PL', flag: '🇵🇱' },
  { name: 'Portugal', code: '+351', iso: 'PT', flag: '🇵🇹' },
  { name: 'Mexico', code: '+52', iso: 'MX', flag: '🇲🇽' },
  { name: 'Argentina', code: '+54', iso: 'AR', flag: '🇦🇷' },
  { name: 'Colombia', code: '+57', iso: 'CO', flag: '🇨🇴' },
  { name: 'Chile', code: '+56', iso: 'CL', flag: '🇨🇱' },
  { name: 'Philippines', code: '+63', iso: 'PH', flag: '🇵🇭' },
  { name: 'Vietnam', code: '+84', iso: 'VN', flag: '🇻🇳' },
  { name: 'Bangladesh', code: '+880', iso: 'BD', flag: '🇧🇩' },
  { name: 'New Zealand', code: '+64', iso: 'NZ', flag: '🇳🇿' },
  { name: 'Russia', code: '+7', iso: 'RU', flag: '🇷🇺' },
  { name: 'Ukraine', code: '+380', iso: 'UA', flag: '🇺🇦' },
];

/**
 * Parse a combined phone string like "+971501234567" into { countryCode, phoneNumber }
 */
function parsePhone(value) {
  if (!value) return { countryCode: '+971', phoneNumber: '' };
  const str = String(value).trim();
  if (!str.startsWith('+')) return { countryCode: '+971', phoneNumber: str };

  // Try to match against known country codes (longest first)
  const sorted = [...COUNTRIES].sort((a, b) => b.code.length - a.code.length);
  for (const c of sorted) {
    if (str.startsWith(c.code)) {
      return { countryCode: c.code, phoneNumber: str.slice(c.code.length) };
    }
  }
  return { countryCode: '+971', phoneNumber: str };
}

/**
 * Reusable PhoneInput component with country code dropdown.
 *
 * Props:
 *   label, error, required, className — same as Input
 *   value   — combined string like "+971501234567" OR { countryCode, phoneNumber }
 *   onChange — called with combined string "+971501234567"
 *   name    — optional, passed to synthetic event-like onChange
 */
export default function PhoneInput({
  label,
  error,
  required = false,
  className = '',
  value = '',
  onChange,
  name,
}) {
  const parsed = typeof value === 'object' && value !== null
    ? { countryCode: value.countryCode || '+971', phoneNumber: value.phoneNumber || '' }
    : parsePhone(value);

  const [countryCode, setCountryCode] = useState(parsed.countryCode);
  const [phoneNumber, setPhoneNumber] = useState(parsed.phoneNumber);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);

  // Sync from external value changes
  useEffect(() => {
    const p = typeof value === 'object' && value !== null
      ? { countryCode: value.countryCode || '+971', phoneNumber: value.phoneNumber || '' }
      : parsePhone(value);
    setCountryCode(p.countryCode);
    setPhoneNumber(p.phoneNumber);
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const emit = (code, phone) => {
    const combined = `${code}${phone}`;
    if (onChange) {
      // Emit as synthetic event-like object for compatibility with form handlers
      if (name) {
        onChange({ target: { name, value: combined, type: 'text' } });
      } else {
        onChange(combined);
      }
    }
  };

  const handleCodeSelect = (code) => {
    setCountryCode(code);
    setOpen(false);
    setSearch('');
    emit(code, phoneNumber);
  };

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setPhoneNumber(val);
    emit(countryCode, val);
  };

  const selectedCountry = COUNTRIES.find((c) => c.code === countryCode) || COUNTRIES[0];
  const filtered = COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.includes(search) ||
    c.iso.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-[var(--color-text)]">
          {label}
          {required && <span className="text-[var(--color-error)] ml-0.5">*</span>}
        </label>
      )}
      <div className="flex gap-0">
        {/* Country code dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className={`
              flex items-center gap-1 h-10 px-2.5 rounded-l-[var(--radius-md)] border text-sm
              bg-gray-50 border-r-0 transition-colors whitespace-nowrap
              ${error
                ? 'border-[var(--color-error)]'
                : 'border-[var(--color-border)] hover:bg-gray-100'
              }
            `}
          >
            <span>{selectedCountry.flag}</span>
            <span className="text-xs text-gray-600">{countryCode}</span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>

          {open && (
            <div className="absolute top-full left-0 mt-1 w-64 max-h-60 overflow-y-auto bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-lg z-50">
              <div className="sticky top-0 bg-white p-2 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-2 h-8 px-2 bg-gray-50 rounded text-sm">
                  <Search className="w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search country..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-transparent outline-none flex-1 text-sm"
                    autoFocus
                  />
                </div>
              </div>
              {filtered.map((c) => (
                <button
                  key={c.iso}
                  type="button"
                  onClick={() => handleCodeSelect(c.code)}
                  className={`
                    w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors
                    ${c.code === countryCode ? 'bg-blue-50 text-[var(--color-primary)]' : ''}
                  `}
                >
                  <span>{c.flag}</span>
                  <span className="flex-1">{c.name}</span>
                  <span className="text-xs text-gray-400">{c.code}</span>
                </button>
              ))}
              {filtered.length === 0 && <p className="px-3 py-2 text-sm text-gray-400">No results</p>}
            </div>
          )}
        </div>

        {/* Phone number input */}
        <input
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneChange}
          placeholder="Enter phone number"
          className={`
            flex-1 h-10 px-3 rounded-r-[var(--radius-md)] border text-sm
            bg-white transition-colors outline-none min-w-0
            ${error
              ? 'border-[var(--color-error)] focus:ring-2 focus:ring-red-100'
              : 'border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-blue-100'
            }
          `}
        />
      </div>
      {error && <p className="text-xs text-[var(--color-error)]">{error}</p>}
    </div>
  );
}

export { COUNTRIES, parsePhone };
