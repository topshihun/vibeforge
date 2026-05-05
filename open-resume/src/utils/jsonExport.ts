import type { ResumeData, Contact, Experience, Education, Project, Skill } from '../types';

/**
 * 导出简历为JSON格式
 */
export const exportResumeToJSON = (resumeData: ResumeData): string => {
  // 将简历数据转换为JSON格式
  const jsonData = {
    name: resumeData.name || '',
    photo: resumeData.photo || '',
    summary: resumeData.summary || '',
    contacts: resumeData.contacts?.map((contact: Contact) => ({
      type: contact.type || '',
      value: contact.value || '',
      isLink: contact.isLink || false
    })) || [],
    experience: resumeData.experience?.map((exp: Experience) => ({
      company: exp.company || '',
      position: exp.position || '',
      period: exp.period || '',
      description: exp.description || ''
    })) || [],
    education: resumeData.education?.map((edu: Education) => ({
      school: edu.school || '',
      major: edu.major || '',
      degree: edu.degree || '',
      period: edu.period || '',
      description: edu.description || ''
    })) || [],
    skills: resumeData.skills?.map((skill: Skill) => ({
      category: skill.category || '',
      description: skill.description || ''
    })) || [],
    projects: resumeData.projects?.map((project: Project) => ({
      name: project.name || '',
      period: project.period || '',
      description: project.description || ''
    })) || []
  };

  // 使用JSON.stringify将对象转换为JSON字符串，保持格式美观
  return JSON.stringify(jsonData, null, 2);
};

/**
 * 从JSON文件导入简历数据
 */
export const importResumeFromJSON = (jsonString: string): ResumeData => {
  try {
    const parsedData = JSON.parse(jsonString);
    
    // 将JSON数据转换回ResumeData格式
    const resumeData: ResumeData = {
      name: parsedData.name || '',
      photo: parsedData.photo || '',
      summary: parsedData.summary || '',
      contacts: parsedData.contacts?.map((contact: any) => ({
        type: contact.type || '',
        value: contact.value || '',
        isLink: contact.isLink || false
      })) || [],
      experience: parsedData.experience?.map((exp: any) => ({
        company: exp.company || '',
        position: exp.position || '',
        period: exp.period || '',
        description: exp.description || ''
      })) || [],
      education: parsedData.education?.map((edu: any) => ({
        school: edu.school || '',
        major: edu.major || '',
        degree: edu.degree || '',
        period: edu.period || '',
        description: edu.description || ''
      })) || [],
      skills: parsedData.skills?.map((skill: any) => ({
        category: skill.category || '',
        description: skill.description || ''
      })) || [],
      projects: parsedData.projects?.map((project: any) => ({
        name: project.name || '',
        period: project.period || '',
        description: project.description || ''
      })) || []
    };

    return resumeData;
  } catch (error) {
    console.error('解析JSON文件失败:', error);
    throw new Error('JSON文件格式错误，请检查文件内容');
  }
};

/**
 * 下载JSON文件
 */
export const downloadJSONFile = (jsonContent: string, filename: string = 'resume.json'): void => {
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * 读取上传的JSON文件
 */
export const readJSONFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      resolve(content);
    };
    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };
    reader.readAsText(file);
  });
};