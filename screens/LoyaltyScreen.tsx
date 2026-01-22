import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { useLoyalty } from '../contexts/LoyaltyContext';

const LoyaltyScreen: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    totalPoints,
    currentLevel,
    pointsToNextLevel,
    progressToNextLevel,
    nextLevel,
    getMonthlyGrowth
  } = useLoyalty();

  // Obtener nombres de niveles traducidos
  const getLevelName = (level: string) => {
    return t(`loyalty.levels.${level}`);
  };

  const getNextLevelName = () => {
    if (!nextLevel) return '';
    return getLevelName(nextLevel);
  };

  // Formatear número con separador de miles
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const monthlyGrowth = getMonthlyGrowth();

  // Beneficios del nivel actual
  const getCurrentLevelBenefits = () => {
    const benefits = {
      bronze: [
        { icon: 'coffee', title: t('loyalty.benefits.welcome'), description: t('loyalty.benefits.welcomeDesc') },
        { icon: 'local_offer', title: t('loyalty.benefits.discount'), description: t('loyalty.benefits.discountDesc') }
      ],
      silver: [
        { icon: 'coffee', title: t('loyalty.benefits.freeCoffee'), description: t('loyalty.benefits.validBranches') },
        { icon: 'bakery_dining', title: t('loyalty.benefits.pastry2x1'), description: t('loyalty.benefits.tuesdays') },
        { icon: 'celebration', title: t('loyalty.benefits.birthday'), description: t('loyalty.benefits.specialDessert') }
      ],
      gold: [
        { icon: 'coffee', title: t('loyalty.benefits.freeCoffee'), description: t('loyalty.benefits.validBranches') },
        { icon: 'bakery_dining', title: t('loyalty.benefits.pastry2x1'), description: t('loyalty.benefits.tuesdays') },
        { icon: 'celebration', title: t('loyalty.benefits.birthday'), description: t('loyalty.benefits.specialDessert') },
        { icon: 'card_giftcard', title: t('loyalty.benefits.gift'), description: t('loyalty.benefits.giftDesc') }
      ],
      platinum: [
        { icon: 'coffee', title: t('loyalty.benefits.freeCoffee'), description: t('loyalty.benefits.validBranches') },
        { icon: 'bakery_dining', title: t('loyalty.benefits.pastry2x1'), description: t('loyalty.benefits.tuesdays') },
        { icon: 'celebration', title: t('loyalty.benefits.birthday'), description: t('loyalty.benefits.specialDessert') },
        { icon: 'card_giftcard', title: t('loyalty.benefits.gift'), description: t('loyalty.benefits.giftDesc') },
        { icon: 'star', title: t('loyalty.benefits.priority'), description: t('loyalty.benefits.priorityDesc') }
      ]
    };
    return benefits[currentLevel] || benefits.bronze;
  };

  // Formas de ganar puntos
  const earningOptions = [
    {
      id: 'refer',
      icon: 'person_add',
      title: t('loyalty.earning.refer'),
      description: t('loyalty.earning.referDesc'),
      points: 100,
      type: 'points' as const
    },
    {
      id: 'profile',
      icon: 'edit_note',
      title: t('loyalty.earning.completeProfile'),
      description: t('loyalty.earning.completeProfileDesc'),
      points: 50,
      type: 'points' as const
    },
    {
      id: 'healthy',
      icon: 'local_dining',
      title: t('loyalty.earning.orderFit'),
      description: t('loyalty.earning.orderFitDesc'),
      points: 'x2',
      type: 'multiplier' as const
    }
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background-light dark:bg-background-dark text-[#181711] dark:text-white min-h-screen pb-24">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md flex items-center p-4 justify-between border-b border-[#e6e4db] dark:border-[#3a372a]">
        <button
          onClick={() => navigate(-1)}
          className="text-[#181711] dark:text-white flex size-10 shrink-0 items-center justify-start"
        >
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </button>
        <h2 className="text-[#181711] dark:text-white text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-10">
          {t('loyalty.title')}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Points Hero Section */}
        <div className="flex flex-col items-center pt-8 pb-4 px-4">
          <div className="relative flex items-center justify-center">
            {/* Points Circle */}
            <div 
              className="w-56 h-56 rounded-full border-4 border-primary flex flex-col items-center justify-center bg-white dark:bg-[#2d2a1a] transition-all"
              style={{
                boxShadow: '0 0 40px rgba(245, 214, 61, 0.3)',
                background: 'radial-gradient(circle at center, #ffffff 0%, #fffdf0 100%)'
              }}
            >
              <p className="text-[#8a8360] dark:text-[#c0ba9d] text-sm font-bold uppercase tracking-widest">
                {t('loyalty.totalPoints')}
              </p>
              <p className="text-[#181711] dark:text-white text-5xl font-extrabold leading-none my-2">
                {formatNumber(totalPoints)}
              </p>
              {monthlyGrowth > 0 && (
                <div className="flex items-center gap-1 text-[#078814] text-sm font-bold">
                  <span className="material-symbols-outlined text-sm">trending_up</span>
                  <span>+{monthlyGrowth}% {t('loyalty.thisMonth')}</span>
                </div>
              )}
            </div>
            {/* Decorative Sparkles */}
            <div className="absolute -top-2 -right-2 text-primary">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                auto_awesome
              </span>
            </div>
          </div>
        </div>

        {/* VIP Status Header & Progress */}
        <div className="px-4 py-2">
          <div className="bg-white dark:bg-[#2d2a1a] rounded-xl p-5 shadow-sm border border-[#e6e4db] dark:border-[#3a372a]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    workspace_premium
                  </span>
                </div>
                <div>
                  <p className="text-[#181711] dark:text-white text-xl font-bold leading-none">
                    {getLevelName(currentLevel)}
                  </p>
                  {nextLevel && (
                    <p className="text-[#8a8360] dark:text-[#c0ba9d] text-xs mt-1">
                      {t('loyalty.nextLevel')}: {getNextLevelName()}
                    </p>
                  )}
                </div>
              </div>
              {nextLevel && (
                <div className="text-right">
                  <p className="text-xs font-bold text-[#8a8360] dark:text-[#c0ba9d] uppercase">
                    {t('loyalty.missing')}
                  </p>
                  <p className="text-lg font-bold text-[#181711] dark:text-white">
                    {formatNumber(pointsToNextLevel)} {t('loyalty.points')}
                  </p>
                </div>
              )}
            </div>
            {/* Progress Bar */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-[#8a8360] uppercase">{t('loyalty.progress')}</span>
                <span className="text-xs font-bold text-[#181711] dark:text-white">{progressToNextLevel}%</span>
              </div>
              <div className="h-3 rounded-full bg-[#e6e4db] dark:bg-[#3a372a] overflow-hidden">
                <div 
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${progressToNextLevel}%`,
                    boxShadow: '0 0 10px rgba(245,214,61,0.5)'
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Benefits */}
        <div className="mt-4">
          <div className="flex items-center justify-between px-4 pb-3 pt-5">
            <h2 className="text-[#181711] dark:text-white text-xl font-bold leading-tight tracking-tight">
              {t('loyalty.myLevelBenefits')}
            </h2>
            <button className="text-sm font-bold text-[#8a8360]">
              {t('loyalty.seeAll')}
            </button>
          </div>
          <div className="flex overflow-x-auto gap-4 px-4 pb-4 no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {getCurrentLevelBenefits().map((benefit, index) => (
              <div
                key={index}
                className="flex-none w-40 bg-white dark:bg-[#2d2a1a] p-4 rounded-xl border border-[#e6e4db] dark:border-[#3a372a]"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-3">
                  <span className="material-symbols-outlined">{benefit.icon}</span>
                </div>
                <p className="text-[#181711] dark:text-white text-sm font-bold leading-snug">{benefit.title}</p>
                <p className="text-[#8a8360] text-xs mt-1">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section: How to earn points */}
        <div className="mt-4 px-4 pb-6">
          <h2 className="text-[#181711] dark:text-white text-xl font-bold leading-tight tracking-tight pb-3 pt-5">
            {t('loyalty.howToEarn')}
          </h2>
          <div className="space-y-3">
            {earningOptions.map((option) => (
              <div
                key={option.id}
                className="flex items-center justify-between p-4 bg-white dark:bg-[#2d2a1a] rounded-xl border border-[#e6e4db] dark:border-[#3a372a]"
              >
                <div className="flex items-center gap-4">
                  <div className="text-[#8a8360]">
                    <span className="material-symbols-outlined">{option.icon}</span>
                  </div>
                  <div>
                    <p className="text-[#181711] dark:text-white text-sm font-bold">{option.title}</p>
                    <p className="text-[#8a8360] text-xs">{option.description}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full ${option.type === 'multiplier' ? 'bg-primary' : 'bg-primary/20'}`}>
                  <p className={`text-xs font-bold ${option.type === 'multiplier' ? 'text-white' : 'text-[#181711]'}`}>
                    {typeof option.points === 'number' ? `+${option.points}` : option.points}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoyaltyScreen;
