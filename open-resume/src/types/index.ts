// 简历数据类型定义
export interface Contact {
  type?: string;
  value?: string;
  isLink?: boolean;
}

export interface Experience {
  company?: string;
  position?: string;
  period?: string;
  description?: string;
}

export interface Education {
  school?: string;
  major?: string;
  degree?: string;
  period?: string;
  description?: string;
}

export interface Project {
  name?: string;
  period?: string;
  description?: string;
}

export interface Skill {
  category?: string;
  description?: string;
}

export interface ResumeData {
  name?: string;
  photo?: string;
  summary?: string;
  contacts?: Contact[];
  experience?: Experience[];
  education?: Education[];
  skills?: Skill[];
  projects?: Project[];
}