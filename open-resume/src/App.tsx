import React, { useState, useEffect } from 'react';
import { Button, Input, Typography, Card, Form, Divider, Space, Alert } from 'antd';
import { DownloadOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import './index.css';

// 导入组件
import PhotoUpload from './components/PhotoUpload';
import ContactFields from './components/ContactFields';
import ExperienceFields from './components/ExperienceFields';
import EducationFields from './components/EducationFields';
import ProjectFields from './components/ProjectFields';
import SkillFields from './components/SkillFields';
import FloatingActionButton from './components/FloatingActionButton';

// 导入工具函数
import { exportResumeToPDF } from './utils/pdfExport';
import { checkContentExceedsLimitComprehensive } from './utils/contentHeightCalculator';
import { generatePreviewHTML } from './utils/htmlGenerator';

// 导入类型定义
import type { ResumeData } from './types';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

function App() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<ResumeData>({});
  const [contentExceedsLimit, setContentExceedsLimit] = useState(false);
  
  // 照片上传处理
  const handlePhotoChange = (value: string) => {
    form.setFieldsValue({ photo: value });
  };
  
  // 实时更新预览数据并检查内容长度
  const handleFormChange = (_: any, allValues: ResumeData) => {
    setPreviewData(allValues);
    setContentExceedsLimit(checkContentExceedsLimitComprehensive(allValues));
  };
  
  // 实时监测渲染高度
  useEffect(() => {
    if (!contentExceedsLimit) {
      // 延迟检查，确保DOM已渲染完成
      const timer = setTimeout(() => {
        const previewElement = document.getElementById('a4-preview-content');
        if (previewElement) {
          // 使用综合检查方法进行精确验证
          const exceeds = checkContentExceedsLimitComprehensive(previewData);
          if (exceeds !== contentExceedsLimit) {
            setContentExceedsLimit(exceeds);
          }
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [previewData, contentExceedsLimit]);
  
  // 初始加载时获取一次值
  useEffect(() => {
    const initialValues = form.getFieldsValue();
    setPreviewData(initialValues);
  }, [form]);
  
  // 导出PDF功能
  const exportPDF = async () => {
    setLoading(true);
    try {
      await exportResumeToPDF();
    } catch (error) {
      console.error('导出PDF失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 导入简历数据
  const handleImportData = (importedData: ResumeData) => {
    // 设置表单值
    form.setFieldsValue(importedData);
    // 更新预览数据
    setPreviewData(importedData);
  };
  
  // 默认表单值
  const defaultValues: ResumeData = {
    name: '张三',
    photo: '',
    summary: '本人乐观开朗，在校成绩优异，自律能力强，具有良好的沟通能力和团队合作精神，可以使用英语进行工作交流。\n具有多年前端开发经验，熟悉React、Vue等前端框架，善于技术学习，持续关注互联网技术发展。\n求职意向：前端开发相关工作。',
    contacts: [
      { type: '邮箱', value: 'zhangsan@example.com', isLink: true },
      { type: '电话', value: '13800138000', isLink: false },
      { type: '个人网站', value: 'zhangsan.com', isLink: true },
      { type: 'GitHub', value: 'github.com/zhangsan', isLink: true }
    ],
    experience: [
      {
        company: 'ABC科技有限公司',
        position: '前端开发工程师',
        period: '2023.01 - 至今',
        description: '负责公司官网和管理系统的前端开发，使用React + TypeScript技术栈。\n参与需求分析、系统设计、开发和测试，确保项目按时交付。\n优化前端性能，提升用户体验。'
      }
    ],
    education: [
      {
        school: '某某大学',
        major: '计算机科学与技术',
        degree: '本科',
        period: '2019.09 - 2023.06',
        description: 'GPA: 3.8/4.0，专业排名前5%。\n获得国家奖学金、校级优秀学生等荣誉。'
      }
    ],
    skills: [
      { category: '前端技能', description: 'React, JavaScript, TypeScript, HTML, CSS, Ant Design, Vue' },
      { category: '后端技能', description: 'Node.js, Express, MongoDB' }
    ],
    projects: [
      {
        name: '企业管理系统',
        period: '2023.03 - 2023.06',
        description: '使用React + TypeScript + Ant Design开发的企业管理系统。\n负责前端页面开发和组件封装，实现了用户管理、权限控制、数据统计等功能。\n优化了系统性能，提升了用户体验。'
      }
    ]
  };
  
  return (
    <div className="app">
      {/* 悬浮球组件 */}
      <FloatingActionButton 
        resumeData={previewData}
        onImportData={handleImportData}
      />
      
      <div className="resume-container">
        {/* 左边编辑区 */}
        <div className="resume-editor">
          <Card title="简历编辑" variant="outlined">
            <Form form={form} layout="vertical" initialValues={defaultValues} onValuesChange={handleFormChange}>
              <Form.Item name="name" label="姓名">
                <Input />
              </Form.Item>
              
              <Form.Item name="photo" label="简历照片">
                <PhotoUpload 
                  value={form.getFieldValue('photo') || ''} 
                  onChange={handlePhotoChange} 
                />
              </Form.Item>
              
              <ContactFields name="contacts" />
              
              <Divider />
              
              <Form.Item name="summary" label="个人简介">
                <TextArea 
                  rows={4} 
                  autoSize={{ minRows: 4, maxRows: 20 }}
                  style={{ resize: 'vertical' }}
                />
              </Form.Item>
              
              <Divider />
              
              <ExperienceFields name="experience" />
              
              <Divider />
              
              <EducationFields name="education" />
              
              <Divider />
              
              <SkillFields name="skills" />
              
              <Divider />
              
              <ProjectFields name="projects" />
            </Form>
          </Card>
        </div>
        
        {/* 右边预览区 */}
        <div className="resume-preview">
          <Card title="简历预览" variant="outlined">
            {contentExceedsLimit ? (
              <div>
                <Alert
                  message="内容可能超过单页限制"
                  description="当前内容较多，导出PDF时可能无法完整显示在一页内。建议适当精简内容。"
                  type="warning"
                  showIcon
                  icon={<ExclamationCircleOutlined />}
                  style={{ marginBottom: 16 }}
                />
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px 20px', 
                  color: '#999',
                  fontSize: '16px'
                }}>
                  <ExclamationCircleOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                  <p>内容过多，预览已禁用</p>
                  <p style={{ fontSize: '14px', marginTop: '8px' }}>请精简内容后重新查看预览</p>
                </div>
              </div>
            ) : (
              <div 
                id="a4-preview-content"
                className="resume-preview-content"
                dangerouslySetInnerHTML={{ __html: generatePreviewHTML(previewData) }}
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default App;