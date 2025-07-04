"use client";

import { Sheet } from "react-modal-sheet";

// BottomSheet 컴포넌트
interface BottomSheetProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  children?: React.ReactNode;
}

export const BottomSheet = ({
  isOpen,
  setIsOpen,
  children,
}: BottomSheetProps) => {
  return (
    <Sheet
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      detent="content-height"
    >
      <Sheet.Container>
        <Sheet.Header />
        <Sheet.Content>
          <Sheet.Scroller>{children}</Sheet.Scroller>
        </Sheet.Content>
      </Sheet.Container>
      <Sheet.Backdrop />
    </Sheet>
  );
};
