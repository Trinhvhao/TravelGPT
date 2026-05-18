"use client";

import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from "./modal";
import { Button } from "./button";
import { AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  variant?: "danger" | "warning" | "default";
  loading?: boolean;
}

const VARIANT_COLORS = {
  danger: {
    primary: "#DC2626",
    bg: "rgba(220, 38, 38, 0.1)",
    hoverBg: "rgba(220, 38, 38, 0.15)",
  },
  warning: {
    primary: "#D97706",
    bg: "rgba(217, 119, 6, 0.1)",
    hoverBg: "rgba(217, 119, 6, 0.15)",
  },
  default: {
    primary: "#0046C1",
    bg: "rgba(0, 70, 193, 0.1)",
    hoverBg: "rgba(0, 70, 193, 0.15)",
  },
};

export function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  onConfirm,
  variant = "default",
  loading = false,
}: ConfirmModalProps) {
  const colors = VARIANT_COLORS[variant];

  const handleConfirm = () => {
    onConfirm();
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      onOpenChange(newOpen);
    }
  };

  return (
    <Modal open={open} onOpenChange={handleOpenChange}>
      <ModalContent size="sm" className="max-w-sm">
        <ModalHeader className="items-center text-center pb-2">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: colors.bg }}
          >
            <AlertTriangle className="w-7 h-7" style={{ color: colors.primary }} />
          </div>
          <ModalTitle className="text-center">{title}</ModalTitle>
          {description && (
            <ModalDescription className="text-center">{description}</ModalDescription>
          )}
        </ModalHeader>
        <ModalBody className="pt-4">
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              style={{ borderRadius: "12px", borderColor: "#DDDDDD" }}
            >
              {cancelText}
            </Button>
            <Button
              className="flex-1 text-white"
              onClick={handleConfirm}
              disabled={loading}
              style={{
                borderRadius: "12px",
                backgroundColor: colors.primary,
              }}
            >
              {loading ? "Đang xử lý..." : confirmText}
            </Button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
