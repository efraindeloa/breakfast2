import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { useRestaurant } from '../contexts/RestaurantContext';

interface Coupon {
  id: string;
  title: string;
  description: string;
  validFor: string;
  icon: string;
  iconColor: string;
  bgColor: string;
  qrCode: string;
}

interface ReferralStats {
  totalReferrals: number;
  weeklyReferrals: number;
  pointsEarned: number;
  equivalentReward: string;
}

const CouponsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { selectedRestaurant } = useRestaurant();
  const [referralCode] = useState('BREAKFAST2024');
  const [showCopied, setShowCopied] = useState(false);

  // Cupones del usuario (datos de ejemplo)
  const coupons: Coupon[] = [
    {
      id: '1',
      title: t('coupons.birthdayGift'),
      description: t('coupons.validFor7Days'),
      validFor: '7',
      icon: 'cake',
      iconColor: 'text-primary',
      bgColor: 'bg-primary/10',
      qrCode: 'QR_BIRTHDAY_2024'
    },
    {
      id: '2',
      title: t('coupons.coffee10'),
      description: t('coupons.nextPurchase'),
      validFor: '30',
      icon: 'coffee',
      iconColor: 'text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      qrCode: 'QR_COFFEE_10'
    },
    {
      id: '3',
      title: t('coupons.toast2x1'),
      description: t('coupons.weekendsOnly'),
      validFor: '14',
      icon: 'breakfast_dining',
      iconColor: 'text-yellow-500',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/10',
      qrCode: 'QR_TOAST_2X1'
    }
  ];

  // Estadísticas de referidos (datos de ejemplo)
  const referralStats: ReferralStats = {
    totalReferrals: 12,
    weeklyReferrals: 2,
    pointsEarned: 6000,
    equivalentReward: t('coupons.equivalentToCoffees').replace('{count}', '3')
  };

  // Copiar código al portapapeles
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  // Compartir código
  const handleShareCode = async () => {
    const shareText = t('coupons.shareMessage', { code: referralCode });
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('coupons.shareTitle'),
          text: shareText
        });
      } catch (err) {
        console.error('Error al compartir:', err);
      }
    } else {
      // Fallback: copiar al portapapeles
      await navigator.clipboard.writeText(shareText);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }
  };

  // Ampliar cupón (mostrar QR grande)
  const handleCouponClick = (coupon: Coupon) => {
    // Por ahora solo navega, pero podría abrir un modal con el QR ampliado
    navigate(`/coupon-detail/${coupon.id}`);
  };

  // Obtener saludo según hora del día
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('coupons.goodMorning');
    if (hour < 18) return t('coupons.goodAfternoon');
    return t('coupons.goodEvening');
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background-light dark:bg-background-dark font-display text-[#181411] dark:text-white min-h-screen pb-24">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
        <div className="flex items-center p-4 pb-2 justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-primary flex size-12 shrink-0 items-center justify-center"
          >
            <span className="material-symbols-outlined text-3xl">arrow_back_ios</span>
          </button>
          <h2 className="text-[#181411] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
            {t('coupons.title')}
          </h2>
          <div className="flex w-12 items-center justify-end">
            <button className="flex size-10 cursor-pointer items-center justify-center rounded-full bg-white dark:bg-[#2d241a] shadow-sm border border-gray-100 dark:border-gray-800">
              <span className="material-symbols-outlined text-[#181411] dark:text-white">notifications</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Horizontal Carousel Section */}
        <div className="mt-4">
          <div className="flex items-center justify-between px-4 mb-3">
            <h3 className="text-[#181411] dark:text-white text-lg font-bold">{t('coupons.yourCoupons')}</h3>
            <button className="text-primary text-sm font-semibold">{t('coupons.seeAll')}</button>
          </div>
          <div 
            className="flex overflow-x-auto snap-x snap-mandatory px-4 gap-4 pb-4 [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {coupons.map((coupon) => (
              <div
                key={coupon.id}
                onClick={() => handleCouponClick(coupon)}
                className="snap-start flex-none w-72 bg-white dark:bg-[#2d241a] rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden relative cursor-pointer hover:shadow-xl transition-shadow"
              >
                <div className={`h-32 ${coupon.bgColor} flex items-center justify-center`}>
                  <div className="bg-white dark:bg-[#2d241a] p-2 rounded-lg shadow-sm">
                    <span className={`material-symbols-outlined ${coupon.iconColor} text-5xl`}>
                      {coupon.icon}
                    </span>
                  </div>
                </div>
                {/* Perforation line effect */}
                <div className="absolute top-32 -left-3 -right-3 flex justify-between px-3">
                  <div className="w-6 h-6 rounded-full bg-background-light dark:bg-background-dark -mt-3"></div>
                  <div className="w-full border-t-2 border-dashed border-background-light dark:border-background-dark mt-0"></div>
                  <div className="w-6 h-6 rounded-full bg-background-light dark:bg-background-dark -mt-3"></div>
                </div>
                <div className="p-5 pt-6 text-center">
                  <p className="text-xs text-[#887563] dark:text-gray-400 uppercase tracking-wider font-semibold mb-2">
                    {selectedRestaurant}
                  </p>
                  <h4 className="font-bold text-lg text-[#181411] dark:text-white">{coupon.title}</h4>
                  <p className="text-sm text-[#887563] dark:text-gray-400 mt-1">{coupon.description}</p>
                  <div className="mt-4 bg-background-light dark:bg-background-dark p-3 rounded-lg inline-block">
                    <span className="material-symbols-outlined text-4xl text-[#181411] dark:text-white">qr_code_2</span>
                  </div>
                  <p className="text-[10px] uppercase tracking-widest mt-2 text-primary font-bold">
                    {t('coupons.tapToEnlarge')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Referral Section */}
        <div className="px-4 mt-8">
          <div className="bg-primary/10 dark:bg-primary/20 rounded-2xl p-6 border border-primary/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary text-white p-2 rounded-lg">
                <span className="material-symbols-outlined">group_add</span>
              </div>
              <div>
                <h3 className="font-bold text-lg text-[#181411] dark:text-white">{t('coupons.referFriend')}</h3>
                <p className="text-sm text-[#887563] dark:text-gray-300">{t('coupons.earnPointsBreakfast')}</p>
              </div>
            </div>
            <p className="text-[#181411] dark:text-gray-200 text-sm mb-6">
              {t('coupons.referDescription')} <span className="font-bold text-primary">500 {t('coupons.points')}</span> {t('coupons.referDescriptionEnd')}
            </p>
            <div className="bg-white dark:bg-[#2d241a] rounded-xl border border-primary/30 p-4 flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-[#887563] dark:text-gray-400">
                  {t('coupons.yourUniqueCode')}
                </p>
                <p className="text-xl font-bold tracking-widest text-primary">{referralCode}</p>
              </div>
              <button
                onClick={handleCopyCode}
                className="bg-primary/10 dark:bg-primary/30 p-2 rounded-lg text-primary hover:bg-primary/20 transition-colors"
                title={t('coupons.copy')}
              >
                <span className="material-symbols-outlined">
                  {showCopied ? 'check' : 'content_copy'}
                </span>
              </button>
            </div>
            <button
              onClick={handleShareCode}
              className="w-full bg-primary text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-md hover:opacity-90 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-xl">share</span>
              {t('coupons.shareCode')}
            </button>
          </div>
        </div>

        {/* Points Status */}
        <div className="px-4 mt-8 pb-10">
          <h3 className="text-[#181411] dark:text-white text-lg font-bold mb-4">{t('coupons.referralStatus')}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-[#2d241a] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
              <p className="text-[#887563] dark:text-gray-400 text-xs font-medium uppercase tracking-wider">
                {t('coupons.referrals')}
              </p>
              <p className="text-2xl font-bold mt-1 text-[#181411] dark:text-white">{referralStats.totalReferrals}</p>
              <div className="mt-2 text-xs text-green-500 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">trending_up</span>
                +{referralStats.weeklyReferrals} {t('coupons.thisWeek')}
              </div>
            </div>
            <div className="bg-white dark:bg-[#2d241a] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
              <p className="text-[#887563] dark:text-gray-400 text-xs font-medium uppercase tracking-wider">
                {t('coupons.pointsEarned')}
              </p>
              <p className="text-2xl font-bold mt-1 text-[#181411] dark:text-white">
                {referralStats.pointsEarned.toLocaleString()}
              </p>
              <div className="mt-2 text-xs text-primary font-medium">{referralStats.equivalentReward}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CouponsScreen;
