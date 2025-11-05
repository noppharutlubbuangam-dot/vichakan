
import { Category, Activity, Team, CompetitionMode, TeamStatus } from './types';

export const CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'วิชาการ' },
  { id: 'cat-2', name: 'เทคโนโลยี' },
  { id: 'cat-3', name: 'ศิลปะ' },
  { id: 'cat-4', name: 'กีฬา' },
];

export const ACTIVITIES: Activity[] = [
  {
    id: 'act-1',
    categoryId: 'cat-1',
    name: 'แข่งขันทักษะคณิตศาสตร์',
    levels: ['ป.4-6', 'ม.1-3'],
    mode: CompetitionMode.Onsite,
    teamComposition: { teachers: 1, students: 2 },
  },
  {
    id: 'act-2',
    categoryId: 'cat-2',
    name: 'การแข่งขันเขียนโปรแกรม',
    levels: ['ม.1-3', 'ม.4-6'],
    mode: CompetitionMode.Online,
    teamComposition: { teachers: 1, students: 3 },
  },
  {
    id: 'act-3',
    categoryId: 'cat-3',
    name: 'ประกวดวาดภาพระบายสี',
    levels: ['ป.1-3', 'ป.4-6'],
    mode: CompetitionMode.Hybrid,
    teamComposition: { teachers: 1, students: 1 },
  },
  {
    id: 'act-4',
    categoryId: 'cat-4',
    name: 'แข่งขันฟุตซอล',
    levels: ['ม.ต้น', 'ม.ปลาย'],
    mode: CompetitionMode.Onsite,
    teamComposition: { teachers: 1, students: 7 },
  },
  {
    id: 'act-5',
    categoryId: 'cat-2',
    name: 'การแข่งขันออกแบบเว็บไซต์',
    levels: ['ม.4-6'],
    mode: CompetitionMode.Online,
    teamComposition: { teachers: 1, students: 2 },
  },
  {
    id: 'act-6',
    categoryId: 'cat-1',
    name: 'แข่งขันกล่าวสุนทรพจน์ภาษาอังกฤษ',
    levels: ['ม.1-3', 'ม.4-6'],
    mode: CompetitionMode.Hybrid,
    teamComposition: { teachers: 1, students: 1 },
  },
];

export const INITIAL_TEAMS: Team[] = [
    {
        id: 'T001',
        activityId: 'act-1',
        teamName: 'คณิตคิดเร็ว',
        school: 'โรงเรียนวิทยานุสรณ์',
        level: 'ป.4-6',
        contact: { name: 'สมชาย ใจดี', phone: '0812345678', email: 'somchai@email.com' },
        teachers: [{ fullName: 'ครูสมศรี มีสุข', detail: 'somsri@email.com' }],
        students: [
            { fullName: 'ด.ช. ปิติ ยินดี', detail: 'ป.6/1' },
            { fullName: 'ด.ญ. มานี รักเรียน', detail: 'ป.6/2' },
        ],
        status: TeamStatus.Approved,
        order: 1,
    },
    {
        id: 'T002',
        activityId: 'act-2',
        teamName: 'Code Warriors',
        school: 'โรงเรียนเตรียมอุดมศึกษา',
        level: 'ม.4-6',
        contact: { name: 'ประหยัด พลังงาน', phone: '0887654321', email: 'prayat@email.com' },
        teachers: [{ fullName: 'ครูประวิตร จันทร์โอชา', detail: 'prawit@email.com' }],
        students: [
            { fullName: 'นายเอ นามสมมติ', detail: 'ม.5/3' },
            { fullName: 'น.ส.บี สีสวย', detail: 'ม.5/3' },
            { fullName: 'นายซี ดีจริง', detail: 'ม.5/4' },
        ],
        status: TeamStatus.Pending,
        order: 2,
    },
     {
        id: 'T003',
        activityId: 'act-3',
        teamName: 'ศิลปินน้อย',
        school: 'โรงเรียนสาธิตจุฬาฯ',
        level: 'ป.1-3',
        contact: { name: 'วินัย ดีเยี่ยม', phone: '0911112222', email: 'winai@email.com' },
        teachers: [{ fullName: 'ครูอารี เก่งมาก', detail: 'aree@email.com' }],
        students: [
            { fullName: 'ด.ช. วาดเก่ง ระบายสี', detail: 'ป.3/1' },
        ],
        status: TeamStatus.Rejected,
        order: 3,
    }
];
