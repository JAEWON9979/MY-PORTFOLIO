# TODO

앞으로 할 일 백로그. 우선순위 순으로 정리하고, 완료하면 항목을 지운 뒤 PROGRESS.md에 기록하세요.

- 버그: 일정 추가/수정 모달에서 입력칸(제목/설명) 안에서 마우스 왼쪽 버튼을 누른 채로 모달 밖까지 드래그해서 놓으면 모달이 그대로 닫힘 (텍스트 드래그 선택 중 실수로 닫히는 문제). `ScheduleModal.tsx`의 배경 오버레이 `onClick={onClose}`가 mousedown/mouseup 대상이 다를 때도 click으로 잡히는 게 원인으로 보임 — mousedown 시작 지점을 추적해서 배경에서 시작한 클릭일 때만 닫히게 고치기
- DMARC 레코드(`_dmarc` TXT, `v=DMARC1; p=none;`) 아직 미설정. Optional이라 발송엔 지장 없지만, 도메인 사칭 방지용으로 나중에 Vercel DNS Records에 수동 추가 고려
