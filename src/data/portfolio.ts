export interface CertificationItem {
  name: string;
  issuer: string;
  acquiredDate: string;
}

export const certifications: CertificationItem[] = [
  {
    name: "컴퓨터활용능력 1급",
    issuer: "대한상공회의소",
    acquiredDate: "2022.05",
  },
  {
    name: "정보처리기사",
    issuer: "한국산업인력공단",
    acquiredDate: "2023.08",
  },
  {
    name: "워드프로세서",
    issuer: "대한상공회의소",
    acquiredDate: "2021.11",
  },
];
