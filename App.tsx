
import React, { useState } from 'react';
import { HashRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import WelcomeScreen from './screens/WelcomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import BillingDataScreen from './screens/BillingDataScreen';
import UploadConstanciaScreen from './screens/UploadConstanciaScreen';
import EmailConfigScreen from './screens/EmailConfigScreen';
import ConfirmationScreen from './screens/ConfirmationScreen';
import PaymentMethodsScreen from './screens/PaymentMethodsScreen';
import SplitPaymentSelectionScreen from './screens/SplitPaymentSelectionScreen';
import SplitPaymentSummaryScreen from './screens/SplitPaymentSummaryScreen';
import SettingsScreen from './screens/SettingsScreen';
import HomeScreen from './screens/HomeScreen';
import MenuScreen from './screens/MenuScreen';
import DishDetailScreen from './screens/DishDetailScreen';
import OrderScreen from './screens/OrderScreen';
import RegisterScreen from './screens/RegisterScreen';
import AddCardScreen from './screens/AddCardScreen';
import TransactionsScreen from './screens/TransactionsScreen';
import PaymentSuccessScreen from './screens/PaymentSuccessScreen';
import OrderHistoryScreen from './screens/OrderHistoryScreen';
import TransactionDetailScreen from './screens/TransactionDetailScreen';
import InviteUsersScreen from './screens/InviteUsersScreen';
import GroupOrderManagementScreen from './screens/GroupOrderManagementScreen';
import OrderConfirmedScreen from './screens/OrderConfirmedScreen';
import OrderDetailScreen from './screens/OrderDetailScreen';
import JoinTableScreen from './screens/JoinTableScreen';
import QRScannerScreen from './screens/QRScannerScreen';
import FavoritesScreen from './screens/FavoritesScreen';
import ReviewScreen from './screens/ReviewScreen';
import RequestAssistanceScreen from './screens/RequestAssistanceScreen';
import ProductReviewsScreen from './screens/ProductReviewsScreen';
import WaitlistScreen from './screens/WaitlistScreen';
import EditOrderScreen from './screens/EditOrderScreen';
import LoyaltyScreen from './screens/LoyaltyScreen';
import CouponsScreen from './screens/CouponsScreen';
import CouponDetailScreen from './screens/CouponDetailScreen';
import DiscoverRestaurantsScreen from './screens/DiscoverRestaurantsScreen';
import MeetUpScreen from './screens/MeetUpScreen';
import ContactsScreen from './screens/ContactsScreen';
import PromotionsScreen from './screens/PromotionsScreen';
import PromotionDetailScreen from './screens/PromotionDetailScreen';
import TableReadyScreen from './screens/TableReadyScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import RestaurantProfileScreen from './screens/RestaurantProfileScreen';
import RestaurantDetailsScreen from './screens/RestaurantDetailsScreen';
import AdminControlPanelScreen from './screens/AdminControlPanelScreen';
import HomeRestaurantScreen from './screens/HomeRestaurantScreen';
import PromotionsRestaurantScreen from './screens/PromotionsRestaurantScreen';
import MenuRestaurantScreen from './screens/MenuRestaurantScreen';
import ReservationsRestaurantScreen from './screens/ReservationsRestaurantScreen';
import StatisticsRestaurantScreen from './screens/StatisticsRestaurantScreen';
import BottomNav from './components/BottomNav';
import AssistantButton from './components/AssistantButton';
import AndroidBackButton from './components/AndroidBackButton';
import { CartProvider } from './contexts/CartContext';
import { RestaurantProvider } from './contexts/RestaurantContext';
import { GroupOrderProvider } from './contexts/GroupOrderContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { LoyaltyProvider } from './contexts/LoyaltyContext';
import { ProductsProvider } from './contexts/ProductsContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Componente interno que usa el AuthContext
const AppContent: React.FC = () => {
  const { user, loading, accountType } = useAuth();
  const isAuthenticated = !!user;

  // Mostrar loading mientras se verifica la sesión
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <LanguageProvider>
      <RestaurantProvider>
        <ProductsProvider>
          <CartProvider>
            <FavoritesProvider>
              <LoyaltyProvider>
                <GroupOrderProvider>
                  <HashRouter>
                    <AndroidBackButton />
                    <div className="w-full max-w-full min-h-screen bg-white dark:bg-background-dark relative overflow-hidden flex flex-col md:max-w-2xl md:mx-auto md:shadow-2xl">
        <Routes>
          <Route path="/" element={!isAuthenticated ? <WelcomeScreen onLogin={() => {}} /> : <Navigate to="/home" />} />
          <Route path="/register" element={!isAuthenticated ? <RegisterScreen onLogin={() => {}} /> : <Navigate to="/home" />} />
          <Route path="/forgot-password" element={!isAuthenticated ? <ForgotPasswordScreen /> : <Navigate to="/home" />} />
          <Route path="/reset-password" element={!isAuthenticated ? <ResetPasswordScreen /> : <Navigate to="/home" />} />
          <Route
            path="/home"
            element={
              isAuthenticated
                ? accountType === 'restaurant'
                  ? <Navigate to="/home-restaurant" />
                  : <HomeScreen />
                : <Navigate to="/" />
            }
          />
          <Route
            path="/menu"
            element={
              isAuthenticated
                ? accountType === 'restaurant'
                  ? <Navigate to="/menu-restaurant" />
                  : <MenuScreen />
                : <Navigate to="/" />
            }
          />
          <Route path="/dish/:id" element={isAuthenticated ? <DishDetailScreen /> : <Navigate to="/" />} />
          <Route path="/orders" element={isAuthenticated ? <OrderScreen /> : <Navigate to="/" />} />
          <Route path="/profile" element={isAuthenticated ? <ProfileScreen /> : <Navigate to="/" />} />
          <Route path="/billing-step-1" element={<BillingDataScreen />} />
          <Route path="/billing-step-2" element={<UploadConstanciaScreen />} />
          <Route path="/billing-step-3" element={<EmailConfigScreen />} />
          <Route path="/billing-step-4" element={<ConfirmationScreen />} />
          <Route path="/payments" element={<PaymentMethodsScreen />} />
          <Route path="/split-payment-selection" element={isAuthenticated ? <SplitPaymentSelectionScreen /> : <Navigate to="/" />} />
          <Route path="/split-payment-summary" element={isAuthenticated ? <SplitPaymentSummaryScreen /> : <Navigate to="/" />} />
          <Route path="/payment-success" element={<PaymentSuccessScreen />} />
          <Route path="/add-card" element={<AddCardScreen />} />
          <Route path="/transactions" element={<TransactionsScreen />} />
          <Route path="/transaction-detail/:id" element={<TransactionDetailScreen />} />
          <Route path="/order-history" element={<OrderHistoryScreen />} />
          <Route path="/invite-users" element={isAuthenticated ? <InviteUsersScreen /> : <Navigate to="/" />} />
          <Route path="/group-order-management" element={isAuthenticated ? <GroupOrderManagementScreen /> : <Navigate to="/" />} />
          <Route path="/order-confirmed" element={isAuthenticated ? <OrderConfirmedScreen /> : <Navigate to="/" />} />
          <Route path="/order-detail/:id" element={isAuthenticated ? <OrderDetailScreen /> : <Navigate to="/" />} />
          <Route path="/order-detail" element={isAuthenticated ? <OrderDetailScreen /> : <Navigate to="/" />} />
          <Route path="/join-table" element={isAuthenticated ? <JoinTableScreen /> : <Navigate to="/" />} />
          <Route path="/qr-scanner" element={isAuthenticated ? <QRScannerScreen /> : <Navigate to="/" />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="/favorites" element={isAuthenticated ? <FavoritesScreen /> : <Navigate to="/" />} />
          <Route path="/review" element={isAuthenticated ? <ReviewScreen /> : <Navigate to="/" />} />
          <Route path="/request-assistance" element={isAuthenticated ? <RequestAssistanceScreen /> : <Navigate to="/" />} />
          <Route path="/product-reviews/:dishId" element={isAuthenticated ? <ProductReviewsScreen /> : <Navigate to="/" />} />
          <Route path="/waitlist" element={isAuthenticated ? <WaitlistScreen /> : <Navigate to="/" />} />
          <Route path="/edit-order" element={isAuthenticated ? <EditOrderScreen /> : <Navigate to="/" />} />
          <Route path="/loyalty" element={isAuthenticated ? <LoyaltyScreen /> : <Navigate to="/" />} />
          <Route path="/coupons" element={isAuthenticated ? <CouponsScreen /> : <Navigate to="/" />} />
          <Route path="/coupon-detail/:id" element={isAuthenticated ? <CouponDetailScreen /> : <Navigate to="/" />} />
          <Route path="/discover" element={isAuthenticated ? <DiscoverRestaurantsScreen /> : <Navigate to="/" />} />
          <Route path="/meetup" element={isAuthenticated ? <MeetUpScreen /> : <Navigate to="/" />} />
          <Route path="/contacts" element={isAuthenticated ? <ContactsScreen /> : <Navigate to="/" />} />
          <Route path="/promotions" element={isAuthenticated ? <PromotionsScreen /> : <Navigate to="/" />} />
          <Route path="/promotion-detail/:id" element={isAuthenticated ? <PromotionDetailScreen /> : <Navigate to="/" />} />
          <Route path="/table-ready" element={isAuthenticated ? <TableReadyScreen /> : <Navigate to="/" />} />
          <Route path="/restaurant-profile" element={isAuthenticated ? <RestaurantProfileScreen /> : <Navigate to="/" />} />
          <Route path="/restaurant-details" element={isAuthenticated ? <RestaurantDetailsScreen /> : <Navigate to="/" />} />
          <Route path="/admin-control-panel" element={isAuthenticated ? <AdminControlPanelScreen /> : <Navigate to="/" />} />

          {/* Rutas específicas de restaurante */}
          <Route path="/home-restaurant" element={isAuthenticated ? <HomeRestaurantScreen /> : <Navigate to="/" />} />
          <Route path="/promotions-restaurant" element={isAuthenticated ? <PromotionsRestaurantScreen /> : <Navigate to="/" />} />
          <Route path="/menu-restaurant" element={isAuthenticated ? <MenuRestaurantScreen /> : <Navigate to="/" />} />
          <Route path="/reservaciones-restaurant" element={isAuthenticated ? <ReservationsRestaurantScreen /> : <Navigate to="/" />} />
          <Route path="/estadisticas-restaurant" element={isAuthenticated ? <StatisticsRestaurantScreen /> : <Navigate to="/" />} />
        </Routes>
        
                      {isAuthenticated && <BottomNav />}
                      {isAuthenticated && <AssistantButton />}
                    </div>
                  </HashRouter>
                </GroupOrderProvider>
              </LoyaltyProvider>
            </FavoritesProvider>
          </CartProvider>
        </ProductsProvider>
      </RestaurantProvider>
    </LanguageProvider>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
