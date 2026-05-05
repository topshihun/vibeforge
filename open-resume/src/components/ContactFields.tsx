import React from 'react';
import { Form, Input, Button, Space, Card, Switch } from 'antd';
import { PlusOutlined, MinusOutlined } from '@ant-design/icons';

interface ContactFieldsProps {
  name: string;
}

const ContactFields: React.FC<ContactFieldsProps> = ({ name }) => {
  return (
    <Form.Item label="联系方式">
      <Form.List name={name}>
        {(fields, { add, remove }) => (
          <>
            {fields.map((field, index) => {
              const { key, ...restField } = field;
              return (
                <Card 
                  key={key} 
                  style={{ 
                    marginBottom: 0, 
                    borderBottom: 'none', 
                    borderLeft: 'none', 
                    borderRight: 'none', 
                    borderRadius: 0, 
                    boxShadow: 'none' 
                  }} 
                  styles={{ body: { padding: '8px 0' } }}
                >
                  <Space orientation="horizontal" style={{ width: '100%', alignItems: 'center' }}>
                    <Form.Item 
                      {...restField} 
                      name={[field.name, 'type']} 
                      label="类型" 
                      style={{ flex: 1, marginRight: 8, marginBottom: 0 }}
                    >
                      <Input placeholder="如：邮箱、电话、个人网站等" />
                    </Form.Item>
                    <Form.Item 
                      {...restField} 
                      name={[field.name, 'value']} 
                      label="值" 
                      style={{ flex: 1, marginRight: 8, marginLeft: 8, marginBottom: 0 }}
                    >
                      <Input />
                    </Form.Item>
                    <Form.Item 
                      {...restField} 
                      name={[field.name, 'isLink']} 
                      valuePropName="checked" 
                      label="是否为链接" 
                      style={{ marginRight: 8, marginLeft: 8, marginBottom: 0 }}
                    >
                      <Switch size="small" />
                    </Form.Item>
                    <Button 
                      type="text" 
                      danger 
                      icon={<MinusOutlined />} 
                      onClick={() => remove(field.name)} 
                      style={{ marginLeft: 8 }}
                    >
                      删除
                    </Button>
                  </Space>
                </Card>
              );
            })}
            <Button 
              type="dashed" 
              icon={<PlusOutlined />} 
              onClick={() => add({ type: '', value: '', isLink: false })}
            >
              添加联系方式
            </Button>
          </>
        )}
      </Form.List>
    </Form.Item>
  );
};

export default ContactFields;