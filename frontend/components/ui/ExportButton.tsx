"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/Button";

type ExportButtonProps = {
  label?: string;
  onExport: () => void;
  disabled?: boolean;
};

export function ExportButton({
  label = "Export CSV",
  onExport,
  disabled = false,
}: ExportButtonProps) {
  return (
    <Button
      variant="ghost"
      onClick={onExport}
      disabled={disabled}
      className="gap-2 text-xs"
    >
      <Download className="h-3.5 w-3.5" aria-hidden />
      {label}
    </Button>
  );
}
