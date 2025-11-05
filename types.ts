
export enum CompetitionMode {
  Onsite = 'Onsite',
  Online = 'Online',
  Hybrid = 'Hybrid',
}

export enum TeamStatus {
  Pending = 'รอตรวจสอบ',
  Approved = 'อนุมัติ',
  Rejected = 'ไม่ผ่าน',
}

export enum FileType {
  Consent = 'หนังสือยินยอม',
  Slip = 'สลิปโอนเงิน',
  Portfolio = 'แฟ้มผลงาน',
  Other = 'อื่นๆ',
}

export interface TeamMember {
  fullName: string;
  detail: string; // Email for teacher, Class for student
}

export interface Team {
  id: string;
  activityId: string;
  teamName: string;
  school: string;
  level: string;
  contact: {
    name: string;
    phone: string;
    email: string;
  };
  teachers: TeamMember[];
  students: TeamMember[];
  status: TeamStatus;
  order: number;
}

export interface Activity {
  id: string;
  categoryId: string;
  name: string;
  levels: string[];
  mode: CompetitionMode;
  teamComposition: {
    teachers: number;
    students: number;
  };
}

export interface Category {
  id: string;
  name: string;
}
