import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { useRestaurant } from '../contexts/RestaurantContext';

const CouponDetailScreen: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { selectedRestaurant } = useRestaurant();

  // Datos del cupón (en producción vendría de un contexto o API)
  const getCouponData = (couponId: string | undefined) => {
    const coupons: Record<string, any> = {
      '1': {
        title: t('coupons.birthdayGift'),
        description: t('coupons.validFor7Days'),
        icon: 'cake',
        iconColor: 'text-primary',
        bgColor: 'bg-primary/10',
        qrCode: 'QR_BIRTHDAY_2024'
      },
      '2': {
        title: t('coupons.coffee10'),
        description: t('coupons.nextPurchase'),
        icon: 'coffee',
        iconColor: 'text-orange-400',
        bgColor: 'bg-orange-100 dark:bg-orange-900/20',
        qrCode: 'QR_COFFEE_10'
      },
      '3': {
        title: t('coupons.toast2x1'),
        description: t('coupons.weekendsOnly'),
        icon: 'breakfast_dining',
        iconColor: 'text-yellow-500',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/10',
        qrCode: 'QR_TOAST_2X1'
      }
    };
    return coupons[couponId || '1'] || coupons['1'];
  };

  const coupon = getCouponData(id);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background-light dark:bg-background-dark font-display text-[#181411] dark:text-white min-h-screen">
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
            {t('coupons.couponDetail')}
          </h2>
          <div className="w-12"></div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-4 py-8">
        {/* Cupón ampliado */}
        <div className="w-full max-w-sm bg-white dark:bg-[#2d241a] rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden relative">
          <div className={`h-48 ${coupon.bgColor} flex items-center justify-center`}>
            <div className="bg-white dark:bg-[#2d241a] p-4 rounded-lg shadow-sm">
              <span className={`material-symbols-outlined ${coupon.iconColor} text-7xl`}>
                {coupon.icon}
              </span>
            </div>
          </div>
          
          {/* Perforation line effect */}
          <div className="absolute top-48 -left-3 -right-3 flex justify-between px-3">
            <div className="w-6 h-6 rounded-full bg-background-light dark:bg-background-dark -mt-3"></div>
            <div className="w-full border-t-2 border-dashed border-background-light dark:border-background-dark mt-0"></div>
            <div className="w-6 h-6 rounded-full bg-background-light dark:bg-background-dark -mt-3"></div>
          </div>
          
          <div className="p-6 pt-8 text-center">
            <p className="text-sm text-[#887563] dark:text-gray-400 uppercase tracking-wider font-semibold mb-3">
              {selectedRestaurant}
            </p>
            <h4 className="font-bold text-2xl text-[#181411] dark:text-white mb-2">{coupon.title}</h4>
            <p className="text-base text-[#887563] dark:text-gray-400 mb-6">{coupon.description}</p>
            
            {/* QR Code ampliado */}
            <div className="bg-background-light dark:bg-background-dark p-6 rounded-lg inline-block mb-4">
              <div className="bg-white dark:bg-[#2d241a] p-4 rounded-lg">
                <span className="material-symbols-outlined text-6xl text-[#181411] dark:text-white">qr_code_2</span>
              </div>
            </div>
            
            <p className="text-xs uppercase tracking-widest text-[#887563] dark:text-gray-400">
              {t('coupons.showQRToStaff')}
            </p>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-6 w-full max-w-sm">
          <div className="bg-white dark:bg-[#2d241a] rounded-xl p-4 border border-gray-100 dark:border-gray-800">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary">info</span>
              <div className="flex-1">
                <p className="text-sm text-[#181411] dark:text-white font-medium mb-1">
                  {t('coupons.howToUse')}
                </p>
                <p className="text-xs text-[#887563] dark:text-gray-400">
                  {t('coupons.howToUseDescription')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CouponDetailScreen;
