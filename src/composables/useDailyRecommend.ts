import { ref, computed } from 'vue';
import { supabase } from '@/utils/supabase';
import type { Brand, FlavorChart } from '@/types/sake';
import { PLACEHOLDER_TAGS, DEFAULT_FLAVOR_CHART } from '@/constants/flavorLabels';

export function useDailyRecommend() {
  const brand = ref<Brand | null>(null);
  const flavorChart = ref<FlavorChart | null>(null);
  const isLoading = ref(true);
  const loadError = ref<string | null>(null);

  const displayFlavorChart = computed(() => {
    return flavorChart.value || DEFAULT_FLAVOR_CHART;
  });

  const fetchDailyRecommend = async () => {
    try {
      isLoading.value = true;
      loadError.value = null;

      // ランダムにブランドを1つ取得
      const { data: brandData, error: brandError } = await supabase
        .from('random_brands')
        .select('*')
        .limit(1)
        .single();

      if (brandError) throw brandError;
      brand.value = brandData;

      if (brandData) {
        // フレーバーチャートを取得（エラーが発生しても続行）
        try {
          const { data: chartData } = await supabase
            .from('flavor_charts')
            .select('*')
            .eq('brand_id', brandData.id)
            .single();

          if (chartData) {
            flavorChart.value = chartData;
          }
        } catch (error) {
          console.warn('Failed to fetch flavor chart:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching daily recommend:', error);
      loadError.value = '日本酒の情報を取得できませんでした';
    } finally {
      isLoading.value = false;
    }
  };

  const retryLoad = () => {
    fetchDailyRecommend();
  };

  return {
    brand,
    flavorChart,
    isLoading,
    loadError,
    displayFlavorChart,
    fetchDailyRecommend,
    retryLoad
  };
}
