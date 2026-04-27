// 模型数据类型定义
export interface Model {
  id: string;
  title: string;
  creator: string;
  imageUrl: string;
  likes: number;
}

// 假数据 - 7个3D模型
export const MOCK_MODELS: Model[] = [
  {
    id: '1',
    title: 'Geometric Fox',
    creator: 'User123',
    imageUrl: 'https://picsum.photos/seed/fox/400/400',
    likes: 1200,
  },
  {
    id: '2',
    title: 'Eiffel Tower',
    creator: 'MakerPro',
    imageUrl: 'https://picsum.photos/seed/eiffel/400/400',
    likes: 3400,
  },
  {
    id: '3',
    title: 'Articulated Dragon',
    creator: 'CreatorZ',
    imageUrl: 'https://picsum.photos/seed/dragon/400/500',
    likes: 5600,
  },
  {
    id: '4',
    title: 'Minimalist Phone Stand',
    creator: 'DesignGuru',
    imageUrl: 'https://picsum.photos/seed/phone/400/400',
    likes: 2100,
  },
  {
    id: '5',
    title: 'Self-Watering Planter',
    creator: 'GreenThumb',
    imageUrl: 'https://picsum.photos/seed/planter/400/500',
    likes: 980,
  },
  {
    id: '6',
    title: 'Custom Keychain',
    creator: 'CustomPrints',
    imageUrl: 'https://picsum.photos/seed/keychain/400/400',
    likes: 750,
  },
  {
    id: '7',
    title: 'Desk Organizer',
    creator: 'OfficePro',
    imageUrl: 'https://picsum.photos/seed/organizer/400/400',
    likes: 1800,
  },
];

// 格式化点赞数 (如 1200 -> 1.2k)
export function formatLikes(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}
