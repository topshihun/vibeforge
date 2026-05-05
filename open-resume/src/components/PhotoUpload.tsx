import React from 'react';
import { Typography, Button } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons'
import { useDropzone } from 'react-dropzone';

const { Text } = Typography;

interface PhotoUploadProps {
  value: string;
  onChange: (value: string) => void;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ value, onChange }) => {
  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Image = event.target?.result;
        if (typeof base64Image === 'string') {
          onChange(base64Image);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = () => {
    onChange('');
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    maxFiles: 1
  });

  return (
    <div>
      {value ? (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <img 
              src={value} 
              alt="简历照片" 
              style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px' }}
            />
            <Button 
              type="text" 
              danger
              icon={<DeleteOutlined />} 
              onClick={handleDelete} 
              style={{ marginLeft: '12px' }}
            >
              删除照片
            </Button>
          </div>
          <div
            {...getRootProps()}
            style={{
              border: '2px dashed #d9d9d9',
              borderRadius: '4px',
              padding: '10px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'border-color 0.3s',
              backgroundColor: isDragActive ? '#f0f9ff' : '#ffffff'
            }}
          >
            <input {...getInputProps()} />
            <p style={{ margin: '4px 0', fontSize: '14px' }}>
              {isDragActive ? '松开鼠标更换照片' : '点击或拖拽照片到此处更换'}
            </p>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          style={{
            border: '2px dashed #d9d9d9',
            borderRadius: '4px',
            padding: '20px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'border-color 0.3s',
            backgroundColor: isDragActive ? '#f0f9ff' : '#ffffff'
          }}
        >
          <input {...getInputProps()} />
          <UploadOutlined style={{ fontSize: '24px', color: '#1890ff', marginBottom: '8px' }} />
          <p style={{ margin: '8px 0' }}>
            {isDragActive ? '松开鼠标上传照片' : '点击或拖拽照片到此处上传'}
          </p>
          <p style={{ fontSize: '12px', color: '#666' }}>
            支持 PNG、JPG、JPEG、GIF 格式
          </p>
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;