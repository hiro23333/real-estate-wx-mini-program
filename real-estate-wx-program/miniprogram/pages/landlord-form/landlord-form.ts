import { getCommunityList, getTagList, submitProperty, uploadPropertyImages } from '../../api/property';
import Toast from '@vant/weapp/toast/toast';
import { Tag, Community, SubmitPropertyParams } from '../../types/models';

Page({
    data: {
        // 表单数据
        formData: {
            title: '',
            category: 'rent' as 'rent' | 'sale' | 'commercial',
            address: '',
            house_type: '',
            area: 0,
            floor: '',
            price: 0,
            orientation: 'south' as 'north' | 'south' | 'east' | 'west' | 'southeast' | 'northeast' | 'southwest' | 'northwest',
            description: '',
            community_id: 0,
            tags: [] as number[],
        },

        displayValues: {
            communityName: '请选择',
            categoryName: '出租',
            orientationName: '南',
            tagNames: [] as string[],
            priceLabel: '月租(元)'
        },

        // 选择器数据
        communities: [] as Community[],
        tags: [] as Tag[],
        orientations: [
            { name: '南', value: 'south' },
            { name: '北', value: 'north' },
            { name: '东', value: 'east' },
            { name: '西', value: 'west' },
            { name: '东南', value: 'southeast' },
            { name: '东北', value: 'northeast' },
            { name: '西南', value: 'southwest' },
            { name: '西北', value: 'northwest' }
        ],
        categorys: [
            { name: '出租', value: 'rent' },
            { name: '出售', value: 'sale' },
            { name: '商业', value: 'commercial' },
        ],
        // 显示用数据
        communityNames: [] as string[],
        tagNames: [] as string[],
        orientationNames: [] as string[],
        categoryNames: [] as string[],

        // 图片相关
        fileList: [] as Array<{
            url: string
            status?: 'uploading' | 'done' | 'failed'
            message?: string
        }>,
        submitImages: [] as SubmitPropertyParams['images'],

        // UI状态
        showCommunityPicker: false,
        showTagPicker: false,
        showOrientationPicker: false,
        showCategoryPicker: false,
    },

    onLoad() {
        this.loadOptions();
    },

    // 加载小区和标签数据
    async loadOptions() {
        try {
            const [communitiesRes, tagsRes] = await Promise.all([
                getCommunityList(),
                getTagList()
            ]);

            this.setData({
                communities: communitiesRes.data,
                tags: tagsRes.data,
                communityNames: communitiesRes.data.map(c => c.name),
                tagNames: tagsRes.data.map(t => t.name),
                orientationNames: this.data.orientations.map(o => o.name),
                categoryNames: this.data.categorys.map(o => o.name),
            });
        } catch (error) {
            Toast.fail('加载选项失败');
        }
    },

    // 监听表单数据变化
    onFormDataChange() {
        this.updateDisplayValues();
    },

    // 更新所有显示值
    updateDisplayValues() {
        const { formData, communities, tags, orientations, categorys } = this.data;

        this.setData({
            displayValues: {
                communityName: communities.find(c => c.community_id === formData.community_id)?.name || '请选择',
                categoryName: categorys.find(o => o.value === formData.category)?.name || '请选择',
                orientationName: orientations.find(o => o.value === formData.orientation)?.name || '请选择',
                tagNames: tags.filter(t => formData.tags.includes(t.tag_id)).map(t => t.name),
                priceLabel: formData.category === 'rent' ? '月租(元)' : '售价(元)'
            }
        });
    },

    // 字段变更处理
    onFieldChange(e: WechatMiniprogram.Input) {
        const { field } = e.currentTarget.dataset;
        this.setData({
            [`formData.${field}`]: e.detail
        }, () => this.onFormDataChange());
    },

    // 选择小区
    onSelectCommunity(e: any) {
        this.setData({
            'formData.community_id': e.detail.index + 1,
        }, () => this.onFormDataChange());
        this.setData({ showCommunityPicker: false });
    },

    // 选择标签
    onTagConfirm(e: any) {
        const selected = e.detail.index.map((i: number) => this.data.tags[i].tag_id);
        this.setData({
            'formData.tags': selected
        }, () => this.onFormDataChange());
        this.setData({ showTagPicker: false });
    },

    // 选择朝向
    onOrientationConfirm(e: any) {
        const { orientations } = this.data;
        this.setData({
            'formData.orientation': orientations.find(o => o.name === e.detail.value)?.value
        }, () => this.onFormDataChange());
        this.setData({ showOrientationPicker: false });
    },

    onCategoryConfirm(e: any) {
        const { categorys } = this.data;
        this.setData({
            'formData.category': categorys.find(o => o.name === e.detail.value)?.value
        }, () => this.onFormDataChange());
        this.setData({ showCategoryPicker: false });
    },



    onShowCommunityPicker() {
        this.setData({ showCommunityPicker: true });
    },

    onShowTagPicker() {
        this.setData({ showTagPicker: true });
    },

    onShowOrientationPicker() {
        this.setData({ showOrientationPicker: true });
    },

    onShowCategoryPicker() {
        this.setData({ showCategoryPicker: true });
    },

    // 隐藏选择器方法
    onCancelCommunityPicker() {
        this.setData({ showCommunityPicker: false });
    },

    onCancelTagPicker() {
        this.setData({ showTagPicker: false });
    },

    onCancelOrientationPicker() {
        this.setData({ showOrientationPicker: false });
    },

    onCancelCategoryPicker() {
        this.setData({ showCategoryPicker: false });
    },

    // 提交表单（包含完整验证）
    async onSubmit() {
        if (!this.validateForm()) return;

        try {
            Toast.loading('提交中...');

            await submitProperty({
                ...this.data.formData,
                images: this.data.submitImages
            });

            Toast.success('提交成功');
            setTimeout(() => wx.navigateBack(), 1500);
        } catch (error) {
            Toast.fail(error.message || '提交失败');
        }
    },

    // 表单验证
    validateForm(): boolean {
        const {
            title,
            address,
            area,
            price,
            community_id,
            house_type
        } = this.data.formData;

        if (!title.trim()) {
            Toast.fail('请输入房源标题');
            return false;
        }

        if (!address.trim()) {
            Toast.fail('请输入详细地址');
            return false;
        }

        if (area <= 0) {
            Toast.fail('请输入有效面积');
            return false;
        }

        if (price <= 0) {
            Toast.fail('请输入有效价格');
            return false;
        }

        if (community_id <= 0) {
            Toast.fail('请选择所属小区');
            return false;
        }

        if (!house_type.trim()) {
            Toast.fail('请输入户型信息');
            return false;
        }

        if (this.data.submitImages.length === 0) {
            Toast.fail('请上传至少一张图片');
            return false;
        }
        return true;
    },

    async onAfterRead(e: any) {
        const { file } = e.detail;
        //如果出现警告<wx-image>: 图片链接 <URL> 不再支持 HTTP 协议，请升级到 HTTPS，这是van-weapp组件传给的，改不了，请无视
        
        // 更新UI状态
        this.setData({
            fileList: [...this.data.fileList, {
                url: file.url,
                status: 'uploading',
                message: '上传中...'
            }]
        });
    
        try {
            const uploadedImages = await uploadPropertyImages([file.url]);
            
            this.setData({
                submitImages: [...this.data.submitImages, ...uploadedImages],
                fileList: this.data.fileList.map(item => 
                    item.url === file.url 
                        ? { ...item, status: 'done', url: uploadedImages[0].url }
                        : item
                )
            });
        } catch (error) {
            this.setData({
                fileList: this.data.fileList.map(item => 
                    item.url === file.url
                        ? { ...item, status: 'failed', message: error.message }
                        : item
                )
            });
        }
    },

    // 删除图片
    onDeleteImage(e: any) {
        const { index } = e.detail;
        const deletedImage = this.data.submitImages[index];

        this.setData({
            fileList: this.data.fileList.filter((_, i) => i !== index),
            submitImages: this.data.submitImages.filter((_, i) => i !== index),
        }, () => {
            // 如果删除的是主图，设置新的主图
            if (deletedImage.is_primary && this.data.submitImages.length > 0) {
                this.setData({
                    'submitImages[0].is_primary': true
                });
            }
        });
    },

    // 手动设置主图
    onSetPrimaryImage(e: WechatMiniprogram.TouchEvent) {
        const { index } = e.currentTarget.dataset;
        this.setData({
            submitImages: this.data.submitImages.map((img, i) => ({
                ...img,
                is_primary: i === index
            }))
        });
    }
});

