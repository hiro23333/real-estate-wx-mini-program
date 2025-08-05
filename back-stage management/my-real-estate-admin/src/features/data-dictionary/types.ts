// src/types/dictionary.ts
export interface Community {
  community_id: number;
  name: string;
}

export interface Tag {
  tag_id: number;
  name: string;
}

export type DictionaryItem = Community | Tag;