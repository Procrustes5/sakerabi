import { computed, ref } from 'vue'
import { supabase } from '@/utils/supabase'
import type { Brand, FlavorChart } from '@/types/sake'
import { DEFAULT_FLAVOR_CHART } from '@/constants/flavorLabels'

export function useDailyRecommend() {
  const brands = ref<(Brand & { flavor_chart?: FlavorChart })[]>([]);
  const currentIndex = ref(0);
  const isLoading = ref(true);
  const loadError = ref<string | null>(null);

  const currentBrand = computed(() => brands.value[currentIndex.value] || null);

  const displayFlavorChart = computed(() => {
    return currentBrand.value?.flavor_chart || DEFAULT_FLAVOR_CHART;
  });

  const fetchDailyRecommends = async () => {
    try {
      isLoading.value = true;
      loadError.value = null;

      // 5つのランダムなブランドを取得
      const { data: brandsData, error: brandsError } = await supabase
        .from('random_brands')
        .select('*')
        .limit(5);

      if (brandsError) throw brandsError;

      // 各ブランドのフレーバーチャートを取得
      brands.value = await Promise.all(
        brandsData.map(async (brand) => {
          try {
            const { data: chartData } = await supabase
              .from('flavor_charts')
              .select('*')
              .eq('brand_id', brand.id)
              .single();

            return {
              ...brand,
              flavor_chart: chartData || null
            };
          } catch (error) {
            console.warn(`Failed to fetch flavor chart for brand ${brand.id}:`, error);
            return {
              ...brand,
              flavor_chart: null
            };
          }
        })
      );
    } catch (error) {
      console.error('Error fetching daily recommends:', error);
      loadError.value = '日本酒の情報を取得できませんでした';
    } finally {
      isLoading.value = false;
    }
  };

  const nextSlide = () => {
    currentIndex.value = (currentIndex.value + 1) % brands.value.length;
  };

  const prevSlide = () => {
    currentIndex.value = (currentIndex.value - 1 + brands.value.length) % brands.value.length;
  };

  const setCurrentIndex = (index: number) => {
    currentIndex.value = index;
  };

  const retryLoad = () => {
    fetchDailyRecommends();
  };

  return {
    brands,
    currentIndex,
    currentBrand,
    isLoading,
    loadError,
    displayFlavorChart,
    fetchDailyRecommends,
    nextSlide,
    prevSlide,
    setCurrentIndex,
    retryLoad
  };
}
