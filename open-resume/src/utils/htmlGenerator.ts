import type { ResumeData } from '../types';

/**
 * 生成简历预览HTML内容
 */
export const generatePreviewHTML = (data: ResumeData): string => {
  return `
    <div style="font-family: 'Microsoft YaHei', Arial, sans-serif; line-height: 1.6;">
      <!-- 头部信息 - 整合姓名、联系方式和照片 -->
      <div style="margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #1890ff;">
        ${data.photo ? `
          <!-- 有照片时的布局 -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <!-- 左侧信息区域 -->
            <div style="flex: 1;">
              <h1 style="margin: 0 0 15px 0; font-size: 28px; color: #333; font-weight: bold;">${data.name || ''}</h1>
              
              <!-- 联系方式整合到头部 -->
              ${data.contacts && data.contacts && data.contacts.length > 0 ? `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px 20px;">
                  ${data.contacts.map((contact) => 
                    contact.value ? `
                      <div style="display: flex; align-items: center; font-size: 14px;">
                        <span style="font-weight: bold; margin-right: 8px; color: #666;">${contact.type}：</span>
                        ${contact.isLink ? 
                          `<a href="${contact.value.startsWith('http') ? '' : 'https://'}${contact.value}" style="color: #1890ff; text-decoration: none;">${contact.value}</a>` : 
                          `<span style="color: #333;">${contact.value}</span>`
                        }
                      </div>
                    ` : ''
                  ).join('')}
                </div>
              ` : ''}
            </div>
            
            <!-- 右侧照片区域 -->
            <div style="margin-left: 30px; flex-shrink: 0;">
              <img src="${data.photo}" style="width: 100px; height: 130px; object-fit: cover; border: 2px solid #e8e8e8; border-radius: 4px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);" />
            </div>
          </div>
        ` : `
          <!-- 没有照片时的布局 -->
          <div style="text-align: center;">
            <h1 style="margin: 0 0 20px 0; font-size: 32px; color: #333; font-weight: bold;">${data.name || ''}</h1>
            
            <!-- 联系方式居中显示 -->
            ${data.contacts && data.contacts && data.contacts.length > 0 ? `
              <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 15px 30px;">
                ${data.contacts.map((contact) => 
                  contact.value ? `
                    <div style="display: flex; align-items: center; font-size: 14px; white-space: nowrap;">
                      <span style="font-weight: bold; margin-right: 8px; color: #666;">${contact.type}：</span>
                      ${contact.isLink ? 
                        `<a href="${contact.value.startsWith('http') ? '' : 'https://'}${contact.value}" style="color: #1890ff; text-decoration: none;">${contact.value}</a>` : 
                        `<span style="color: #333;">${contact.value}</span>`
                      }
                    </div>
                  ` : ''
                ).join('')}
              </div>
            ` : ''}
          </div>
        `}
      </div>
      
      <!-- 个人简介 -->
      ${data.summary ? `
        <div style="margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #333; border-bottom: 2px solid #1890ff; padding-bottom: 5px;">个人简介</h3>
          <p style="margin: 0; white-space: pre-line;">${data.summary}</p>
        </div>
      ` : ''}
      
      <!-- 工作经历 -->
      ${data.experience && Array.isArray(data.experience) && data.experience.length > 0 ? `
        <div style="margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #333; border-bottom: 2px solid #1890ff; padding-bottom: 5px;">工作经历</h3>
          ${data.experience.map((exp) => `
            <div style="margin-bottom: 15px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <strong style="font-size: 14px;">${exp.company || ''}</strong>
                <span style="color: #666;">${exp.period || ''}</span>
              </div>
              <div style="color: #1890ff; margin-bottom: 5px;">${exp.position || ''}</div>
              <p style="margin: 0; white-space: pre-line; font-size: 13px;">${exp.description || ''}</p>
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      <!-- 教育背景 -->
      ${data.education && Array.isArray(data.education) && data.education.length > 0 ? `
        <div style="margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #333; border-bottom: 2px solid #1890ff; padding-bottom: 5px;">教育背景</h3>
          ${data.education.map((edu) => `
            <div style="margin-bottom: 15px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <strong style="font-size: 14px;">${edu.school || ''}</strong>
                <span style="color: #666;">${edu.period || ''}</span>
              </div>
              <div style="color: #1890ff; margin-bottom: 5px;">${edu.major || ''} | ${edu.degree || ''}</div>
              <p style="margin: 0; white-space: pre-line; font-size: 13px;">${edu.description || ''}</p>
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      <!-- 技能 -->
      ${data.skills && Array.isArray(data.skills) && data.skills.length > 0 ? `
        <div style="margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #333; border-bottom: 2px solid #1890ff; padding-bottom: 5px;">技能</h3>
          ${data.skills.map((skill) => `
            <div style="margin-bottom: 12px; line-height: 1.6;">
              ${skill.category ? `<div style="font-weight: bold; margin-bottom: 4px; color: #333;">${skill.category}</div>` : ''}
              <div style="color: #666; white-space: pre-line; word-wrap: break-word;">${skill.description || ''}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      <!-- 项目经历 -->
      ${data.projects && Array.isArray(data.projects) && data.projects.length > 0 ? `
        <div style="margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #333; border-bottom: 2px solid #1890ff; padding-bottom: 5px;">项目经历</h3>
          ${data.projects.map((project) => `
            <div style="margin-bottom: 15px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <strong style="font-size: 14px;">${project.name || ''}</strong>
                <span style="color: #666;">${project.period || ''}</span>
              </div>
              <p style="margin: 0; white-space: pre-line; font-size: 13px;">${project.description || ''}</p>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;
};

/**
 * 生成单页PDF的完整HTML文档
 */
export const generateSinglePageHTML = (data: ResumeData): string => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { 
            margin: 0; 
            padding: 0; 
            width: 210mm; 
            min-height: 297mm; 
            background: white;
            font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
            font-size: 14px;
            line-height: 1.5;
            box-sizing: border-box;
            transform: none !important;
            zoom: 1 !important;
            overflow: auto; /* 允许body滚动 */
          }
          #a4-content {
            width: 210mm;
            min-height: 297mm;
            padding: 15mm;
            box-sizing: border-box;
            background: white;
            overflow: visible; /* 允许内容区域显示完整内容 */
          }
          html {
            overflow: auto; /* 允许html滚动 */
          }
        </style>
      </head>
      <body>
        <div id="a4-content">
          ${generatePreviewHTML(data)}
        </div>
      </body>
    </html>
  `;
};