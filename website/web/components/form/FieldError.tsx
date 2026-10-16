/**
 * Единый вид ошибки поля. Рендерится только когда есть текст, а id совпадает
 * с тем, на который ссылается aria-describedby у самого поля.
 */

export interface FieldErrorProps {
  id: string;
  message?: string | null;
}

export function FieldError({ id, message }: FieldErrorProps) {
  if (!message) return null;
  return (
    <p className="field-error" id={id} role="alert">
      {message}
    </p>
  );
}
