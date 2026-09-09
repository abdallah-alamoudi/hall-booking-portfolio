import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Roles } from '@hall-booking/contracts';

import { RoleGuard } from './RoleGuard';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { HomePage } from '../features/dashboard/pages/HomePage';
import { OwnerDashboardPage } from '../features/dashboard/pages/OwnerDashboardPage';
import { AdminDashboardPage } from '../features/dashboard/pages/AdminDashboardPage';
import { UnauthorizedPage } from '../shared/pages/UnauthorizedPage';
import { NotFoundPage } from '../shared/pages/NotFoundPage';
import { OwnerHallsPage } from '../features/halls/OwnerHallsPage';
import { CreateHallPage } from '../features/halls/pages/CreateHallPage';
import { EditHallPage } from '../features/halls/pages/EditHallPage';
import { OwnerBookingsPage } from '../features/bookings/pages/OwnerBookingsPage';
import { OwnerBookingDetailPage } from '../features/bookings/pages/OwnerBookingDetailPage';
import BankAccountsPage from '../features/bank-accounts/pages/BankAccountsPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        <Route element={<RoleGuard allowedRoles={[Roles.OWNER, Roles.ADMIN]} />}>
          <Route path="/" element={<HomePage />} />
        </Route>

        <Route element={<RoleGuard allowedRoles={[Roles.OWNER]} />}>
          <Route path="/owner" element={<OwnerHallsPage />} />
          <Route path="/owner/halls" element={<OwnerHallsPage />} />
          <Route path="/owner/halls/create" element={<CreateHallPage />} />
          <Route path="/owner/halls/:id/edit" element={<EditHallPage />} />
          <Route path="/owner/bookings" element={<OwnerBookingsPage />} />
          <Route path="/owner/bookings/:id" element={<OwnerBookingDetailPage />} />
          <Route path="/owner/halls/:hallId/bank-accounts" element={<BankAccountsPage />} />
        </Route>

        <Route element={<RoleGuard allowedRoles={[Roles.ADMIN]} />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
