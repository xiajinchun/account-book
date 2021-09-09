import React, { useEffect, useState } from 'react';
import { readRemoteFile } from 'react-papaparse';
import { Table, DatePicker, Select, Button, Card } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import moment from 'moment';

import withCreateAccountItemModal from '@components/withCreateAccountItemModal';
import * as common from './common';
import './index.scss';

const { Option } = Select;

function App(props) {
  const [categories, setCategories] = useState({});
  const [dataSource, setDataSource] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentTab, setCurrentTab] = useState('detail');

  useEffect(() => {
    loadDatasource();
  }, []);

  // 加载元数据
  function loadDatasource() {
    // 开发环境直接通过 webpack server 读取，正式环境应是后台返回或者是线上文件地址
    readRemoteFile('/data/categories.csv', {
      complete: results => {
        // 类别格式 {id: '0fnhbcle6hg', type: '0', name: '房屋租赁'}
        let categories = common.transferCSVParsingResultToMap(results, 0);
        categories['noname'] = { id: 'noname', type: 1, name: '未命名' };
        setCategories(categories);
      }
    });

    readRemoteFile('/data/bill.csv', {
      complete: results => {
        setDataSource(common.transferCSVParsingResultToArray(results));
      }
    });
  }

  // 获取账单详情 columns
  function getDetailColumns() {
    let columns = [
      {
        title: '账单分类',
        dataIndex: 'category',
        key: 'category',
        render: key => {
          let category = categories[key] || {};
          return <span>{category.name || '未命名'}</span>;
        }
      },
      {
        title: '金额',
        dataIndex: 'amount',
        key: 'amount',
        sorter: {
          compare: (a, b) => a.amount - b.amount
        },
        render: (amount, row = {}) => {
          // 根据账单类别和金额来判断是收入还是支出，实际金额小于 0 为支出，大于 0 为收入
          let type = row.type;
          amount = type == 0 ? amount * -1 : amount;
          return <span style={{ color: amount > 0 ? 'red' : '' }}>{common.formatAmount(amount, true, '')}</span>;
        }
      },
      {
        title: '时间',
        dataIndex: 'time',
        key: 'time',
        defaultSortOrder: 'descend',
        sorter: {
          compare: (a, b) => a.time - b.time
        },
        render: time => {
          return <span>{moment(Number(time)).format()}</span>;
        }
      }
    ];
    return columns;
  }

  // 获取账单统计 columns
  function getSummaryColumns() {
    let columns = [
      {
        title: '账单分类',
        dataIndex: 'category',
        key: 'category',
        render: key => {
          let category = categories[key] || {};
          return <span>{category.name || '未命名'}</span>;
        }
      },
      {
        title: '支出笔数',
        dataIndex: 'count',
        key: 'count',
        sorter: {
          compare: (a, b) => a.count - b.count
        }
      },
      {
        title: '支出金额',
        dataIndex: 'amount',
        defaultSortOrder: 'descend',
        sorter: {
          compare: (a, b) => a.amount - b.amount
        },
        render: amount => common.formatAmount(amount)
      }
    ];
    return columns;
  }

  function onMonthChange(month) {
    setSelectedMonth(month ? month.format('yyyy-MM') : '');
  }

  function onCategoryChange(category) {
    setSelectedCategory(category);
  }

  // 高阶函数打开创建账单 modal
  function openCreateAccountItemModal() {
    props.openCreateAccountItemModal(categories, onAddAccountItem);
  }

  function onAddAccountItem(item) {
    dataSource.push(item);
    setDataSource([...dataSource]);
  }

  function getFilteredItems() {
    let items = dataSource || [];
    // 如果没有选择月份和类别直接返回全部数据
    if (!selectedMonth && !selectedCategory) return items;

    let startTime = 0;
    let endTime = 0;

    if (selectedMonth) {
      startTime = moment(selectedMonth).valueOf();
      endTime = moment(selectedMonth).add(1, 'M').valueOf();
    }

    items = items.filter(item => {
      let selected = false;
      if (selectedMonth) {
        selected = item.time >= startTime && item.time < endTime;
      } else {
        selected = true;
      }
      if (!selected) return selected;
      if (selectedCategory) {
        selected = item.category == selectedCategory;
      } else {
        selected = true;
      }
      return selected;
    });
    return items;
  }

  let filteredItems = getFilteredItems();

  function renderDetailFooter() {
    let totalIncome = 0;
    let totalOutcome = 0;
    let count = 0;

    // 遍历已经过滤的明细进行统计
    filteredItems.map(item => {
      let type = item.type;
      let amount = item.amount;
      count += 1;
      amount = type == 0 ? amount * -1 : amount;
      if (amount >= 0) {
        totalIncome += Math.abs(amount);
      } else {
        totalOutcome += Math.abs(amount);
      }
    });
    return (
      <>
        <span style={{ marginRight: 20 }}>共 {count} 笔</span>
        <span style={{ marginRight: 20 }}>总收入：{common.formatAmount(totalIncome)}</span>
        <span>总支出：{common.formatAmount(totalOutcome)}</span>
      </>
    );
  }

  function getSummaryItems() {
    let items = filteredItems || [];
    let categoryMap = {};
    items.forEach(item => {
      // {type: 0, time: '1561910400000', category: '8s0p77c323', amount: '5400', id: 1}
      // 根据账单类别和金额来判断是收入还是支出，实际金额小于 0 为支出，大于 0 为收入
      let type = item.type;
      let amount = Number(item.amount);
      amount = type == 0 ? amount * -1 : amount;
      // 这里只统计支出
      if (amount >= 0) return;

      let currentCategory = categoryMap[item.category];
      if (currentCategory) {
        categoryMap[item.category] = {
          category: item.category,
          count: currentCategory.count + 1,
          amount: Math.abs(currentCategory.amount) + Math.abs(amount)
        };
      } else {
        categoryMap[item.category] = { category: item.category, count: 1, amount: Math.abs(amount) };
      }
    });

    return Object.values(categoryMap);
  }

  let summaryItems = getSummaryItems();

  function renderSummaryFooter() {
    let total = 0;
    let count = 0;

    summaryItems.forEach(item => {
      total = total + Math.abs(item.amount);
      count = count + item.count;
    });

    return (
      <>
        <span style={{ marginRight: 20 }}>共 {count} 笔 </span>
        <span>总支出：{common.formatAmount(total)}</span>
      </>
    );
  }

  return (
    <div className="account-book">
      <h1>简易记账本</h1>
      <div className="actions flex-box align-items-center justify-content-space-between">
        <div className="flex-box align-items-center">
          <span>月份：</span>
          <DatePicker onChange={onMonthChange} picker="month" />
        </div>
        <div className="flex-box align-items-center">
          <span>账单分类：</span>
          <Select
            showSearch
            allowClear
            style={{ width: 200 }}
            placeholder="请选择分类"
            optionFilterProp="children"
            onChange={onCategoryChange}>
            {Object.keys(categories).map(id => {
              let category = categories[id];
              return (
                <Option key={id} value={id}>
                  {category.name}
                </Option>
              );
            })}
          </Select>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateAccountItemModal}>
          新建账单
        </Button>
      </div>

      <Card
        style={{ width: '100%' }}
        tabList={[
          { key: 'detail', tab: '账单明细' },
          { key: 'summary', tab: '分类统计' }
        ]}
        activeTabKey={currentTab}
        onTabChange={key => {
          setCurrentTab(key);
        }}>
        {currentTab == 'detail' && (
          <Table
            rowKey="id"
            dataSource={filteredItems}
            columns={getDetailColumns()}
            size="middle"
            pagination={false}
            footer={renderDetailFooter}
          />
        )}

        {currentTab == 'summary' && (
          <Table
            rowKey="id"
            dataSource={summaryItems}
            columns={getSummaryColumns()}
            size="middle"
            pagination={false}
            footer={renderSummaryFooter}
          />
        )}
      </Card>
    </div>
  );
}

export default withCreateAccountItemModal(App);
