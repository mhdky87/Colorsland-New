import { Routes, Route } from "react-router-dom";

import MainLayout from "../layout/MainLayout";
import AppLayout from "../layout/AppLayout";

import HomePage from "../pages/HomePage";
import GrowersPage from "../pages/GrowersPage";
import GrowerDetailsPage from "../pages/GrowerDetailsPage";
import AboutPage from "../pages/AboutPage";
import ContactPage from "../pages/ContactPage";

import ShopPage from "../pages/ShopPage";
import CategoryPage from "../pages/CategoryPage";
import ProductPage from "../pages/ProductPage";

import CartPage from "../pages/CartPage";
import CheckoutPage from "../pages/CheckoutPage";
import OrdersPage from "../pages/OrdersPage";

import LoginPage from "../pages/LoginPage";
import AccountPage from "../pages/AccountPage";

import GrowerLoginPage from "../pages/GrowerLoginPage";
import GrowerOrdersPage from "../pages/GrowerOrdersPage";
import GrowerOrderDetailsPage from "../pages/GrowerOrderDetailsPage";
import GrowerAdminPage from "../pages/GrowerAdminPage";

import AdminPage from "../pages/AdminPage";

import NotFoundPage from "../pages/NotFoundPage";

import SettingsPage from "../pages/SettingsPage";
import ShippingAddressesPage from "../pages/ShippingAddressesPage";
import FreightDeliveryContactsPage from "../pages/FreightDeliveryContactsPage";
import CompanyProfilePage from "../pages/CompanyProfilePage";

export default function AppRouter() {
  return (
    <Routes>
      {/* 🌐 PUBLIC PAGES */}
      <Route
        path="/"
        element={
          <MainLayout>
            <HomePage />
          </MainLayout>
        }
      />

      <Route
        path="/growers"
        element={
          <MainLayout>
            <GrowersPage />
          </MainLayout>
        }
      />

      <Route
        path="/growers/:slug"
        element={
          <MainLayout>
            <GrowerDetailsPage />
          </MainLayout>
        }
      />

      <Route
        path="/about-us"
        element={
          <MainLayout>
            <AboutPage />
          </MainLayout>
        }
      />

      <Route
        path="/contact-us"
        element={
          <MainLayout>
            <ContactPage />
          </MainLayout>
        }
      />

      {/* 🧠 APP / DASHBOARD PAGES */}
      <Route
        path="/shop"
        element={
          <AppLayout>
            <ShopPage />
          </AppLayout>
        }
      />

      <Route
        path="/category/:slug"
        element={
          <AppLayout>
            <CategoryPage />
          </AppLayout>
        }
      />

      <Route
        path="/product/:slug"
        element={
          <AppLayout>
            <ProductPage />
          </AppLayout>
        }
      />

      <Route
        path="/cart"
        element={
          <AppLayout>
            <CartPage />
          </AppLayout>
        }
      />

      <Route
        path="/checkout"
        element={
          <AppLayout>
            <CheckoutPage />
          </AppLayout>
        }
      />

      <Route
        path="/orders"
        element={
          <AppLayout>
            <OrdersPage />
          </AppLayout>
        }
      />

      <Route
        path="/account"
        element={
          <AppLayout>
            <AccountPage />
          </AppLayout>
        }
      />

      <Route
        path="/admin"
        element={
          <AppLayout>
            <AdminPage />
          </AppLayout>
        }
      />

      {/* 🌿 GROWER */}
      <Route
        path="/grower-login"
        element={
          <MainLayout>
            <GrowerLoginPage />
          </MainLayout>
        }
      />

      <Route
  path="/login"
  element={
    <MainLayout>
      <LoginPage />
    </MainLayout>
  }
/>

<Route
  path="/settings"
  element={
    <AppLayout>
      <SettingsPage />
    </AppLayout>
  }
/>

      <Route
        path="/grower-orders"
        element={
          <AppLayout>
            <GrowerOrdersPage />
          </AppLayout>
        }
      />

      <Route
        path="/grower/orders/:orderId"
        element={
          <AppLayout>
            <GrowerOrderDetailsPage />
          </AppLayout>
        }
      />

      <Route
        path="/grower-admin"
        element={
          <AppLayout>
            <GrowerAdminPage />
          </AppLayout>
        }
      />

      <Route
  path="/settings/shipping-addresses"
  element={
    <AppLayout>
      <ShippingAddressesPage />
    </AppLayout>
  }
/>

<Route
  path="/settings/company-profile"
  element={
    <AppLayout>
      <CompanyProfilePage />
    </AppLayout>
  }
/>

<Route
  path="/settings/freight-delivery-contacts"
  element={
    <AppLayout>
      <FreightDeliveryContactsPage />
    </AppLayout>
  }
/>

      {/* ❌ NOT FOUND */}
      <Route
        path="*"
        element={
          <MainLayout>
            <NotFoundPage />
          </MainLayout>
        }
      />
    </Routes>
  );
}