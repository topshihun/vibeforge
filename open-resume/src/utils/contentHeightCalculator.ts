import type { ResumeData } from '../types';

/**
 * 内容高度估算配置
 */
const HEIGHT_ESTIMATES = {
  header: 100,
  contactSection: 50,
  contactItem: 25,
  sectionHeader: 40,
  paragraph: (text: string) => Math.ceil(text.split('\n').length * 20 + 20),
  experienceItem: (exp: any) => {
    const baseHeight = 80;
    const descHeight = exp.description ? Math.ceil(exp.description.split('\n').length * 20 + 10) : 0;
    return baseHeight + descHeight;
  },
  educationItem: (edu: any) => {
    const baseHeight = 80;
    const descHeight = edu.description ? Math.ceil(edu.description.split('\n').length * 20 + 10) : 0;
    return baseHeight + descHeight;
  },
  projectItem: (project: any) => {
    const baseHeight = 60;
    const descHeight = project.description ? Math.ceil(project.description.split('\n').length * 20 + 10) : 0;
    return baseHeight + descHeight;
  },
  skillsSection: 60
};

/**
 * 计算简历内容总高度
 */
export const calculateContentHeight = (data: ResumeData): number => {
  let totalHeight = 0;
  
  // 头部信息
  totalHeight += HEIGHT_ESTIMATES.header;
  
  // 联系方式
  if (data.contacts && Array.isArray(data.contacts) && data.contacts.length > 0) {
    const contactItems = data.contacts.filter((contact) => contact?.value).length;
    totalHeight += HEIGHT_ESTIMATES.contactSection + (contactItems * HEIGHT_ESTIMATES.contactItem);
  }
  
  // 个人简介
  if (data.summary) {
    totalHeight += HEIGHT_ESTIMATES.sectionHeader + HEIGHT_ESTIMATES.paragraph(data.summary);
  }
  
  // 工作经历
  if (data.experience && Array.isArray(data.experience) && data.experience.length > 0) {
    totalHeight += data.experience.reduce((total, exp) => 
      total + HEIGHT_ESTIMATES.experienceItem(exp), HEIGHT_ESTIMATES.sectionHeader);
  }
  
  // 教育背景
  if (data.education && Array.isArray(data.education) && data.education.length > 0) {
    totalHeight += data.education.reduce((total, edu) => 
      total + HEIGHT_ESTIMATES.educationItem(edu), HEIGHT_ESTIMATES.sectionHeader);
  }
  
  // 技能
  if (data.skills && Array.isArray(data.skills) && data.skills.length > 0) {
    totalHeight += HEIGHT_ESTIMATES.sectionHeader + (data.skills.length * 30);
  }
  
  // 项目经历
  if (data.projects && Array.isArray(data.projects) && data.projects.length > 0) {
    totalHeight += data.projects.reduce((total, project) => 
      total + HEIGHT_ESTIMATES.projectItem(project), HEIGHT_ESTIMATES.sectionHeader);
  }
  
  return totalHeight;
};

/**
 * 检查内容是否超过单页限制（基于估算）
 */
export const checkContentExceedsLimit = (data: ResumeData): boolean => {
  const totalHeight = calculateContentHeight(data);
  const A4_CONTENT_HEIGHT_PX = 1123 - 30; // A4高度减去新的边距(15mm*2 = 30mm)
  return totalHeight > A4_CONTENT_HEIGHT_PX;
};

/**
 * 检查实际渲染内容是否超过单页限制
 * 考虑预览容器的边距和A4页面边距
 */
export const checkActualContentExceedsLimit = (): boolean => {
  const previewElement = document.getElementById('a4-preview-content');
  if (!previewElement) return false;
  
  // 获取预览容器的实际渲染高度
  const actualContentHeight = previewElement.scrollHeight;
  
  // 计算A4页面的可用高度
  // A4页面总高度: 297mm = 1123px (按96dpi计算)
  // 预览容器内边距: 15mm = 57px (15mm * 3.78px/mm)
  // 实际可用内容高度 = 总高度 - 上下边距
  const A4_TOTAL_HEIGHT_PX = 1123;
  const A4_PADDING_PX = 57; // 15mm * 3.78px/mm
  const A4_AVAILABLE_HEIGHT_PX = A4_TOTAL_HEIGHT_PX - (A4_PADDING_PX * 2);
  
  // 考虑额外的安全边距（防止内容刚好在边缘）
  const SAFETY_MARGIN_PX = 10;
  const MAX_ALLOWED_HEIGHT = A4_AVAILABLE_HEIGHT_PX - SAFETY_MARGIN_PX;
  
  return actualContentHeight > MAX_ALLOWED_HEIGHT;
};

/**
 * 组合检查：先使用估算算法快速检查，再使用实际渲染高度精确验证
 */
export const checkContentExceedsLimitComprehensive = (data: ResumeData): boolean => {
  // 快速检查：如果估算算法认为不超限，直接返回false
  if (!checkContentExceedsLimit(data)) {
    return false;
  }
  
  // 精确检查：使用实际渲染高度验证
  return checkActualContentExceedsLimit();
};