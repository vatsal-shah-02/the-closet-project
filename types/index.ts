export type WardrobeItem = {
  id: string
  user_id: string
  name: string
  image_url: string
  image_thumbnail_url: string
  type: 'tops' | 'bottoms' | 'dresses' | 'outerwear' | 'shoes' | 'accessories' | 'ethnic'
  ethnic_subtype?: 'saree' | 'kurti' | 'salwar' | 'lehenga' | 'kurta-set' | 'dupatta' | 'other'
  color: string
  colors: string[]
  style: 'casual' | 'smart-casual' | 'formal' | 'ethnic' | 'party' | 'work' | 'athleisure'
  occasion: 'casual' | 'work' | 'formal' | 'party' | 'ethnic' | 'vacation' | 'all'
  season: 'all' | 'summer' | 'winter' | 'monsoon'
  notes: string
  last_worn_at?: string
  wear_count: number
  created_at: string
  updated_at: string
  signed_url?: string
}

export type ClothingTag = {
  name: string
  type: WardrobeItem['type']
  ethnic_subtype?: WardrobeItem['ethnic_subtype']
  color: string
  colors: string[]
  style: WardrobeItem['style']
  occasion: WardrobeItem['occasion']
  season: WardrobeItem['season']
  notes: string
}

export type FilterState = {
  type?: WardrobeItem['type']
  occasion?: WardrobeItem['occasion']
  color?: string
  season?: WardrobeItem['season']
}
