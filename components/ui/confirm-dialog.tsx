"use client";

import { Button, Dialog, Portal, Text } from "@chakra-ui/react";
import { useState, type ReactNode } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Confirm",
  destructive,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);

  async function handle() {
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => {
        if (!e.open && !busy) onClose();
      }}
      placement="center"
      role="alertdialog"
    >
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.700" />
        <Dialog.Positioner>
          <Dialog.Content bg="panel" borderWidth="1px" borderColor="line" maxW="md" mx="4">
            <Dialog.Header>
              <Dialog.Title color="ink">{title}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Text fontSize="sm" color="muted">
                {body}
              </Text>
            </Dialog.Body>
            <Dialog.Footer gap="3">
              <Button variant="ghost" color="muted" onClick={onClose} disabled={busy}>
                Cancel
              </Button>
              <Button
                colorPalette={destructive ? "red" : "brand"}
                color={destructive ? "white" : "brand.contrast"}
                onClick={handle}
                loading={busy}
              >
                {confirmLabel}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
