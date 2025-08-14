//---------------------------------------------------------------------------------------------------------------------------

import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { App } from "./App";
import { ProtectedLayout } from "./components/ProtectedLayout";
import { LoginForm } from "./components/LoginForm";
import { DateRangeProvider, useDateRangeContext } from "./contexts/DateRangeContext";
import { LocalDateRangeProvider } from "./contexts/LocalDateRangeContext";
import { AuthProvider } from "./contexts/AuthContext";
import type { JSX } from "@emotion/react/jsx-runtime";
import { FirstDashboard } from "./components/dashboards/first-dashboard/FirstDashboard";
import { SecondDashboard } from "./components/dashboards/second-dashboard/SecondDashboard";
import { ThirdDashboard } from "./components/dashboards/third-dashboard/ThirdDashboard";

//---------------------------------------------------------------------------------------------------------------------------

const DashboardRoutes = (): JSX.Element => {
  const { dateRange } = useDateRangeContext();

  return (
    <Routes>
      <Route path="/login" element={<LoginForm />} />

      <Route element={<ProtectedLayout><AppLayout /></ProtectedLayout>}>
        <Route path="/" element={<App />} index />
        <Route path="/reportes/tabla" element={
          <ThirdDashboard
            dateRange={[
              dateRange[0] ? new Date(dateRange[0]) : null,
              dateRange[1] ? new Date(dateRange[1]) : null,
            ]}
          />
        }
        />
        <Route path="/reportes/mapa" element={
          <ThirdDashboard
            dateRange={[
              dateRange[0] ? new Date(dateRange[0]) : null,
              dateRange[1] ? new Date(dateRange[1]) : null,
            ]}
          />
        }
        />
        <Route
          path="/tableros/general"
          element={
            <FirstDashboard
              dateRange={[
                dateRange[0] ? new Date(dateRange[0]) : null,
                dateRange[1] ? new Date(dateRange[1]) : null,
              ]}
            />
          }
        />
        <Route
          path="/tableros/tabla"
          element={
            <SecondDashboard
              dateRange={[
                dateRange[0] ? new Date(dateRange[0]) : null,
                dateRange[1] ? new Date(dateRange[1]) : null,
              ]}
            />
          }
        />
        <Route
          path="/tableros/mapa"
          element={
            <ThirdDashboard
              dateRange={[
                dateRange[0] ? new Date(dateRange[0]) : null,
                dateRange[1] ? new Date(dateRange[1]) : null,
              ]}
            />
          }
        />
        <Route path="/tablero/*" element={<App />} />
      </Route>

      {/* Redirigir rutas no encontradas */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

const AppRouter = (): JSX.Element => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DateRangeProvider>
          <LocalDateRangeProvider>
            <DashboardRoutes />
          </LocalDateRangeProvider>
        </DateRangeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export { AppRouter };