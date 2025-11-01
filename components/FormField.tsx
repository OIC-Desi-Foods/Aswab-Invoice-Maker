
import React from 'react';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const isUrdu = (str: any): boolean => typeof str === 'string' && /[\u0600-\u06FF]/.test(str);

const FormField: React.FC<FormFieldProps> = ({ label, id, ...props }) => {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-[var(--color-main-text)] opacity-90">
        {label}
      </label>
      <input
        id={inputId}
        {...props}
        className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm bg-gray-50 dark:bg-gray-700 text-[var(--color-main-text)] ${isUrdu(props.value) ? 'urdu-text' : ''}`}
      />
    </div>
  );
};

export default FormField;
