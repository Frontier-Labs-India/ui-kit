/* Svelte twin of src/core/forms/form-context.tsx.
 *
 * Form fields (FormInput, Textarea, …) read the nearest form from context and,
 * when there is one, take their value, error and touched state from
 * form.getFieldProps(name). The shape is React's FormState, vendored from
 * form-types.ts, so any engine that implements it can provide the context.
 *
 * Svelte context is set during component initialisation, so a provider calls
 * setFormContext(form) in its <script>. Keep `form` reactive (a $state object
 * or getters over state): fields read getFieldProps inside $derived, so they
 * follow it only if the values behind it are reactive. */
import { getContext, setContext } from 'svelte'
import type { FormState } from '../vendor/core/forms/form-types.js'
import type { FieldConfig } from '../vendor/core/forms/create-form.js'

const FORM_KEY = Symbol('ui-kit.form')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyForm = FormState<any>

export function setFormContext<T extends Record<string, FieldConfig>>(form: FormState<T>): FormState<T> {
  return setContext(FORM_KEY, form)
}

/** The nearest form, or null outside one. */
export function getFormContextOptional<T extends Record<string, FieldConfig> = Record<string, FieldConfig>>(): FormState<T> | null {
  return (getContext<AnyForm | undefined>(FORM_KEY) ?? null) as FormState<T> | null
}

/** The nearest form; throws outside one, as React's useFormContext does. */
export function getFormContext<T extends Record<string, FieldConfig> = Record<string, FieldConfig>>(): FormState<T> {
  const form = getFormContextOptional<T>()
  if (!form) throw new Error('getFormContext must be used within a form context (setFormContext)')
  return form
}
