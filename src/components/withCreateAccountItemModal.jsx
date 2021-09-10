import React, { Fragment, useState, useRef } from 'react';
import { Modal, Form, InputNumber, Select, notification, DatePicker } from 'antd';
import moment from 'moment';

const { success } = notification;

const withCreateAccountItemModal = WrappedComponent => {
  function hocComponent(props) {
    const formRef = useRef(null);
    const [visible, setVisible] = useState(false);
    const [categories, setCategories] = useState({});
    const [callbacks, setCallbacks] = useState({});

    function open(categories, onAddAccountItem) {
      setVisible(true);
      setCategories(categories);
      // 创建成功的回调函数
      if (onAddAccountItem) setCallbacks({ onAddAccountItem });
    }

    function handleOk() {
      // 验证金额不能为空
      formRef.current.validateFields().then(fields => {
        let category = categories[fields.category];
        // 根据需求，账单可以为空，这里需要做特殊处理
        let amount = fields.amount;
        let time = fields.time;
        let data = { amount, time };
        if (category) {
          data.type = Number(category.type);
          data.category = category.id;
        } else {
          // 如果账单为空，根据实际输入金额判断收入还是支出
          data.type = 1;
          data.category = 'noname';
        }
        callbacks.onAddAccountItem && callbacks.onAddAccountItem(data);
        handleCancel();
        success({ message: '新建账单成功！' });
      });
    }

    function handleCancel() {
      // 清空表单输入
      formRef.current.resetFields(['amount']);
      setVisible(false);
    }

    return (
      <Fragment>
        <WrappedComponent {...props} openCreateAccountItemModal={open} />
        <Modal title="新建账单" visible={visible} onOk={handleOk} onCancel={handleCancel} width={460}>
          <Form
            ref={formRef}
            labelCol={{ span: 4 }}
            wrapperCol={{ span: 20 }}
            initialValues={{ time: moment() }}
            autoComplete="off">
            <Form.Item label="账单分类" name="category">
              <Select showSearch allowClear placeholder="请选择账单分类" optionFilterProp="children">
                {Object.keys(categories).map(id => {
                  let category = categories[id];
                  return (
                    <Option key={id} value={id}>
                      {category.name}
                    </Option>
                  );
                })}
              </Select>
            </Form.Item>
            <Form.Item label="时间" name="time">
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="金额" name="amount" rules={[{ required: true, message: '请输入金额！' }]}>
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
          </Form>
        </Modal>
      </Fragment>
    );
  }

  return hocComponent;
};

export default withCreateAccountItemModal;
