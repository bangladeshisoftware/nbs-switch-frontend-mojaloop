/**************************************************************************
 * Copyright © 2026 Bangladeshi Software Ltd. All rights reserved.
 * Distributed under the license terms specified in this repository.
 *
 * ORIGINAL AUTHOR: Muhammad Nasim (Developer)
 **************************************************************************/

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Layout/Sidebar';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Transactions from './pages/Transactions/Transactions';
import TransferDetail from './pages/Transactions/TransferDetail';
import Reconciliation from './pages/Reconciliation/Reconciliation';
import Settlement from './pages/Settlement/Settlement';
import DFSPManagement from './pages/DFSP/DFSPManagement';
import DFSPOverview from './pages/DFSP/DFSPOverview';
import PISPManagement from './pages/PISP/PISPManagement';
import PISPOverview from './pages/PISP/PISPOverview';
import Users from './pages/Auth/Users';
import Positions from './pages/Positions/Positions';
import Notifications from './pages/Notifications/Notifications';
import './index.css';
import VerifyOTP from './pages/Auth/VerifyOTP';
import Reports from './pages/Reports/Reports';
import ActivityLogs from './pages/ActivityLogs/ActivityLogs';
import LiquidityDashboard from './pages/Liquidity/LiquidityDashboard';
import HubAccounts from './pages/Hub/HubAccounts';
import SettlementModels from './pages/Hub/SettlementModels';
import Oracles from './pages/Hub/Oracles';
import SettlementFinalize from './pages/Settlement/SettlementFinalize';
import SettlementFinalizeRecords from './pages/Settlement/SettlementFinalizeRecords';
import SettlementCompletedRecords from './pages/Settlement/SettlementCompletedRecords';
import DepositsRecords from './pages/Deposits/DepositsRecords';

function ProtectedLayout({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to='/login' replace />;
  return (
    <div className='app-layout'>
      <Sidebar />
      <div className='main-content'>{children}</div>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route
        path='/login'
        element={user ? <Navigate to='/' replace /> : <Login />}
      />
      <Route
        path='/verify-otp/:ref'
        element={
          user ? <Navigate to='/verify-otp/:ref' replace /> : <VerifyOTP />
        }
      />

      {/* Monitor */}
      <Route
        path='/'
        element={
          <ProtectedLayout>
            <Dashboard />
          </ProtectedLayout>
        }
      />
      <Route
        path='/transactions'
        element={
          <ProtectedLayout>
            <Transactions />
          </ProtectedLayout>
        }
      />
      <Route
        path='/transactions/:transferId'
        element={
          <ProtectedLayout>
            <TransferDetail />
          </ProtectedLayout>
        }
      />
      <Route
        path='/notifications'
        element={
          <ProtectedLayout>
            <Notifications />
          </ProtectedLayout>
        }
      />

      {/* Liquidity */}
      <Route
        path='/positions'
        element={
          <ProtectedLayout>
            <Positions />
          </ProtectedLayout>
        }
      />
      <Route
        path='/liquidity'
        element={
          <ProtectedLayout>
            <LiquidityDashboard />
          </ProtectedLayout>
        }
      />
      {/* Hub */}
      <Route
        path='/hub/accounts'
        element={
          <ProtectedLayout>
            <HubAccounts />
          </ProtectedLayout>
        }
      />
      <Route
        path='/hub/settlement-models'
        element={
          <ProtectedLayout>
            <SettlementModels />
          </ProtectedLayout>
        }
      />
      <Route
        path='/hub/settlement-finalize'
        element={
          <ProtectedLayout>
            <SettlementFinalize />
          </ProtectedLayout>
        }
      />
      <Route
        path='/hub/oracles'
        element={
          <ProtectedLayout>
            <Oracles />
          </ProtectedLayout>
        }
      />
      {/* Finance */}
      <Route
        path='/reconciliation'
        element={
          <ProtectedLayout>
            <Reconciliation />
          </ProtectedLayout>
        }
      />
      <Route
        path='/settlement'
        element={
          <ProtectedLayout>
            <Settlement />
          </ProtectedLayout>
        }
      />
      <Route
        path='/settlement-finalize-records'
        element={
          <ProtectedLayout>
            <SettlementFinalizeRecords />
          </ProtectedLayout>
        }
      />
      <Route
        path='/settlement-complete-records'
        element={
          <ProtectedLayout>
            <SettlementCompletedRecords />
          </ProtectedLayout>
        }
      />
      <Route
        path='/deposits-records'
        element={
          <ProtectedLayout>
            <DepositsRecords />
          </ProtectedLayout>
        }
      />

      {/* DFSP */}
      <Route
        path='/dfsps'
        element={
          <ProtectedLayout>
            <DFSPManagement />
          </ProtectedLayout>
        }
      />
      <Route
        path='/dfsps/:dfspId'
        element={
          <ProtectedLayout>
            <DFSPOverview />
          </ProtectedLayout>
        }
      />
      {/* PISP */}
      <Route
        path='/pisps'
        element={
          <ProtectedLayout>
            <PISPManagement />
          </ProtectedLayout>
        }
      />
      <Route
        path='/pisps/:pispId'
        element={
          <ProtectedLayout>
            <PISPOverview />
          </ProtectedLayout>
        }
      />

      {/* Admin */}
      <Route
        path='/reports'
        element={
          <ProtectedLayout>
            <Reports />
          </ProtectedLayout>
        }
      />
      <Route
        path='/activity-logs'
        element={
          <ProtectedLayout>
            <ActivityLogs />
          </ProtectedLayout>
        }
      />
      <Route
        path='/users'
        element={
          <ProtectedLayout>
            <Users />
          </ProtectedLayout>
        }
      />

      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
