import React, { useState, useRef } from 'react';
import { FloatButton, Modal, Upload, message, Button, Space } from 'antd';
import { 
  DownloadOutlined, 
  UploadOutlined, 
  FileTextOutlined, 
  SettingOutlined,
  FilePdfOutlined,
  MoreOutlined
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import type { ResumeData } from '../types';
import { exportResumeToPDF } from '../utils/pdfExport';
import { exportResumeToJSON, downloadJSONFile, importResumeFromJSON, readJSONFile } from '../utils/jsonExport';

interface FloatingActionButtonProps {
  resumeData: ResumeData;
  onImportData: (data: ResumeData) => void;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ 
  resumeData, 
  onImportData 
}) => {
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 导出PDF
  const handleExportPDF = async () => {
    setLoading(true);
    try {
      await exportResumeToPDF();
      message.success('PDF导出成功');
    } catch (error) {
      console.error('导出PDF失败:', error);
      message.error('PDF导出失败');
    } finally {
      setLoading(false);
    }
  };

  // 导出JSON
  const handleExportJSON = () => {
    try {
      const jsonContent = exportResumeToJSON(resumeData);
      downloadJSONFile(jsonContent, 'resume.json');
      message.success('JSON导出成功');
    } catch (error) {
      console.error('导出JSON失败:', error);
      message.error('JSON导出失败');
    }
  };

  // 导入JSON文件
  const handleImportJSON = async (file: File) => {
    try {
      const content = await readJSONFile(file);
      const importedData = importResumeFromJSON(content);
      onImportData(importedData);
      message.success('JSON导入成功');
      return false; // 阻止默认上传行为
    } catch (error) {
      console.error('导入JSON失败:', error);
      message.error('JSON导入失败');
      return false;
    }
  };

  // 直接触发文件选择
  const handleDirectImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 处理文件选择变化
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImportJSON(file);
    }
    // 清空输入值，允许选择同一个文件
    if (event.target) {
      event.target.value = '';
    }
  };

  // 上传配置（用于模态框中的上传）
  const uploadProps: UploadProps = {
    name: 'file',
    accept: '.json',
    beforeUpload: handleImportJSON,
    showUploadList: false,
  };

  // 显示导入导出模态框
  const showModal = () => {
    setModalVisible(true);
  };

  const hideModal = () => {
    setModalVisible(false);
  };

  return (
    <>
      {/* 隐藏的文件输入 */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".json"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      
      {/* 悬浮球 */}
      <FloatButton.Group
        trigger="click"
        type="primary"
        style={{ right: 24, bottom: 24 }}
        icon={<MoreOutlined />}
      >
        <FloatButton
          icon={<FilePdfOutlined />}
          tooltip="导出PDF"
          onClick={handleExportPDF}
        />
        <FloatButton
          icon={<FileTextOutlined />}
          tooltip="导出JSON"
          onClick={handleExportJSON}
        />
        <FloatButton
          icon={<UploadOutlined />}
          tooltip="导入JSON"
          onClick={handleDirectImport}
        />
      </FloatButton.Group>

      {/* 导出选项模态框 */}
      <Modal
        title="导出选项"
        open={modalVisible}
        onCancel={hideModal}
        footer={null}
        width={400}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <h4>导出选项</h4>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button 
                type="primary" 
                icon={<FilePdfOutlined />} 
                onClick={handleExportPDF}
                loading={loading}
                block
              >
                导出PDF
              </Button>
              <Button 
                icon={<FileTextOutlined />} 
                onClick={handleExportJSON}
                block
              >
                导出JSON
              </Button>
            </Space>
          </div>
          
          <div style={{ fontSize: '12px', color: '#666', textAlign: 'center' }}>
            JSON格式支持保存和恢复简历数据
          </div>
        </Space>
      </Modal>
    </>
  );
};

export default FloatingActionButton;