// src/features/statistics/pages/StatisticsOverviewPage.tsx
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Select, Space, message, Spin } from 'antd';
import { UserOutlined, HomeOutlined, MessageOutlined, CommentOutlined } from '@ant-design/icons';
import { getStatsOverview } from '../services/statisticsService';
import type { StatsOverview, StatsRequestParams } from '../services/statisticsService';

const { Option } = Select;

const StatisticsOverviewPage: React.FC = () => {
  const [statsData, setStatsData] = useState<StatsOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [period, setPeriod] = useState<StatsRequestParams['period']>('daily');

  const fetchStatsData = async (selectedPeriod: StatsRequestParams['period']) => {
    setLoading(true);
    try {
      const response = await getStatsOverview({ period: selectedPeriod });
      if (response.code === 200 && response.data) {
        setStatsData(response.data);
      } else {
        message.error('获取统计数据失败');
      }
    } catch (error) {
      message.error('请求统计数据失败，请稍后再试');
      console.error('Failed to fetch stats overview:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatsData(period);
  }, [period]); // 当 period 变化时重新获取数据

  const handlePeriodChange = (value: StatsRequestParams['period']) => {
    setPeriod(value);
  };

  return (
    <Card
      title="统计概览"
      extra={
        <Space>
          <span>统计周期：</span>
          <Select value={period} style={{ width: 120 }} onChange={handlePeriodChange}>
            <Option value="daily">每日</Option>
            <Option value="weekly">每周</Option>
            <Option value="monthly">每月</Option>
          </Select>
        </Space>
      }
    >
      <Spin spinning={loading} tip="加载中...">
        {statsData ? (
          <Row gutter={16}>
            <Col span={6}>
              <Card>
                <Statistic title="用户总数" value={statsData.users} prefix={<UserOutlined />} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="房源总数" value={statsData.properties} prefix={<HomeOutlined />} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="咨询总数" value={statsData.consultations} prefix={<MessageOutlined />} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="回复总数" value={statsData.replies} prefix={<CommentOutlined />} />
              </Card>
            </Col>
          </Row>
        ) : (
          <p>无统计数据。</p>
        )}
      </Spin>
    </Card>
  );
};

export default StatisticsOverviewPage;