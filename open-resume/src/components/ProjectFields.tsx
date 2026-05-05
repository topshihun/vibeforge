import React from 'react';
import { Form, Input, Button, Space, Card } from 'antd';
import { PlusOutlined, MinusOutlined } from '@ant-design/icons';

interface ProjectFieldsProps {
  name: string;
}

const ProjectFields: React.FC<ProjectFieldsProps> = ({ name }) => {
  return (
    <Form.Item label="项目经历">
      <Form.List name={name}>
        {(fields, { add, remove }) => (
          <>
            {fields.map((field, index) => {
              const { key, ...restField } = field;
              return (
                <Card 
                  key={key} 
                  title={`项目经历 ${index + 1}`} 
                  style={{ marginBottom: 16 }} 
                  variant="outlined"
                >
                  <Space orientation="horizontal" style={{ width: '100%', marginBottom: 12 }}>
                    <Form.Item 
                      {...restField} 
                      name={[field.name, 'name']} 
                      label="项目名称" 
                      style={{ flex: 1, marginRight: 8 }}
                    >
                      <Input />
                    </Form.Item>
                    <Form.Item 
                      {...restField} 
                      name={[field.name, 'period']} 
                      label="项目时间" 
                      style={{ flex: 1, marginLeft: 8 }}
                    >
                      <Input />
                    </Form.Item>
                  </Space>
                  <Form.Item {...restField} name={[field.name, 'description']} label="项目描述">
                    <Input.TextArea 
                      rows={3} 
                      autoSize={{ minRows: 3, maxRows: 15 }}
                      style={{ resize: 'vertical' }}
                    />
                  </Form.Item>
                  <Button 
                    type="text" 
                    danger 
                    icon={<MinusOutlined />} 
                    onClick={() => remove(field.name)}
                  >
                    删除
                  </Button>
                </Card>
              );
            })}
            <Button 
              type="dashed" 
              icon={<PlusOutlined />} 
              onClick={() => add({ name: '', period: '', description: '' })}
            >
              添加项目经历
            </Button>
          </>
        )}
      </Form.List>
    </Form.Item>
  );
};

export default ProjectFields;