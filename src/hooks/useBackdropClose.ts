import { useRef } from "react";

/**
 * 모달 배경 오버레이용 props. 배경에서 mousedown이 시작되고 배경에서 끝난 클릭일 때만 닫는다.
 * (입력칸에서 텍스트를 드래그하다 배경 위에서 놓으면 click 대상이 배경이 되어 모달이 닫히는 문제 방지)
 */
export function useBackdropClose(onClose: () => void) {
  const mouseDownOnBackdrop = useRef(false);

  return {
    onMouseDown: (e: React.MouseEvent<HTMLElement>) => {
      mouseDownOnBackdrop.current = e.target === e.currentTarget;
    },
    onClick: (e: React.MouseEvent<HTMLElement>) => {
      if (e.target === e.currentTarget && mouseDownOnBackdrop.current) onClose();
    },
  };
}
