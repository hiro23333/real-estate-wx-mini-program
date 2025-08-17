// pages/index/index.ts
import { getTagList, getCommunityList, getFavoritePropertyList } from '../../api/property';
import { Property, Tag, Community } from '../../types/models';
import { getOssSignedUrl } from '../../utils/oss';
import Toast from '@vant/weapp/toast/toast';
import {debounce} from '../../utils/util';

interface PropertyWithSignedUrl extends Property {
    signedUrl?: string;
}

// --- 定义页面的数据类型 ---
interface IndexPageData {
    properties: PropertyWithSignedUrl[];
    loading: boolean;
    finished: boolean;
    page: number;
    pageSize: number;
    searchKeyword: string;
    showFilterPopup: boolean;

    // 筛选条件
    selectedCategory: 'sale' | 'rent' | 'commercial' | '';
    selectedCommunityId: number | null;
    selectedTagIds: number[];

    // 小区和标签数据
    communities: Community[];
    tags: Tag[];
    tagStatusMap: { [key: number]: number };
    sortOrder: 'default' | 'latest' | 'price_asc' | 'price_desc' | 'area_asc' | 'area_desc';
}

// --- 定义自定义方法接口 ---
interface IndexPageMethods {
    onLoad(): void;
    loadTagsAndCommunities(): Promise<void>;
    loadProperties(reset?: boolean, callback?: () => void): Promise<void>;
    onLoadMore(): void;

    onCategorySelect(e: WechatMiniprogram.TouchEvent): void;
    onFilterCategoryTap(e: WechatMiniprogram.TouchEvent): void;
    onTagTap(e: WechatMiniprogram.TouchEvent): void;
    onCommunityTap(e: WechatMiniprogram.TouchEvent): void;

    onSearchChange: (e: WechatMiniprogram.CustomEvent) => void;
    onSearch(): void;
    onFilterTap(): void;
    onCloseFilterPopup(): void;
    onSortOrderChange(e: WechatMiniprogram.CustomEvent): void;
    onResetFilters(): void;
    onApplyFilters(): void;
    onPropertyTap(e: WechatMiniprogram.TouchEvent): void;
}

Page<IndexPageData, IndexPageMethods>({
    data: {
        properties: [],
        loading: false,
        finished: false,
        page: 1,
        pageSize: 10,
        searchKeyword: '',
        showFilterPopup: false,
        selectedCategory: '',
        selectedCommunityId: null,
        selectedTagIds: [],
        communities: [],
        tags: [],
        sortOrder: 'default',
        tagStatusMap: {},
    },

    onLoad() {
        this.loadTagsAndCommunities();
        this.loadProperties(true);
    },

    async loadTagsAndCommunities() {
        try {
            const [tagsRes, communitiesRes] = await Promise.all([
                getTagList(),
                getCommunityList()
            ]);

            if (tagsRes.code === 0 && tagsRes.data) {
                this.setData({ tags: tagsRes.data });
            }
            if (communitiesRes.code === 0 && communitiesRes.data) {
                this.setData({ communities: communitiesRes.data });
            }
        } catch (error) {
            console.error('加载标签或小区失败', error);
        }
    },

    async loadProperties(reset: boolean = false, callback?: () => void) {
        if (reset) {
            this.setData({
                page: 1,
                finished: false,
                properties: []
            });
        }

        if (this.data.loading || this.data.finished) {
            callback?.();
            return;
        }

        this.setData({ loading: true });
        Toast.loading({ message: '加载中...', forbidClick: true });

        try {
            const params = {
                page: this.data.page,
                pageSize: this.data.pageSize,
                category: this.data.selectedCategory || undefined,
                keyword: this.data.searchKeyword || undefined,
                community_id: this.data.selectedCommunityId || undefined,
                tag_ids: this.data.selectedTagIds.length > 0 ? this.data.selectedTagIds : undefined,
                sort_by: this.data.sortOrder,
            };

            const res = await getFavoritePropertyList(params);
            
            if (res.code === 0 && res.data) {
                const newProperties = res.data;
                const propertiesWithSignedUrls = await Promise.all(
                    newProperties.map(async (prop) => ({
                        ...prop,
                        signedUrl: await getOssSignedUrl(prop.image_oss_path)
                    }))
                );

                const updatedProperties = this.data.properties.concat(propertiesWithSignedUrls);
                this.setData({
                    properties: updatedProperties,
                    page: this.data.page + 1,
                    loading: false,
                    finished: newProperties.length < this.data.pageSize
                });
            } else {
                this.setData({ loading: false, finished: true });
            }
        } catch (error) {
            console.error('加载房源失败', error);
            this.setData({ loading: false, finished: true });
        } finally {
            Toast.clear();
            callback?.();
        }
    },

    onLoadMore() {
        if (this.data.loading || this.data.finished) return;
        this.loadProperties();
    },

    onCategorySelect(e: WechatMiniprogram.TouchEvent) {
        const { category } = e.currentTarget.dataset as { category: 'sale' | 'rent' | 'commercial' | '' };
        this.setData({ selectedCategory: category });
        this.loadProperties(true);
    },

    onFilterCategoryTap(e: WechatMiniprogram.TouchEvent) {
        const { category } = e.currentTarget.dataset as { category: 'sale' | 'rent' | 'commercial' | '' };
        this.setData({ selectedCategory: category });
    },

    onTagTap(e: WechatMiniprogram.TouchEvent) {
        const id = e.currentTarget.dataset.id as number;
        const { selectedTagIds, tagStatusMap } = this.data;

        const index = selectedTagIds.indexOf(id);

        if (index > -1) {
            selectedTagIds.splice(index, 1);
            // 移除对应的状态
            delete tagStatusMap[id];
        } else {
            selectedTagIds.push(id);
            // 添加对应的状态
            tagStatusMap[id] = selectedTagIds.length - 1; // 存储索引
        }

        // 通过 setData 更新所有相关数据
        this.setData({
            selectedTagIds,
            tagStatusMap
        });
    },

    onCommunityTap(e: WechatMiniprogram.TouchEvent) {
        // 根据你的测试，dataset.id 已经是 number 类型
        const tappedId = e.currentTarget.dataset.id as number;
        const { selectedCommunityId } = this.data;

        // 如果点击的是当前已选中的社区，则取消选中
        if (tappedId === selectedCommunityId) {
            this.setData({ selectedCommunityId: null });
        } else {
            // 否则，选中新的社区
            this.setData({ selectedCommunityId: tappedId });
        }
    },

    // onSearchChange 使用了防抖函数，无需修改
    onSearchChange: debounce(function (this: any, e: WechatMiniprogram.CustomEvent) {
        this.setData({ searchKeyword: e.detail });
        this.loadProperties(true);
    }, 2000),

    onSearch() {
        this.loadProperties(true);
    },

    onFilterTap() {
        this.setData({ showFilterPopup: true });
    },

    onCloseFilterPopup() {
        this.setData({ showFilterPopup: false });
    },

    onSortOrderChange(e: WechatMiniprogram.CustomEvent) {
        const newSortOrder = e.detail as unknown as 'default' | 'latest' | 'price_asc' | 'price_desc' | 'area_asc' | 'area_desc';
        this.setData({ sortOrder: newSortOrder });
    },

    onResetFilters() {
        this.setData({
            selectedCategory: '',
            selectedCommunityId: null,
            selectedTagIds: [],
            sortOrder: 'default',
        });
        this.onApplyFilters();
    },

    onApplyFilters() {
        this.loadProperties(true);
        this.onCloseFilterPopup();
    },

    onPropertyTap(e) {
        wx.navigateTo({ url: `/pages/property-detail/property-detail?id=${e.detail.propertyId}` });
    },
});