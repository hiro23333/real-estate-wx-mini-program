// src/features/banner/pages/BannerManagementPage.tsx
import React, { useState, useEffect } from 'react';
import { Card, Button, message, Table, Modal, Form, Upload, Space, Image, Spin, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UpOutlined } from '@ant-design/icons';
import { getBanners, saveBanners, type SaveBannerPayloadItem, type Banner } from '../services/bannerService';
import { customUploadRequest, getOssSignedUrl } from '../../../services/ossService';
import type { TableProps } from 'antd';
import type { ApiResponseList } from '../../../types/api';
import type { OssUploadResponse } from '../../../services/ossService';

// 定义一个 BannerItem 类型，用于页面状态管理
interface BannerItem extends Partial<Banner> {
  key: string;
}

// 定义表单字段的类型
interface BannerFormValues {
  property_id: number;
  image_id: string;
  oss_path: string;
  url: string;
}

const BannerManagementPage: React.FC = () => {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);
  const [form] = Form.useForm<BannerFormValues>();
  const maxBannerCount = 5;

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const bannerResponse: ApiResponseList<Banner> = await getBanners();
      // 在这里添加新的逻辑来生成临时 URL
      const fetchedBannersWithSignedUrls = await Promise.all(
        bannerResponse.data.list.map(async (item: Banner) => {
          // 使用 getOssSignedUrl 根据 oss_path 生成临时 URL
          const signedUrl = await getOssSignedUrl(item.image.oss_path);
          return {
            key: item.image.image_id,
            ...item,
            image: {
              ...item.image,
              url: signedUrl, // 将临时 URL 赋值给 url 字段
            },
          };
        })
      );

      setBanners(fetchedBannersWithSignedUrls);
    } catch (error) {
      message.error('获取 Banner 列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleEdit = (banner: BannerItem) => {
    setEditingBanner(banner);
    form.setFieldsValue({
      property_id: banner.property_id,
      image_id: banner.image?.image_id,
      oss_path: banner.image?.oss_path,
      url: banner.image?.url,
    });
    setIsModalVisible(true);
  };

  const handleAdd = () => {
    if (banners.length >= maxBannerCount) {
      message.warning(`最多只能设置 ${maxBannerCount} 个 Banner`);
      return;
    }
    setEditingBanner(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleSave = async (values: BannerFormValues) => {
    setIsSubmitting(true);
    try {
      let updatedBanners;
      
      const newBannerData: BannerItem = {
        key: editingBanner?.image?.image_id || `new-${Date.now()}`,
        banner_id: editingBanner?.banner_id,
        property_id: values.property_id,
        image: {
          image_id: values.image_id,
          oss_path: values.oss_path,
          url: values.url,
          mime_type: 'image/jpeg',
        },
      };

      if (editingBanner) {
        updatedBanners = banners.map(item =>
          item.key === editingBanner.key ? newBannerData : item
        );
      } else {
        updatedBanners = [...banners, newBannerData];
      }
      
      const payload: SaveBannerPayloadItem[] = updatedBanners.map(item => ({
        banner_id: item.banner_id,
        property_id: item.property_id!,
        image: item.image!,
      }));

      await saveBanners(payload);
      
      message.success('Banner 配置更新成功！');
      setIsModalVisible(false);
      
      fetchBanners();
    } catch (error) {
      message.error('Banner 配置更新失败');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newBanners = [...banners];
    const itemToMove = newBanners[index];
    newBanners.splice(index, 1);
    newBanners.splice(index - 1, 0, itemToMove);
    
    setBanners(newBanners);
    
    const payload: SaveBannerPayloadItem[] = newBanners.map(item => ({
      banner_id: item.banner_id,
      property_id: item.property_id!,
      image: item.image!,
    }));
    try {
        await saveBanners(payload);
        message.success('Banner 顺序调整成功！');
        fetchBanners();
    } catch (error) {
        message.error('Banner 顺序调整失败');
        console.error(error);
        fetchBanners();
    }
  };

  const handleDelete = async (banner: BannerItem) => {
    try {
      const updatedBanners = banners.filter(item => item.key !== banner.key);
      const payload: SaveBannerPayloadItem[] = updatedBanners.map(item => ({
        banner_id: item.banner_id,
        property_id: item.property_id!,
        image: item.image!,
      }));
      await saveBanners(payload);
      message.success('Banner 删除成功！');
      fetchBanners();
    } catch (error) {
      message.error('Banner 删除失败');
      console.error(error);
    }
  };

  const columns: TableProps<BannerItem>['columns'] = [
    {
      title: '序号',
      key: 'index',
      render: (_, __, index) => index + 1,
      width: 80,
    },
    {
      title: '图片',
      dataIndex: ['image', 'url'], // 修正: 使用嵌套的 image.url 作为图片地址
      key: 'url',
      render: (url: string) => (
        url ? <Image src={url} width={120} height={60} style={{ objectFit: 'cover' }} /> : '无图片'
      ),
      width: 150,
    },
    {
      title: '关联房源编号',
      dataIndex: 'property_id',
      key: 'property_id',
      render: (property_id: number) => property_id || '未关联房源',
    },
    {
        title: '关联房源标题',
        dataIndex: 'property_title',
        key: 'property_title',
        render: () => '暂无数据',
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record, index) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>修改</Button>
          <Button icon={<UpOutlined />} disabled={index === 0} onClick={() => handleMoveUp(index)}>上移</Button>
          <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record)}>删除</Button>
        </Space>
      ),
      width: 200,
    },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCustomUpload = async (options: any) => {
  const { onSuccess, onError, file } = options;

  try {
    await customUploadRequest({
      file,
      onSuccess: async (res: OssUploadResponse) => {
        // --- 关键修改开始 ---
        // 1. 上传成功后，利用返回的 oss_path，生成一个带签名的临时 URL
        const signedUrl = await getOssSignedUrl(res.oss_path);
        
        // 2. 使用这个临时的 signedUrl 来更新表单的 'url' 字段
        form.setFieldsValue({
          oss_path: res.oss_path,
          image_id: res.id,
          url: signedUrl, // 使用签名后的 URL
        });
        
        // 3. 告诉 Ant Design Upload 上传成功，并传递完整响应
        message.success(`${(file as File).name} 上传成功！`);
        onSuccess(res);
        // --- 关键修改结束 ---
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onError: (err: any) => {
        message.error(`${(file as File).name} 上传失败`);
        onError(err);
      },
      onProgress: () => {},
      headers: {},
    });
  } catch (error) {
    message.error(`${(file as File).name} 上传失败`);
    console.error(error);
    if (error instanceof Error) {
      onError(error);
    } else {
      onError(new Error(String(error)));
    }
  }
};
  
  const beforeUpload = (file: File) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('只能上传 JPG/PNG 格式的图片!');
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('图片大小不能超过 2MB!');
    }
    return isJpgOrPng && isLt2M;
  };

  return (
    <Card
      title="Banner 管理"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          disabled={banners.length >= maxBannerCount}
        >
          新增 Banner
        </Button>
      }
    >
      <Spin spinning={loading} tip="加载中...">
        <Table
          columns={columns}
          dataSource={banners}
          rowKey="key"
          pagination={false}
          locale={{ emptyText: "暂无 Banner 数据" }}
        />
      </Spin>
      <Modal
        title={editingBanner ? "修改 Banner" : "新增 Banner"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleSave} layout="vertical">
          {/* 上传图片的 Form.Item，注意这里 name="image_id" 是为了让表单管理图片ID */}
          <Form.Item
            label="上传图片"
            name="image_id"
            rules={[{ required: true, message: "请上传图片" }]}
            valuePropName="file" // 这是一个占位符，并不直接与 Upload 组件关联
          >
            <Upload
              accept="image/*"
              showUploadList={false}
              listType="picture-card"
              customRequest={handleCustomUpload}
              beforeUpload={beforeUpload}
            >
              {/*
                关键修改：使用一个新的无样式 Form.Item 来显式监听 url 字段变化，
                并根据其值来渲染图片预览或上传按钮
                */}
              <Form.Item
                noStyle
                shouldUpdate={(prev, next) => prev.url !== next.url}
              >
                {() => {
                  const currentUrl = form.getFieldValue("url");
                  return currentUrl ? (
                    <Image
                      src={currentUrl}
                      style={{
                        maxWidth: "100%",
                        height: "auto",
                        maxHeight: 200,
                      }}
                    />
                  ) : (
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>上传</div>
                    </div>
                  );
                }}
              </Form.Item>
            </Upload>
            <Form.Item name="url" noStyle />
            <Form.Item name="oss_path" noStyle />
          </Form.Item>

          <Form.Item
            label="对应房源编号"
            name="property_id"
            rules={[{ required: true, message: "请输入对应房源编号" }]}
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder="请输入房源编号"
              min={1}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={isSubmitting}
              style={{ float: "right" }}
            >
              保存
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default BannerManagementPage;