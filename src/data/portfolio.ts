export interface CertificationItem {
  name: string;
  issuer: string;
  acquiredDate: string;
}

export const certifications: CertificationItem[] = [
  {
    name: "ITQ OA MASTER",
    issuer: "한국생산성본부",
    acquiredDate: "2023",
  },
  {
    name: "컴퓨터활용능력 2급",
    issuer: "대한상공회의소",
    acquiredDate: "2025",
  },
  {
    name: "한국사능력검정 1급",
    issuer: "국사편찬위원회",
    acquiredDate: "2025",
  },
];
