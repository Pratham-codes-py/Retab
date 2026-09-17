export const dynamic = 'force-dynamic';

import { createSupabaseServerClient } from '@/lib/supabase/ssr-server';
import { getActiveCafe } from '@/lib/active-cafe';
import MenuClient from './menu-client';


export default async function MenuManagementPage() {
  const supabase = await createSupabaseServerClient();
  const { cafe } = await getActiveCafe();
  const cafeId = cafe?.id || null;


  if (!cafeId) {
    return <MenuClient cafeId="" initialCategories={[]} initialItems={[]} />;
  }

  // Fetch categories
  const { data: dbCategories } = await supabase
    .from('categories')
    .select('*')
    .eq('cafe_id', cafeId)
    .order('created_at', { ascending: true });

  // Fetch menu items
  const { data: items } = await supabase
    .from('menu_items')
    .select('id, name, price, category, is_veg, created_at')
    .eq('cafe_id', cafeId)
    .order('created_at', { ascending: false });

  const formattedItems = (items || []).map((i: any) => ({
    id: i.id,
    name: i.name,
    price: Number(i.price),
    category: i.category || 'Uncategorised',
    is_veg: i.is_veg !== false
  }));

  const categoriesList = dbCategories || [];

  // Extract unique category names from menu items
  const uniqueItemCategories = Array.from(new Set(formattedItems.map(i => i.category)))
    .filter(cat => cat && cat !== 'Uncategorised');

  // Merge unique categories from menu items into categoriesList
  uniqueItemCategories.forEach(name => {
    if (!categoriesList.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      categoriesList.push({
        id: name,
        name: name,
        cafe_id: cafeId
      });
    }
  });

  return (
    <MenuClient
      cafeId={cafeId}
      initialCategories={categoriesList}
      initialItems={formattedItems}
    />
  );
}
