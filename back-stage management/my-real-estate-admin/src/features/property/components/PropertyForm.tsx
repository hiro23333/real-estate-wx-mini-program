/* eslint-disable @typescript-eslint/no-unused-vars */
// src/features/property/components/PropertyForm.tsx

import React, { useEffect, useState } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Upload,
  message,
  Space,
  Col,
  Row,
  type UploadFile,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { getPropertyDetail, saveProperty } from '../services/propertyService';
import type { PropertyFormValues, PropertyDetail, Tag, Community, PropertyImage, PropertyFormPayload } from '../types';
import { type ApiResponseList, type ApiResponseSuccess } from '../../../types/api';
import { getCommunities, getTags } from '../../data-dictionary/services/dictionaryService';
import { customUploadRequest, getOssSignedUrl } from '../../../services/ossService';

interface PropertyFormProps {
  propertyId?: number;
}

const PropertyForm: React.FC<PropertyFormProps> = ({ propertyId }) => {
  const navigate = useNavigate();
  const [communityOptions, setCommunityOptions] = useState<{ value: number; label: string }[]>([]);
  const [tagOptions, setTagOptions] = useState<{ value: number; label: string }[]>([]);

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PropertyFormValues>({
    defaultValues: {
      title: '',
      category: 'sale',
      address: '',
      price: 0,
      house_type: '',
      area: 0,
      floor: '',
      orientation: 'south',
      description: '',
      status: 1,
      community_id: undefined,
      tag_ids: [],
      images: [],
    },
  });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [communityRes, tagRes]: [ApiResponseList<Community>, ApiResponseList<Tag>] = await Promise.all([getCommunities(), getTags()]);
        setCommunityOptions(communityRes.data.list.map((c: Community) => ({ value: c.community_id, label: c.name })));
        setTagOptions(tagRes.data.list.map((t: Tag) => ({ value: t.tag_id, label: t.name })));
      } catch (error) {
        message.error('获取选项列表失败');
      }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    if (propertyId) {
      const fetchPropertyDetail = async () => {
        try {
          const response: ApiResponseSuccess<PropertyDetail> = await getPropertyDetail(propertyId);
          const detail = response.data;
          
          const signedImages = await Promise.all(
            detail.images.map(async (img) => {
              const signedUrl = await getOssSignedUrl(img.oss_path);
              return {
                uid: img.image_id.toString(),
                name: img.oss_path.split('/').pop() || '',
                status: 'done' as const, // 关键修改: 这里进行类型断言
                url: signedUrl,
                thumbUrl: signedUrl,
                response: { url: img.url, oss_path: img.oss_path, id: img.image_id },
              };
            })
          );
          
          reset({
            property_id: detail.property_id,
            title: detail.title,
            category: detail.category,
            address: detail.address,
            price: detail.price,
            house_type: detail.house_type,
            area: detail.area,
            floor: detail.floor,
            orientation: detail.orientation,
            description: detail.description,
            status: detail.status,
            community_id: detail.community_id,
            tag_ids: detail.tags.map(tag => tag.tag_id),
            images: signedImages,
          });
        } catch (error) {
          message.error('获取房源详情失败');
        }
      };
      fetchPropertyDetail();
    } else {
      reset();
    }
  }, [propertyId, reset]);

  const onSubmit = async (data: PropertyFormValues) => {
    try {
      const uploadedImages: PropertyImage[] = data.images.map((file, index) => {
        if (!file.response) {
            throw new Error('图片上传失败，请重试');
        }

        return {
          image_id: file.response.id,
          oss_path: file.response.oss_path,
          url: file.response.url,
          is_primary: index === 0,
          mime_type: file.type || 'image/jpeg',
          sort_order: index + 1,
        };
      });

      const payload: PropertyFormPayload = {
        property_id: data.property_id,
        title: data.title,
        category: data.category,
        address: data.address,
        price: data.price,
        house_type: data.house_type,
        area: data.area,
        floor: data.floor,
        orientation: data.orientation,
        description: data.description,
        status: data.status,
        community_id: data.community_id,
        tag_ids: data.tag_ids,
        images: uploadedImages,
      };
      
      await saveProperty(payload);
      message.success(propertyId ? '房源信息修改成功!' : '房源新增成功!');
      navigate('/properties');
    } catch (error) {
      message.error(`操作失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="房源标题" required validateStatus={errors.title ? 'error' : ''} help={errors.title?.message}>
            <Controller
              name="title"
              control={control}
              rules={{ required: '房源标题是必填项' }}
              render={({ field }) => <Input {...field} placeholder="请输入房源标题" />}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="分类" required validateStatus={errors.category ? 'error' : ''} help={errors.category?.message}>
            <Controller
              name="category"
              control={control}
              rules={{ required: '请选择房源分类' }}
              render={({ field }) => (
                <Select {...field} placeholder="请选择房源分类">
                  <Select.Option value="sale">出售</Select.Option>
                  <Select.Option value="rent">出租</Select.Option>
                  <Select.Option value="commercial">商用</Select.Option>
                </Select>
              )}
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item label="房源地址" required validateStatus={errors.address ? 'error' : ''} help={errors.address?.message}>
        <Controller
          name="address"
          control={control}
          rules={{ required: '房源地址是必填项' }}
          render={({ field }) => <Input {...field} placeholder="请输入房源地址" />}
        />
      </Form.Item>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item label="价格" required validateStatus={errors.price ? 'error' : ''} help={errors.price?.message}>
            <Controller
              name="price"
              control={control}
              rules={{ required: '价格是必填项', min: { value: 0, message: '价格不能为负数' } }}
              render={({ field }) => <InputNumber {...field} placeholder="请输入价格" style={{ width: '100%' }} min={0} />}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="户型" validateStatus={errors.house_type ? 'error' : ''} help={errors.house_type?.message}>
            <Controller
              name="house_type"
              control={control}
              render={({ field }) => <Input {...field} placeholder="如：3室2厅" />}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="面积 (m²)" required validateStatus={errors.area ? 'error' : ''} help={errors.area?.message}>
            <Controller
              name="area"
              control={control}
              rules={{ required: '面积是必填项', min: { value: 1, message: '面积必须大于0' } }}
              render={({ field }) => <InputNumber {...field} placeholder="请输入面积" style={{ width: '100%' }} min={0} />}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item label="楼层" validateStatus={errors.floor ? 'error' : ''} help={errors.floor?.message}>
            <Controller
              name="floor"
              control={control}
              render={({ field }) => <Input {...field} placeholder="如：13层" />}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="朝向" validateStatus={errors.orientation ? 'error' : ''} help={errors.orientation?.message}>
            <Controller
              name="orientation"
              control={control}
              render={({ field }) => (
                <Select {...field} placeholder="请选择朝向" allowClear>
                  <Select.Option value="north">北</Select.Option>
                  <Select.Option value="south">南</Select.Option>
                  <Select.Option value="east">东</Select.Option>
                  <Select.Option value="west">西</Select.Option>
                  <Select.Option value="southeast">东南</Select.Option>
                  <Select.Option value="northeast">东北</Select.Option>
                  <Select.Option value="southwest">西南</Select.Option>
                  <Select.Option value="northwest">西北</Select.Option>
                </Select>
              )}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="状态" required validateStatus={errors.status ? 'error' : ''} help={errors.status?.message}>
            <Controller
              name="status"
              control={control}
              rules={{ required: '请选择房源状态' }}
              render={({ field }) => (
                <Select {...field} placeholder="请选择房源状态">
                  <Select.Option value={1}>上架</Select.Option>
                  <Select.Option value={0}>下架</Select.Option>
                  <Select.Option value={2}>待审核</Select.Option>
                </Select>
              )}
            />
          </Form.Item>
        </Col>
      </Row>
      
      <Form.Item
        label="所属小区"
        required
        validateStatus={errors.community_id ? 'error' : ''}
        help={errors.community_id?.message}
      >
        <Controller
          name="community_id"
          control={control}
          rules={{ required: '所属小区是必填项' }}
          render={({ field }) => (
            <Select {...field} placeholder="请选择所属小区" options={communityOptions} />
          )}
        />
      </Form.Item>

      <Form.Item
        label="标签"
        validateStatus={errors.tag_ids ? 'error' : ''}
        help={errors.tag_ids?.message}
      >
        <Controller
          name="tag_ids"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              mode="multiple"
              maxTagCount={3}
              placeholder="请选择标签（最多3个）"
              options={tagOptions}
            />
          )}
        />
      </Form.Item>

      <Form.Item label="房源描述" validateStatus={errors.description ? 'error' : ''} help={errors.description?.message}>
        <Controller
          name="description"
          control={control}
          render={({ field }) => <Input.TextArea {...field} rows={4} placeholder="请输入房源描述" />}
        />
      </Form.Item>

      <Form.Item
        label="房源图片"
        validateStatus={errors.images ? 'error' : ''}
        help={errors.images?.message}
      >
        <Controller
          name="images"
          control={control}
          rules={{ required: '请上传房源图片' }}
          render={({ field: { onChange, value } }) => (
            <Upload
              listType="picture-card"
              fileList={value}
              customRequest={async (options) => {
                await customUploadRequest({
                  ...options,
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onSuccess: async (res: any) => {
                    const signedUrl = await getOssSignedUrl(res.oss_path);
                    
                    const uploadedFile: UploadFile = {
                      uid: res.id,
                      name: res.oss_path.split('/').pop() || '',
                      status: 'done' as const, // 关键修改: 这里进行类型断言
                      url: signedUrl,
                      thumbUrl: signedUrl,
                      response: res,
                    };
                    
                    const newFileList = [...value.filter(file => file.uid !== uploadedFile.uid), uploadedFile];
                    onChange(newFileList);

                    options.onSuccess?.(uploadedFile); 
                  },
                });
              }}
              onChange={({ fileList }) => onChange?.(fileList)}
              beforeUpload={(file) => {
                const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
                if (!isJpgOrPng) {
                  message.error('只能上传 JPG/PNG 格式的图片!');
                }
                const isLt2M = file.size / 1024 / 1024 < 2;
                if (!isLt2M) {
                  message.error('图片大小不能超过 2MB!');
                }
                return isJpgOrPng && isLt2M;
              }}
            >
              {value && value.length >= 8 ? null : (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>上传</div>
                </div>
              )}
            </Upload>
          )}
        />
        <div style={{ color: 'red', marginTop: 8 }}>
          第一个上传的图片将被视为主图。
        </div>
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={isSubmitting}>
            {propertyId ? '保存修改' : '新增房源'}
          </Button>
          <Button onClick={() => navigate('/properties')}>
            取消
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default PropertyForm;