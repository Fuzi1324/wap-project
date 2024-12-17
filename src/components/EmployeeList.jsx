import React, { useState } from 'react';
import { List, Input, Space, Table, Typography, Tag } from 'antd';
import dayjs from 'dayjs';

const { Search } = Input;
const { Text } = Typography;

const EmployeeList = ({ 
  users, 
  onWeeklyHoursChange, 
  onSaveWeeklyHours,
  onVacationDaysChange,
  onSaveVacationDays,
}) => {
  const [searchText, setSearchText] = useState('');

  const columns = [
    {
      title: 'Name',
      key: 'name',
      sorter: (a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`),
      render: (_, record) => (
        <Space>
          {`${record.first_name} ${record.last_name}`}
          {record.role === 'admin' && <Tag color="blue">Admin</Tag>}
        </Space>
      ),
      filteredValue: [searchText],
      onFilter: (value, record) => 
        `${record.first_name} ${record.last_name}`
          .toLowerCase()
          .includes(value.toLowerCase())
    },
    {
      title: 'Wochenstunden',
      dataIndex: 'weeklyHours',
      key: 'weeklyHours',
      width: 150,
      sorter: (a, b) => (a.weeklyHours || 0) - (b.weeklyHours || 0),
      render: (text, record) => (
        <Input
          type="number"
          value={text || ''}
          onChange={(e) => {
            onWeeklyHoursChange(record._id, e.target.value);
            onSaveWeeklyHours(record._id, e.target.value);
          }}
          style={{ width: 100 }}
        />
      )
    },
    {
      title: 'Urlaubstage',
      dataIndex: 'vacationDays',
      key: 'vacationDays',
      width: 150,
      sorter: (a, b) => (a.vacationDays || 0) - (b.vacationDays || 0),
      render: (text, record) => (
        <Input
          type="number"
          value={text || 25}
          onChange={(e) => {
            onVacationDaysChange(record._id, e.target.value);
            onSaveVacationDays(record._id, e.target.value);
          }}
          style={{ width: 100 }}
        />
      )
    },
    {
      title: 'Geplanter Urlaub',
      key: 'vacationPeriods',
      render: (_, record) => {
        const periods = record.vacationPeriods || [];

        return (
          <Space direction="vertical" size="small">
            {periods.map((period, idx) => (
              <Tag key={idx} color="orange">
                {dayjs(period.startDate).format('DD.MM')} - {dayjs(period.endDate).format('DD.MM.YY')}
              </Tag>
            ))}
          </Space>
        );
      }
    }
  ];

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: 16 }}>
        <Search
          placeholder="Mitarbeiter suchen..."
          onChange={e => setSearchText(e.target.value)}
          style={{ maxWidth: 400 }}
        />
        <Text style={{ marginLeft: 16, color: 'rgba(0, 0, 0, 0.45)' }}>
          {users.length} Mitarbeiter gesamt
        </Text>
      </div>

      <Table 
        columns={columns}
        dataSource={users}
        rowKey="_id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} von ${total} Mitarbeitern`
        }}
        scroll={{ x: 'max-content' }}
      />
    </div>
  );
};

export default EmployeeList;