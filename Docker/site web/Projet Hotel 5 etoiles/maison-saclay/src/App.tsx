import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";

const HomePage = lazy(() => import("@/pages/HomePage").then((module) => ({ default: module.HomePage })));
const RoomsPage = lazy(() => import("@/pages/RoomsPage").then((module) => ({ default: module.RoomsPage })));
const RoomDetailPage = lazy(() => import("@/pages/RoomDetailPage").then((module) => ({ default: module.RoomDetailPage })));
const SpaPage = lazy(() => import("@/pages/SpaPage").then((module) => ({ default: module.SpaPage })));
const RestaurantPage = lazy(() => import("@/pages/RestaurantPage").then((module) => ({ default: module.RestaurantPage })));
const ContactPage = lazy(() => import("@/pages/ContactPage").then((module) => ({ default: module.ContactPage })));
const AdminPage = lazy(() => import("@/pages/AdminPage").then((module) => ({ default: module.AdminPage })));
const LoginPage = lazy(() => import("@/pages/LoginPage").then((module) => ({ default: module.LoginPage })));
const MyAccountPage = lazy(() => import("@/pages/MyAccountPage").then((module) => ({ default: module.MyAccountPage })));
const RoomServicePage = lazy(() => import("@/pages/RoomServicePage").then((module) => ({ default: module.RoomServicePage })));
const ConfirmationPage = lazy(() => import("@/pages/ConfirmationPage").then((module) => ({ default: module.ConfirmationPage })));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage").then((module) => ({ default: module.NotFoundPage })));

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <Suspense fallback={null}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/connexion" element={<LoginPage />} />
          <Route path="/confirmation" element={<PageWrapper><ConfirmationPage /></PageWrapper>} />

          <Route element={<Layout />}>
            <Route path="/" element={<PageWrapper><HomePage /></PageWrapper>} />
            <Route path="/chambres" element={<PageWrapper><RoomsPage /></PageWrapper>} />
            <Route path="/chambres/:slug" element={<PageWrapper><RoomDetailPage /></PageWrapper>} />
            <Route path="/spa" element={<PageWrapper><SpaPage /></PageWrapper>} />
            <Route path="/restaurant" element={<PageWrapper><RestaurantPage /></PageWrapper>} />
            <Route path="/contact" element={<PageWrapper><ContactPage /></PageWrapper>} />
            <Route path="/mon-espace" element={<PageWrapper><MyAccountPage /></PageWrapper>} />
            <Route path="/room-service" element={<PageWrapper><RoomServicePage /></PageWrapper>} />
            <Route path="/mentions-legales" element={<PageWrapper><NotFoundPage /></PageWrapper>} />
            <Route path="/confidentialite" element={<PageWrapper><NotFoundPage /></PageWrapper>} />
            <Route path="/cgv" element={<PageWrapper><NotFoundPage /></PageWrapper>} />
            <Route path="*" element={<PageWrapper><NotFoundPage /></PageWrapper>} />
          </Route>
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}
