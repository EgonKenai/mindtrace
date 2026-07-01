"use client";

import { LoaderCircle, Trash2, X } from "lucide-react";
import { useEffect, useReducer, useRef, useState } from "react";

import { deleteDialogReducer } from "@/features/journal/form-state";
import { useMessages } from "@/i18n/use-messages";

interface DeleteEntryDialogProps {
  onConfirm: () => Promise<void>;
}

export function DeleteEntryDialog({ onConfirm }: DeleteEntryDialogProps) {
  const messages = useMessages();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, dispatch] = useReducer(deleteDialogReducer, {
    open: false,
    deleting: false,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (state.open && !dialog.open) {
      dialog.showModal();
    } else if (!state.open && dialog.open) {
      dialog.close();
    }
  }, [state.open]);

  async function confirmDelete() {
    if (state.deleting) {
      return;
    }

    setErrorMessage(null);
    dispatch({ type: "confirm" });

    try {
      await onConfirm();
      dispatch({ type: "finish" });
    } catch {
      setErrorMessage(messages.journal.errors.deleteFailed);
      dispatch({ type: "failure" });
    }
  }

  return (
    <>
      <button
        className="danger-button"
        onClick={() => {
          setErrorMessage(null);
          dispatch({ type: "open" });
        }}
        type="button"
      >
        <Trash2 aria-hidden="true" size={18} />
        {messages.journal.actions.delete}
      </button>

      <dialog
        aria-labelledby="delete-entry-title"
        className="confirm-dialog"
        onCancel={(event) => {
          event.preventDefault();
          dispatch({ type: "cancel" });
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape" && !state.deleting) {
            event.preventDefault();
            dispatch({ type: "cancel" });
          }
        }}
        ref={dialogRef}
      >
        <div className="confirm-dialog-content">
          <div className="confirm-dialog-icon" aria-hidden="true">
            <Trash2 size={22} />
          </div>
          <div>
            <h2 id="delete-entry-title">
              {messages.journal.deleteDialog.title}
            </h2>
            <p>{messages.journal.deleteDialog.body}</p>
          </div>
        </div>

        {errorMessage && (
          <p className="form-error" role="alert">
            {errorMessage}
          </p>
        )}

        <div className="dialog-actions">
          <button
            className="secondary-button"
            disabled={state.deleting}
            onClick={() => dispatch({ type: "cancel" })}
            type="button"
          >
            <X aria-hidden="true" size={18} />
            {messages.common.cancel}
          </button>
          <button
            className="danger-button"
            disabled={state.deleting}
            onClick={() => void confirmDelete()}
            type="button"
          >
            {state.deleting ? (
              <LoaderCircle
                aria-hidden="true"
                className="button-spinner"
                size={18}
              />
            ) : (
              <Trash2 aria-hidden="true" size={18} />
            )}
            {state.deleting
              ? messages.journal.deleteDialog.deleting
              : messages.journal.deleteDialog.confirm}
          </button>
        </div>
      </dialog>
    </>
  );
}
