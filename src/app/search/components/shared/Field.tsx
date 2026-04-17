'use client';

interface FieldProps {
  label: string;
  value: string;
  highlight?: boolean;
}

export default function Field({ label, value, highlight }: FieldProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500">{label}</label>
      <div
        className={`mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm font-mono ${
          highlight ? 'text-green-700 bg-green-50 border-green-200' : 'text-gray-800'
        }`}
      >
        {value}
      </div>
    </div>
  );
}
