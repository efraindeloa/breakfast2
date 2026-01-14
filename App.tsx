
import React, { useState } from 'react';
import { HashRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import WelcomeScreen from './screens/WelcomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import BillingDataScreen from './screens/BillingDataScreen';
import UploadConstanciaScreen from './screens/UploadConstanciaScreen';
import EmailConfigScreen from './screens/EmailConfigScreen';
import ConfirmationScreen from './screens/ConfirmationScreen';
import PaymentMethodsScreen from './screens/PaymentMethodsScreen';
import SettingsScreen from './screens/SettingsScreen';
import HomeScreen from './screens/HomeScreen';
import MenuScreen from './screens/MenuScreen';
import DishDetailScreen from './screens/DishDetailScreen';
import OrderScreen from './screens/OrderScreen';
import RegisterScreen from './screens/RegisterScreen';
import AddCardScreen from './screens/AddCardScreen';
import TransactionsScreen from './screens/TransactionsScreen';
import PaymentSuccessScreen from './screens/PaymentSuccessScreen';
import BottomNav from './components/BottomNav';
import { CartProvider } from './contexts/CartContext';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <CartProvider>
      <HashRouter>
      <div className="max-w-[430px] mx-auto min-h-screen bg-white dark:bg-background-dark relative shadow-2xl overflow-hidden flex flex-col">
        <Routes>
          <Route path="/" element={<WelcomeScreen onLogin={() => setIsAuthenticated(true)} />} />
          <Route path="/register" element={<RegisterScreen onLogin={() => setIsAuthenticated(true)} />} />
          <Route path="/home" element={isAuthenticated ? <HomeScreen /> : <Navigate to="/" />} />
          <Route path="/menu" element={isAuthenticated ? <MenuScreen /> : <Navigate to="/" />} />
          <Route path="/dish/:id" element={isAuthenticated ? <DishDetailScreen /> : <Navigate to="/" />} />
          <Route path="/orders" element={isAuthenticated ? <OrderScreen /> : <Navigate to="/" />} />
          <Route path="/profile" element={isAuthenticated ? <ProfileScreen /> : <Navigate to="/" />} />
          <Route path="/billing-step-1" element={<BillingDataScreen />} />
          <Route path="/billing-step-2" element={<UploadConstanciaScreen />} />
          <Route path="/billing-step-3" element={<EmailConfigScreen />} />
          <Route path="/billing-step-4" element={<ConfirmationScreen />} />
          <Route path="/payments" element={<PaymentMethodsScreen />} />
          <Route path="/payment-success" element={<PaymentSuccessScreen />} />
          <Route path="/add-card" element={<AddCardScreen />} />
          <Route path="/transactions" element={<TransactionsScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
        </Routes>
        
        {isAuthenticated && <BottomNav />}
      </div>
    </HashRouter>
    </CartProvider>
  );
};

export default App;
