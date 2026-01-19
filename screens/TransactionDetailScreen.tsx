import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';

interface Transaction {
  id: number;
  restaurantName: string;
  date: string;
  amount: string;
  logo: string;
  cardLast4: string;
  orderId: number;
  subtotal: string;
  tip: string;
  tipPercentage?: number;
  iva: string;
  total: string;
  paymentMethod: 'card' | 'cash';
  invoiceSent: boolean;
  invoiceEmail?: string;
}

const TransactionDetailScreen: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();

  // Datos de ejemplo - En producción esto vendría de una API o contexto
  const transactions: Transaction[] = [
    {
      id: 1,
      restaurantName: 'Don Kamaron Restaurant',
      date: 'Hoy, 8:45 AM',
      amount: '$97.65',
      logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBc2H-XYiq7VOCFCpx2cuCePgbQE7ZDrkxgLFu-itmo_MSFUGuJ4MEK9gfv4p-Lur7DUSWI21FL7WjRrLtfWx6nu7z0mjAn2bhClTodzDi-pzY6r3wzdPoDRYMS1cM7ZBlUns8GzyAI7djeA6qN2gngbm8XYIbP5M6fXO48cdOauM5hZYsfaZ6Mxl204e6c5lXbMZh9Shgmz6nScvzItmVrWwCvhFVLdRbJtmqHe_EdQndGNhwA5EeplOu2NO9sXkEhh-WocuJ1KcoU',
      cardLast4: '4242',
      orderId: 1,
      subtotal: '$77.50',
      tip: '$7.75',
      tipPercentage: 10,
      iva: '$12.40',
      total: '$97.65',
      paymentMethod: 'card',
      invoiceSent: true,
      invoiceEmail: 'juan.perez@empresa.com',
    },
    {
      id: 2,
      restaurantName: 'Don Kamaron Restaurant',
      date: 'Ayer, 7:30 PM',
      amount: '$58.95',
      logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBc2H-XYiq7VOCFCpx2cuCePgbQE7ZDrkxgLFu-itmo_MSFUGuJ4MEK9gfv4p-Lur7DUSWI21FL7WjRrLtfWx6nu7z0mjAn2bhClTodzDi-pzY6r3wzdPoDRYMS1cM7ZBlUns8GzyAI7djeA6qN2gngbm8XYIbP5M6fXO48cdOauM5hZYsfaZ6Mxl204e6c5lXbMZh9Shgmz6nScvzItmVrWwCvhFVLdRbJtmqHe_EdQndGNhwA5EeplOu2NO9sXkEhh-WocuJ1KcoU',
      cardLast4: '8888',
      orderId: 2,
      subtotal: '$45.00',
      tip: '$6.75',
      tipPercentage: 15,
      iva: '$7.20',
      total: '$58.95',
      paymentMethod: 'card',
      invoiceSent: false,
    },
    {
      id: 3,
      restaurantName: 'Café del Sol',
      date: '22 Oct, 10:02 AM',
      amount: '$41.92',
      logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBc2H-XYiq7VOCFCpx2cuCePgbQE7ZDrkxgLFu-itmo_MSFUGuJ4MEK9gfv4p-Lur7DUSWI21FL7WjRrLtfWx6nu7z0mjAn2bhClTodzDi-pzY6r3wzdPoDRYMS1cM7ZBlUns8GzyAI7djeA6qN2gngbm8XYIbP5M6fXO48cdOauM5hZYsfaZ6Mxl204e6c5lXbMZh9Shgmz6nScvzItmVrWwCvhFVLdRbJtmqHe_EdQndGNhwA5EeplOu2NO9sXkEhh-WocuJ1KcoU',
      cardLast4: '4242',
      orderId: 3,
      subtotal: '$32.00',
      tip: '$4.80',
      tipPercentage: 15,
      iva: '$5.12',
      total: '$41.92',
      paymentMethod: 'cash',
      invoiceSent: true,
      invoiceEmail: 'maria.garcia@empresa.com',
    },
    {
      id: 4,
      restaurantName: 'Don Kamaron Restaurant',
      date: '20 Oct, 6:45 PM',
      amount: '$28.88',
      logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBc2H-XYiq7VOCFCpx2cuCePgbQE7ZDrkxgLFu-itmo_MSFUGuJ4MEK9gfv4p-Lur7DUSWI21FL7WjRrLtfWx6nu7z0mjAn2bhClTodzDi-pzY6r3wzdPoDRYMS1cM7ZBlUns8GzyAI7djeA6qN2gngbm8XYIbP5M6fXO48cdOauM5hZYsfaZ6Mxl204e6c5lXbMZh9Shgmz6nScvzItmVrWwCvhFVLdRbJtmqHe_EdQndGNhwA5EeplOu2NO9sXkEhh-WocuJ1KcoU',
      cardLast4: '8888',
      orderId: 4,
      subtotal: '$24.90',
      tip: '$0.00',
      tipPercentage: 0,
      iva: '$3.98',
      total: '$28.88',
      paymentMethod: 'card',
      invoiceSent: false,
    },
    {
      id: 5,
      restaurantName: 'La Panadería Artesanal',
      date: '18 Oct, 1:20 PM',
      amount: '$21.76',
      logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBkUTW04rD1StMdw5VuFmivxCsbvN_VFjrpbP1fqnSpdDL84rU6b3Mm6VZOi1IGaMZZSGyhRpeuhIyuBuI2qoIJnrvssVJjWywIGD53-994UzA3AXankHvqmjFerRER3Xtv8vI4AXqh2K8rN1puxxdNFmj94DJHZyLW_ViLJYZiW-DiUZ_Z8LlJVyPu-o9dZ004NABiXUsqXvcel_zsQBdyc13Vm9JsBE1FHo2kwkmYEHAejYBBBKvLwheTiiwnprPzmk1jwASDobqC',
      cardLast4: '4242',
      orderId: 5,
      subtotal: '$16.00',
      tip: '$3.20',
      tipPercentage: 20,
      iva: '$2.56',
      total: '$21.76',
      paymentMethod: 'card',
      invoiceSent: true,
      invoiceEmail: 'juan.perez@empresa.com',
    },
    {
      id: 6,
      restaurantName: 'Brunch & Co.',
      date: '15 Oct, 11:30 AM',
      amount: '$37.34',
      logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDNanplizQsqu_AWgfvOvcfFVNxOTL41X1kCPX1xvEMEsYo9o0WTi5Zp4q-4XKvx8ixXcz9vsSZrCafyWPVQjOxr0skT0HWuaKy2QIBpPU9lHutFSJgkLDlcksL-7CNVKdtkKJaxm4-_Qf-9Zs8CHDtVEK_nLT9Lvx2F1w3rR5aJ0_sVNdNhSKOeqx2atLUGjzVCZnSpfVYviNGCLiGQ8ScYzXfPiY-fLU0OJrfN2_RXnrYGklyPMwO4hkStBj8oI_4Dc0breu5o4hK',
      cardLast4: '4242',
      orderId: 6,
      subtotal: '$28.50',
      tip: '$4.28',
      tipPercentage: 15,
      iva: '$4.56',
      total: '$37.34',
      paymentMethod: 'cash',
      invoiceSent: false,
    },
  ];

  const transaction = transactions.find(t => t.id === parseInt(id || '0'));

  if (!transaction) {
    return (
      <div className="pb-32 overflow-y-auto bg-background-light dark:bg-background-dark min-h-screen">
        <header className="flex items-center bg-white dark:bg-background-dark p-4 pb-2 justify-between sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800 safe-top">
          <button onClick={() => navigate(-1)} className="size-10 rounded-full bg-[#F5F0E8] dark:bg-[#3d3321] flex items-center justify-center hover:bg-[#E8E0D0] dark:hover:bg-[#4a3f2d] transition-colors shadow-sm">
            <span className="material-symbols-outlined cursor-pointer text-[#8a7560] dark:text-[#d4c4a8]">arrow_back_ios</span>
          </button>
          <h2 className="text-lg font-bold flex-1 text-center">{t('transactionDetail.title')}</h2>
          <div className="w-12"></div>
        </header>
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-4xl text-gray-400">error</span>
          </div>
          <h3 className="text-lg font-bold text-[#181411] dark:text-white mb-2">{t('transactionDetail.notFound')}</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
            {t('transactionDetail.notFoundMessage')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-32 overflow-y-auto bg-background-light dark:bg-background-dark min-h-screen">
      <header className="flex items-center bg-white dark:bg-background-dark p-4 pb-2 justify-between sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800 safe-top">
        <button onClick={() => navigate(-1)} className="size-10 rounded-full bg-[#F5F0E8] dark:bg-[#3d3321] flex items-center justify-center hover:bg-[#E8E0D0] dark:hover:bg-[#4a3f2d] transition-colors shadow-sm">
          <span className="material-symbols-outlined cursor-pointer text-[#8a7560] dark:text-[#d4c4a8]">arrow_back_ios</span>
        </button>
        <h2 className="text-lg font-bold flex-1 text-center">{t('transactionDetail.title')}</h2>
        <div className="w-12"></div>
      </header>

      <div className="px-4 py-6">
        {/* Información del Restaurante */}
        <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
              <img 
                src={transaction.logo} 
                alt={transaction.restaurantName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  if (target.parentElement) {
                    target.parentElement.innerHTML = '<span class="material-symbols-outlined text-primary text-2xl">restaurant</span>';
                  }
                }}
              />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-[#181411] dark:text-white">{transaction.restaurantName}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{transaction.date}</p>
            </div>
          </div>
        </div>

        {/* Resumen de Montos */}
        <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl p-4 mb-4">
          <h4 className="font-semibold text-[#181411] dark:text-white mb-4">{t('transactionDetail.amountSummary')}</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">{t('transactionDetail.subtotal')}:</span>
              <span className="font-semibold text-[#181411] dark:text-white">{transaction.subtotal}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-gray-600 dark:text-gray-400">{t('transactionDetail.tip')}:</span>
                {transaction.tipPercentage && transaction.tipPercentage > 0 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">({transaction.tipPercentage}%)</span>
                )}
              </div>
              <span className="font-semibold text-[#181411] dark:text-white">{transaction.tip}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">{t('transactionDetail.tax')}:</span>
              <span className="font-semibold text-[#181411] dark:text-white">{transaction.iva}</span>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg text-[#181411] dark:text-white">{t('transactionDetail.total')}:</span>
                <span className="font-bold text-xl text-primary">{transaction.total}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Método de Pago */}
        <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl p-4 mb-4">
          <h4 className="font-semibold text-[#181411] dark:text-white mb-4">{t('transactionDetail.paymentMethod')}</h4>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-xl">
                {transaction.paymentMethod === 'card' ? 'credit_card' : 'payments'}
              </span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[#181411] dark:text-white">
                {transaction.paymentMethod === 'card' ? t('transactionDetail.card') : t('transactionDetail.cash')}
              </p>
              {transaction.paymentMethod === 'card' && (
                <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                  **** **** **** {transaction.cardLast4}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Información de Factura */}
        <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl p-4">
          <h4 className="font-semibold text-[#181411] dark:text-white mb-4">{t('transactionDetail.invoiceInformation')}</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">{t('transactionDetail.invoiceSent')}:</span>
              <div className="flex items-center gap-2">
                {transaction.invoiceSent ? (
                  <>
                    <span className="material-symbols-outlined text-green-500 text-sm">check_circle</span>
                    <span className="font-semibold text-green-600 dark:text-green-400 text-sm">{t('common.yes')}</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-gray-400 text-sm">cancel</span>
                    <span className="font-semibold text-gray-500 dark:text-gray-400 text-sm">{t('common.no')}</span>
                  </>
                )}
              </div>
            </div>
            {transaction.invoiceSent && transaction.invoiceEmail && (
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('transactionDetail.email')}:</p>
                <p className="font-semibold text-[#181411] dark:text-white">{transaction.invoiceEmail}</p>
              </div>
            )}
          </div>
        </div>

        {/* Botón para ver orden relacionada */}
        <button
          onClick={() => navigate(`/order-history?orderId=${transaction.orderId}`)}
          className="mt-4 w-full py-3 px-4 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <span className="material-symbols-outlined text-base">receipt_long</span>
          {t('transactionDetail.viewRelatedOrder')}
        </button>
      </div>
    </div>
  );
};

export default TransactionDetailScreen;
