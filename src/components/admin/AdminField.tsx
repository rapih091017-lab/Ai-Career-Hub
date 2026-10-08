"use client";

import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from "react";
import { adminErrorClass, adminHintClass, adminLabelClass } from "./ui";

type ControlProps = {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};

interface AdminFieldProps {
  label: string;
  /** Teks bantuan di bawah kontrol; disembunyikan bila ada error. */
  hint?: string;
  error?: string | null;
  required?: boolean;
  /** Elemen opsional di kanan label, mis. penghitung karakter. */
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}

/**
 * Pembungkus field form panel admin.
 *
 * Menyatukan label, petunjuk, dan pesan error supaya semua form punya
 * ritme yang sama. `useId` + `cloneElement` menyambungkan `htmlFor`,
 * `aria-describedby`, dan `aria-invalid` ke kontrol di dalamnya, sehingga
 * field tetap terbaca pembaca layar tanpa setiap halaman mengurus id manual.
 */
export default function AdminField({
  label,
  hint,
  error,
  required,
  aside,
  className = "",
  children,
}: AdminFieldProps) {
  const reactId = useId();
  const generatedId = `${reactId}field`;
  const hintId = `${reactId}hint`;
  const errorId = `${reactId}err`;

  const childProps = isValidElement(children) ? (children.props as ControlProps) : null;
  const controlId = childProps?.id ?? generatedId;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;

  const control =
    childProps !== null
      ? cloneElement(children as ReactElement<ControlProps>, {
          id: controlId,
          "aria-describedby": describedBy,
          "aria-invalid": error ? true : undefined,
        })
      : children;

  return (
    <div className={className}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={controlId} className={adminLabelClass}>
          {label}
          {required ? (
            <span className="ml-0.5 text-error" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
        {aside}
      </div>

      {control}

      {error ? (
        <p id={errorId} className={adminErrorClass} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className={adminHintClass}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
