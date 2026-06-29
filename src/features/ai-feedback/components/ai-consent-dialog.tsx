"use client";

import { Check, LoaderCircle, ShieldCheck, X } from "lucide-react";
import { useEffect, useRef } from "react";

import { zhCN } from "@/i18n/messages/zh-CN";

interface AiConsentDialogProps {
  errorMessage: string | null;
  open: boolean;
  saving: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function AiConsentDialog({
  errorMessage,
  open,
  saving,
  onAccept,
  onDecline,
}: AiConsentDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      aria-labelledby="ai-consent-title"
      className="confirm-dialog ai-consent-dialog"
      onCancel={(event) => {
        event.preventDefault();
        if (!saving) {
          onDecline();
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !saving) {
          event.preventDefault();
          onDecline();
        }
      }}
      ref={dialogRef}
    >
      <div className="confirm-dialog-content">
        <div className="confirm-dialog-icon" aria-hidden="true">
          <ShieldCheck size={22} />
        </div>
        <div>
          <h2 id="ai-consent-title">{zhCN.aiFeedback.consent.title}</h2>
          <p>{zhCN.aiFeedback.consent.body}</p>
          <p className="ai-consent-optional">
            {zhCN.aiFeedback.consent.optional}
          </p>
        </div>
      </div>

      <ul className="ai-consent-data-list">
        {zhCN.aiFeedback.consent.dataItems.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      {errorMessage && (
        <p className="form-error" role="alert">
          {errorMessage}
        </p>
      )}

      <div className="dialog-actions">
        <button
          className="secondary-button"
          disabled={saving}
          onClick={onDecline}
          type="button"
        >
          <X aria-hidden="true" size={18} />
          {zhCN.aiFeedback.consent.decline}
        </button>
        <button
          className="primary-button"
          disabled={saving}
          onClick={onAccept}
          type="button"
        >
          {saving ? (
            <LoaderCircle
              aria-hidden="true"
              className="button-spinner"
              size={18}
            />
          ) : (
            <Check aria-hidden="true" size={18} />
          )}
          {saving
            ? zhCN.aiFeedback.consent.saving
            : zhCN.aiFeedback.consent.accept}
        </button>
      </div>
    </dialog>
  );
}
