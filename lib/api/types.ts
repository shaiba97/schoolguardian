export type GuardianChild = {
  id: string;
  fullName: string;
  roleNumber?: string | null;
  className?: string | null;
};

export type WardResultRow = {
  id: string;
  examId: string;
  examName: string;
  examType?: string | null;
  examDate?: string | null;
  subjectId: string;
  subjectName: string;
  className: string;
  marks?: number | null;
  maxMarks: number;
  percentage?: number | null;
  grade?: string | null;
  status: string;
};

export type WardResults = {
  results: WardResultRow[];
  averagePercentage?: number | null;
  count: number;
};

export type WardAttendanceRecord = {
  id: string;
  date: string;
  status: string;
  subjectName?: string | null;
  className?: string | null;
};

export type WardAttendance = {
  summary: {
    present: number;
    absent: number;
    late: number;
    excused: number;
    other: number;
    total: number;
    attended: number;
    percentage?: number | null;
  };
  records: WardAttendanceRecord[];
};

export type WardTimetableEntry = {
  id: string;
  dayOfWeek: string;
  periodNo: number;
  startTime: string;
  endTime: string;
  isBreak: boolean;
  subjectName?: string | null;
  teacherName?: string | null;
};

export type WardTimetable = {
  year: { id: string; name: string };
  class: { id: string; className: string };
  subjects: Array<{ subjectId: string; subjectName: string; teacherName?: string | null }>;
  entries: WardTimetableEntry[];
};

export type WardCase = {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  filedAt: string;
  resolvedAt?: string | null;
  resolutionNote?: string | null;
  filedByName: string;
};

export type WardCases = { cases: WardCase[] };

export type TrendPoint = { at: string; value?: number | null };

export type WardTrend = {
  metric: "results" | "attendance";
  window: "week" | "month" | "3m" | "6m" | "1y";
  windowDays: number;
  current: { from: string; to: string; average?: number | null; samples: number };
  previous: { from: string; to: string; average?: number | null; samples: number };
  delta?: number | null;
  verdict?: "improving" | "declining" | "stable" | null;
  byType: {
    test: { average?: number | null; samples: number };
    exam: { average?: number | null; samples: number };
  };
  series: TrendPoint[];
};

export type TrendWindow = "week" | "month" | "3m" | "6m" | "1y";

export type GuardianNotification = {
  id: string;
  title: string;
  body: string;
  childName?: string | null;
  readAt?: string | null;
  createdAt: string;
};

export type GuardianProfile = {
  id: string;
  firstName: string;
  lastName?: string | null;
  phone?: string | null;
  email?: string | null;
  guardianNumber?: string | null;
  relationships: Array<{
    studentId: string;
    studentName: string;
    relationship: string;
    isPrimary: boolean;
  }>;
};
