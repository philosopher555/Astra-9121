import { useEffect, useRef, type ReactNode } from "react";

export function Modal({
  children,
  className,
  label,
  close,
}: {
  children: ReactNode;
  className: string;
  label: string;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`astra-modal ${className}`}
      aria-label={label}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      {children}
    </dialog>
  );
}
