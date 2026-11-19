"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";

/**
 * Botão de envio com retorno imediato: ao clicar, fica desabilitado, mostra um indicador de carregamento
 * e não pode ser clicado duas vezes. Funciona dentro de qualquer <form action={...}>.
 */
export function BotaoEnviar({
  children,
  className = "",
  pendente,
  ...props
}: ComponentProps<"button"> & { pendente?: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      {...props}
      disabled={pending || props.disabled}
      aria-busy={pending || undefined}
      className={`inline-flex items-center justify-center gap-2 ${className}`}
    >
      {pending && <Carregando />}
      {pending && pendente ? pendente : children}
    </button>
  );
}

export function Carregando({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeOpacity=".25"
        strokeWidth="3"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
