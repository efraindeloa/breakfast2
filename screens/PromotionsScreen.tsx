import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';

type FilterType = 'breakfast' | 'seasonal' | 'vip';

interface Promotion {
  id: string;
  title: string;
  description: string;
  image: string;
  badge: {
    text: string;
    color: string;
  };
  timeRestriction?: string;
  discount?: string;
  category: string;
}

interface AISuggestion {
  title: string;
  description: string;
  image: string;
  buttonText: string;
}

const PromotionsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('breakfast');

  // Promociones principales (carousel)
  const mainPromotions: Promotion[] = [
    {
      id: '1',
      title: '2x1 en Capuchinos',
      description: 'Solo hoy antes de las 11 AM',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB-LjcQbYmHIPRQAwvEJsSVEW_o6MR6wKa4okvLLUG3qDB0JLNmBaT_GQfr35dYzpKxzs2AnzwjahJ43hqhS_YOeiLw4OtI8NAy4BBms3PGwtk8_6MrJ2DCEFqmrwyKHta4Hn23Rpx6xgSZBQIkFsF4a09fe0l5hPpX18wf3ET9WAujUCY-ZbLl_sZEg7brUlp0eibQ2fuOQIM4SYUJbXXhfUbZ5WquMC4TZx8XJAhqosLcR12P-dVK3b-hIzW2w6XpgP_XaGnh_LeE',
      badge: {
        text: 'FLASH SALE',
        color: 'bg-primary'
      },
      timeRestriction: 'Solo hoy antes de las 11 AM',
      category: 'breakfast'
    },
    {
      id: '2',
      title: 'Combo Desayuno Energético',
      description: '¡Empieza el día con energía!',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB2D9whnHofsGEuqVuGbeUA-4nOaMzTCKbulj90wUjxoE5YeXTyhgwEWFDTKihAotKqGv5aHXzGu0uItimdN8pn61yYyU0HerlRFXriLa-aicKNZu8tovQcNE2wyM8xFYlbJTAKPHP-O2Ma0IAeSbrOnUVN0gyDFGjsWoXsugPl6i5RbZ1HapZwCU-abYO7ewA8v3wbjn7KcXRWFAmD9HKyLKRMQCClxLSu0EwD5WmAYyAnB2SPi_JdWuelB2YzeadxpWeRj_8SFMxN',
      badge: {
        text: 'SALUDABLE',
        color: 'bg-green-500'
      },
      category: 'breakfast'
    }
  ];

  // Especiales de temporada
  const seasonalPromotions: Promotion[] = [
    {
      id: '3',
      title: 'Bowl de Temporada',
      description: 'Frutas frescas',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAyO6uSusIQkFnHn2w8Yn_beZI-CuKu5vF_m3FKeDh6qSeb_OGmR3WW_-6UNtrccC2lvK8K8gMmSoGX4CpTZBIpYik6ToeKxbLdYfqQJ6ODQu-A46Up9lRgVbOjQ_IPtu7sNRfgzkU7eBIP6HqAdorp25SO0Mti8ZWeRtmif262Io9a-AhM-8QT_BKw8as3KGHmLmqUzrbmpllRZ52B_G42gm6L1Z_XTVL6j5jPgc8f5eD6bDH0k8bRCuaRf_6563JQnJvNu5V-x2JJ',
      badge: {
        text: '20% OFF',
        color: 'bg-primary'
      },
      discount: '20% OFF',
      category: 'seasonal'
    },
    {
      id: '4',
      title: 'Pan Masa Madre',
      description: 'Artesanal diario',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDdpaSwMhbMYcjwgXMgf-3ky0rCvqxrKpI1_PrSfzT08zMaMFKqe6pOZEww9SF3MUPZXGTpHl6eDmKvPDLyB1KE-AIjmuMYalhQqgKeTs-FBNYQhHDuNHQLjw1a0Lq4zcuv1yTG0XJV_bO8XUkaCYXoC-0EyJehUKoMCkHu_U3GCNrbgbafkThkxk98P2wXWDH9YpyaCBCcxOqe-3h1BkrJiH1z55O0KrFXRzLDPRvW6wnMGQgn1rLU7lr0XMGcNQZnvqqWCP42vc9p',
      badge: {
        text: 'VIP Exclusive',
        color: 'bg-primary'
      },
      category: 'vip'
    },
    {
      id: '5',
      title: 'Smoothie Tropical',
      description: 'Frutas de temporada',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB-LjcQbYmHIPRQAwvEJsSVEW_o6MR6wKa4okvLLUG3qDB0JLNmBaT_GQfr35dYzpKxzs2AnzwjahJ43hqhS_YOeiLw4OtI8NAy4BBms3PGwtk8_6MrJ2DCEFqmrwyKHta4Hn23Rpx6xgSZBQIkFsF4a09fe0l5hPpX18wf3ET9WAujUCY-ZbLl_sZEg7brUlp0eibQ2fuOQIM4SYUJbXXhfUbZ5WquMC4TZx8XJAhqosLcR12P-dVK3b-hIzW2w6XpgP_XaGnh_LeE',
      badge: {
        text: '15% OFF',
        color: 'bg-primary'
      },
      discount: '15% OFF',
      category: 'seasonal'
    },
    {
      id: '6',
      title: 'Café Especial Premium',
      description: 'Edición limitada',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB2D9whnHofsGEuqVuGbeUA-4nOaMzTCKbulj90wUjxoE5YeXTyhgwEWFDTKihAotKqGv5aHXzGu0uItimdN8pn61yYyU0HerlRFXriLa-aicKNZu8tovQcNE2wyM8xFYlbJTAKPHP-O2Ma0IAeSbrOnUVN0gyDFGjsWoXsugPl6i5RbZ1HapZwCU-abYO7ewA8v3wbjn7KcXRWFAmD9HKyLKRMQCClxLSu0EwD5WmAYyAnB2SPi_JdWuelB2YzeadxpWeRj_8SFMxN',
      badge: {
        text: 'VIP Exclusive',
        color: 'bg-primary'
      },
      category: 'vip'
    }
  ];

  // Sugerencia de IA
  const aiSuggestion: AISuggestion = {
    title: t('promotions.aiGiftTitle'),
    description: t('promotions.aiGiftDescription'),
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAPe26_z3cXPLkUipa48N_sO3K9HYSCZDqSVS7rjrXgibOKz2huD_Hn18mR1qXoMnaA8VPxvlF5No5EfH9HdbR4WIIic2UpLGWolt4E9oohzM1QHpK41Vq-3KkJTqt_kEywj5n9y1FNRB5GGI1s3XRGwZEghe_bzVBtdE5ASK-iJ_NSNrw-VVHwnbFoFjWPHD5nLLHaqDiJS23ly7TbsVH5fhq0bEoC2g9mnMeqjwRLhHb7wqr44sANEBEuW1coYqDtugcMQJHxD1ju',
    buttonText: t('promotions.claimNow')
  };

  const filters = [
    { id: 'breakfast' as FilterType, label: t('promotions.breakfast'), icon: 'wb_sunny' },
    { id: 'seasonal' as FilterType, label: t('promotions.seasonal'), icon: 'calendar_today' },
    { id: 'vip' as FilterType, label: t('promotions.vipExclusive'), icon: 'stars' }
  ];

  const filteredMainPromotions = mainPromotions.filter(p => {
    if (selectedFilter === 'breakfast') return p.category === 'breakfast';
    if (selectedFilter === 'seasonal') return p.category === 'seasonal';
    if (selectedFilter === 'vip') return p.category === 'vip';
    return true;
  });

  const filteredSeasonalPromotions = seasonalPromotions.filter(p => {
    if (selectedFilter === 'breakfast') {
      // Cuando el filtro es breakfast, mostrar todas las promociones de temporada
      return true;
    }
    if (selectedFilter === 'seasonal') return p.category === 'seasonal';
    if (selectedFilter === 'vip') return p.category === 'vip';
    return true;
  });

  const handleClaimAIGift = () => {
    // TODO: Implementar lógica para reclamar el regalo de IA
    alert(t('promotions.claimingGift'));
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full max-w-[480px] mx-auto flex-col overflow-x-hidden pb-24 bg-background-light dark:bg-background-dark">
      {/* TopAppBar */}
      <div className="sticky top-0 z-50 flex items-center bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md p-4 pb-2 justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="text-[#181411] dark:text-white flex size-12 shrink-0 items-center justify-center cursor-pointer"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="text-[#181411] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
          {t('promotions.title')}
        </h2>
        <button 
          onClick={() => navigate('/profile')}
          className="flex w-12 items-center justify-end"
        >
          <div className="flex size-12 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-primary/10 text-primary">
            <span className="material-symbols-outlined">account_circle</span>
          </div>
        </button>
      </div>

      {/* Chips / Filters */}
      <div className="flex gap-3 p-4 flex-wrap overflow-x-auto whitespace-nowrap scrollbar-hide [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setSelectedFilter(filter.id)}
            className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 shadow-sm transition-colors ${
              selectedFilter === filter.id
                ? 'bg-primary text-white'
                : 'bg-white dark:bg-[#32281d] border border-gray-100 dark:border-none text-[#181411] dark:text-gray-200'
            }`}
          >
            <span className={`material-symbols-outlined text-[18px] ${selectedFilter === filter.id ? 'text-white' : 'text-primary'}`}>
              {filter.icon}
            </span>
            <p className={`text-sm ${selectedFilter === filter.id ? 'font-semibold' : 'font-medium'}`}>
              {filter.label}
            </p>
          </button>
        ))}
      </div>

      {/* Carousel: Main Offers */}
      <div className="flex overflow-x-auto scroll-smooth [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex items-stretch p-4 gap-4">
          {filteredMainPromotions.map((promotion) => (
            <button
              key={promotion.id}
              onClick={() => navigate(`/promotion-detail/${promotion.id}`)}
              className="flex h-full flex-1 flex-col gap-3 rounded-xl min-w-[280px] text-left cursor-pointer hover:opacity-90 transition-opacity"
            >
              <div 
                className="relative w-full aspect-[16/9] bg-center bg-no-repeat bg-cover rounded-xl shadow-lg"
                style={{ backgroundImage: `url("${promotion.image}")` }}
              >
                <div className={`absolute top-3 left-3 ${promotion.badge.color} text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider`}>
                  {promotion.badge.text}
                </div>
              </div>
              <div>
                <p className="text-[#181411] dark:text-white text-base font-bold leading-normal">
                  {promotion.title}
                </p>
                {promotion.timeRestriction && (
                  <p className="text-[#887563] dark:text-gray-400 text-sm font-medium leading-normal flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    {promotion.timeRestriction}
                  </p>
                )}
                {promotion.description && !promotion.timeRestriction && (
                  <p className="text-[#887563] dark:text-gray-400 text-sm font-medium leading-normal">
                    {promotion.description}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* SectionHeader: IA Suggestion */}
      <div className="flex items-center justify-between px-4 pt-4">
        <h2 className="text-[#181411] dark:text-white text-[20px] font-bold leading-tight tracking-[-0.015em]">
          {t('promotions.aiSuggestion')}
        </h2>
        <span className="material-symbols-outlined text-primary">auto_awesome</span>
      </div>

      {/* Card: Personalized Reward */}
      <div className="px-4 py-2">
        <div className="flex items-stretch justify-between gap-4 rounded-2xl bg-gradient-to-br from-orange-50 to-white dark:from-[#32281d] dark:to-background-dark p-5 border border-primary/20 shadow-xl shadow-primary/5">
          <div className="flex flex-[3_3_0px] flex-col justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1 text-primary text-[10px] font-extrabold uppercase tracking-widest">
                <span className="material-symbols-outlined text-[14px]">psychology</span>
                {t('promotions.personalizedRecommendation')}
              </div>
              <p className="text-[#181411] dark:text-white text-lg font-extrabold leading-tight">
                {aiSuggestion.title}
              </p>
              <p className="text-[#887563] dark:text-gray-400 text-sm font-normal leading-tight">
                {aiSuggestion.description}
              </p>
            </div>
            <button
              onClick={handleClaimAIGift}
              className="flex min-w-[120px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-6 bg-primary text-white text-sm font-bold shadow-lg shadow-primary/30 active:scale-95 transition-transform"
            >
              <span className="truncate">{aiSuggestion.buttonText}</span>
            </button>
          </div>
          <div 
            className="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-xl flex-1 shadow-md border-2 border-white dark:border-[#4a3b2b]"
            style={{ backgroundImage: `url("${aiSuggestion.image}")` }}
          />
        </div>
      </div>

      {/* SectionHeader: Seasonal */}
      <h2 className="text-[#181411] dark:text-white text-[20px] font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-6">
        {t('promotions.seasonalSpecials')}
      </h2>

      {/* Simple Grid for more items */}
      <div className="px-4 grid grid-cols-2 gap-4 pb-24">
        {filteredSeasonalPromotions.map((promotion) => (
          <button
            key={promotion.id}
            onClick={() => navigate(`/promotion-detail/${promotion.id}`)}
            className="bg-white dark:bg-[#32281d] p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-none text-left cursor-pointer hover:opacity-90 transition-opacity"
          >
            <div 
              className="w-full aspect-square bg-cover bg-center rounded-xl mb-2"
              style={{ backgroundImage: `url('${promotion.image}')` }}
            />
            <p className={`text-xs font-bold mb-1 ${promotion.badge.color === 'bg-primary' ? 'text-primary' : 'text-primary'}`}>
              {promotion.discount || promotion.badge.text}
            </p>
            <p className="text-sm font-bold dark:text-white">{promotion.title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{promotion.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PromotionsScreen;
