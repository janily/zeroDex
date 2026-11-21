import { useLayoutEffect, useRef, type ReactNode } from "react";
import "./overlays.css";

type ModalProps = {
  variant: "dialog" | "drawer";
  labelledBy: string;
  onClose: () => void;
  dismissOnBackdrop?: boolean;
  children: ReactNode;
};

export function Modal({ variant, labelledBy, onClose, dismissOnBackdrop, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useLayoutEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={ref}
      className={`dex-modal dex-modal-${variant}`}
      aria-labelledby={labelledBy}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onPointerDown={(event) => {
        if (!dismissOnBackdrop || event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
          onClose();
        }
      }}
    >
      {children}
    </dialog>
  );
}
