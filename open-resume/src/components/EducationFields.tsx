import React from 'react';
import { Form, Input, Button, Space, Card } from 'antd';
import { PlusOutlined, MinusOutlined } from '@ant-design/icons';

interface EducationFieldsProps {
  name: string;
}

const EducationFields: React.FC<EducationFieldsProps> = ({ name }) => {
  return (
    <Form.Item label="教育背景">
      <Form.List name={name}>
        {(fields, { add, remove }) => (
          <>
            {fields.map((field, index) => {
              const { key, ...restField } = field;
              return (
                <Card 
                  key={key} 
                  title={`教育背景 ${index + 1}`} 
                  style={{ marginBottom: 16 }} 
                  variant="outlined"
                >
                  <Space orientation="horizontal" style={{ width: '100%', marginBottom: 12 }}>
                    <Form.Item 
                      {...restField} 
                      name={[field.name, 'school']} 
                      label="学校" 
                      style={{ flex: 1, marginRight: 8 }}
                    >
                      <Input />
                    </Form.Item>
                    <Form.Item 
                      {...restField} 
                      name={[field.name, 'major']} 
                      label="专业" 
                      style={{ flex: 1, marginLeft: 8 }}
                    >
                      <Input />
                    </Form.Item>
                  </Space>
                  <Space orientation="horizontal" style={{ width: '100%', marginBottom: 12 }}>
                    <Form.Item 
                      {...restField} 
                      name={[field.name, 'degree']} 
                      label="学位" 
                      style={{ flex: 1, marginRight: 8 }}
                    >
                      <Input />
                    </Form.Item>
                    <Form.Item 
                      {...restField} 
                      name={[field.name, 'period']} 
                      label="时间" 
                      style={{ flex: 1, marginLeft: 8 }}
                    >
                      <Input />
                    </Form.Item>
                  </Space>
                  <Form.Item {...restField} name={[field.name, 'description']} label="描述">
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
              onClick={() => add({ school: '', major: '', degree: '', period: '', description: '' })}
            >
              添加教育背景
            </Button>
          </>
        )}
      </Form.List>
    </Form.Item>
  );
};

export default EducationFields;