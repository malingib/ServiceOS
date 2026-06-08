import { z } from 'zod';
import { useForm, UseFormProps, UseFormReturn, FieldValues, DefaultValues, FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export type { UseFormReturn, FieldErrors };

export function useZodForm<T extends FieldValues>(
  schema: z.ZodSchema<T>,
  options?: Omit<UseFormProps<T>, 'resolver'> & {
    defaultValues?: DefaultValues<T>;
  },
): UseFormReturn<T> {
  return useForm<T>({
    ...options,
    resolver: zodResolver(schema),
    mode: options?.mode || 'onSubmit',
    reValidateMode: options?.reValidateMode || 'onChange',
  });
}

export function createFormSchema<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape);
}

export type InferFormSchema<T extends z.ZodType> = z.infer<T>;

export function getFieldError<T extends FieldValues>(
  errors: FieldErrors<T>,
  fieldName: string,
): string | undefined {
  const keys = fieldName.split('.');
  let current: unknown = errors;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  if (current && typeof current === 'object' && 'message' in (current as Record<string, unknown>)) {
    return (current as { message?: string }).message;
  }
  return undefined;
}

export function isFormValid(errors: FieldErrors): boolean {
  return Object.keys(errors).length === 0;
}

export function formatZodErrors(error: z.ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!formatted[path]) formatted[path] = [];
    formatted[path].push(err.message);
  });
  return formatted;
}

export type FormFieldProps = {
  name: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  description?: string;
};

export interface SelectOption {
  label: string;
  value: string;
}

export type { FieldValues, DefaultValues };
