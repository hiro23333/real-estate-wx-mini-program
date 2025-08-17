// types/models.d.ts
export interface User {
    user_id: number;
    nickname: string;
    avatar_oss_path: string; // OSS path
    phone: string;
}



export interface Banner {
    banner_id: number;
    oss_path: string;
    property_id: number;
}

export interface Tag {
    tag_id: number;
    name: string;
}

export interface Community {
    community_id: number;
    name: string;
}

export interface Property {
    property_id: number;
    title: string;
    category: 'sale' | 'rent' | 'commercial';
    area: number; 
    price: number; 
    publish_time: string;
    community_id: number;
    tags: Tag[];
    image_oss_path: string; // Primary image OSS path
}

export interface PropertyDetail {
    property_id: number;
    title: string;
    category: 'sale' | 'rent' | 'commercial';
    address: string;
    house_type?: string;
    area: number;
    floor?: string;
    price: number; 
    orientation?: string; // 朝向
    description?: string;
    community_id: number;
    tags: Tag[];
    is_favorite: boolean;
    images: {
        oss_path: string;
        sort_order: number;
    }[];
}

export interface Message {
    message_id: number;
    property_id: string;
    property_title: string;
    content: string;
    is_replied: boolean;
    replied_content?: string;
}

export interface OssCredentials {
    accessKeyId: string;
    securityToken: string;
    region: string;
    bucket: string;
    endpoint: string;
    policy: string;
    signature: string;
}

export interface SubmitPropertyParams {
    title: string;
    category: 'sale' | 'rent' | 'commercial';
    address: string;
    house_type?: string;
    area: number; 
    floor?: string;
    price: number; 
    orientation?: 'north' | 'south' | 'east' | 'west' | 'southeast' | 'northeast' | 'southwest' | 'northwest'; // 朝向
    description?: string;
    community_id: number;
    tags: number[];
    images: {
        image_id: string; 
        oss_path: string;
        is_primary: boolean;
        url: string;
        mime_type: string;
        sort_order: number;
      }[];
}


