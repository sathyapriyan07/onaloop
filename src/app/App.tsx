import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './layouts/AppShell'
import AdminShell from './layouts/AdminShell'
import ErrorBoundary from './components/ErrorBoundary'
import PageLoader from './ui/PageLoader'

const HomePage = lazy(() => import('./pages/HomePage'))
const MoviesPage = lazy(() => import('./pages/MoviesPage'))
const SeriesPage = lazy(() => import('./pages/SeriesPage'))
const MovieDetailPage = lazy(() => import('./pages/MovieDetailPage'))
const SeriesDetailPage = lazy(() => import('./pages/SeriesDetailPage'))
const PersonDetailPage = lazy(() => import('./pages/PersonDetailPage'))
const GenresPage = lazy(() => import('./pages/GenresPage'))
const GenreDetailPage = lazy(() => import('./pages/GenreDetailPage'))
const PlatformsPage = lazy(() => import('./pages/PlatformsPage'))
const PlatformDetailPage = lazy(() => import('./pages/PlatformDetailPage'))
const ProductionHousesPage = lazy(() => import('./pages/ProductionHousesPage'))
const ProductionHouseDetailPage = lazy(() => import('./pages/ProductionHouseDetailPage'))
const SearchPage = lazy(() => import('./pages/SearchPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const SignupPage = lazy(() => import('./pages/SignupPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const DiscoverPage = lazy(() => import('./pages/DiscoverPage'))
const CollectionsPage = lazy(() => import('./pages/CollectionsPage'))
const CollectionDetailPage = lazy(() => import('./pages/CollectionDetailPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const AppCrashedPage = lazy(() => import('./pages/AppCrashedPage'))

const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'))
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'))
const AdminImportPage = lazy(() => import('./pages/admin/AdminImportPage'))
const AdminHomeSectionsPage = lazy(() => import('./pages/admin/AdminHomeSectionsPage'))
const AdminMoviesPage = lazy(() => import('./pages/admin/AdminMoviesPage'))
const AdminGenresPage = lazy(() => import('./pages/admin/AdminGenresPage'))
const AdminSeriesPage = lazy(() => import('./pages/admin/AdminSeriesPage'))
const AdminPeoplePage = lazy(() => import('./pages/admin/AdminPeoplePage'))
const AdminPlatformsPage = lazy(() => import('./pages/admin/AdminPlatformsPage'))
const AdminProductionHousesPage = lazy(() => import('./pages/admin/AdminProductionHousesPage'))
const AdminBannersPage = lazy(() => import('./pages/admin/AdminBannersPage'))
const AdminCollectionsPage = lazy(() => import('./pages/admin/AdminCollectionsPage'))
const AdminHeroCollagePage = lazy(() => import('./pages/admin/AdminHeroCollagePage'))

export default function App() {
  return (
    <ErrorBoundary
      fallback={
        <Suspense fallback={<div className="min-h-dvh" />}>
          <AppCrashedPage />
        </Suspense>
      }
    >
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Homepage with footer */}
          <Route element={<AppShell />}>
            <Route index element={<HomePage />} />
          </Route>

          {/* All other pages without footer */}
          <Route element={<AppShell noFooter />}>
            <Route path="/movies" element={<MoviesPage />} />
            <Route path="/series" element={<SeriesPage />} />
            <Route path="/movie/:id" element={<MovieDetailPage />} />
            <Route path="/series/:id" element={<SeriesDetailPage />} />
            <Route path="/person/:id" element={<PersonDetailPage />} />
            <Route path="/genres" element={<GenresPage />} />
            <Route path="/genre/:id" element={<GenreDetailPage />} />
            <Route path="/platforms" element={<PlatformsPage />} />
            <Route path="/platform/:id" element={<PlatformDetailPage />} />
            <Route path="/studios" element={<ProductionHousesPage />} />
            <Route path="/studio/:id" element={<ProductionHouseDetailPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/collections" element={<CollectionsPage />} />
            <Route path="/collection/:id" element={<CollectionDetailPage />} />
            <Route path="/404" element={<NotFoundPage />} />
          </Route>

          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route element={<AdminShell />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/import" element={<AdminImportPage />} />
            <Route path="/admin/home" element={<AdminHomeSectionsPage />} />
            <Route path="/admin/movies" element={<AdminMoviesPage />} />
            <Route path="/admin/series" element={<AdminSeriesPage />} />
            <Route path="/admin/people" element={<AdminPeoplePage />} />
            <Route path="/admin/genres" element={<AdminGenresPage />} />
            <Route path="/admin/platforms" element={<AdminPlatformsPage />} />
            <Route path="/admin/studios" element={<AdminProductionHousesPage />} />
            <Route path="/admin/banners" element={<AdminBannersPage />} />
            <Route path="/admin/collections" element={<AdminCollectionsPage />} />
            <Route path="/admin/hero-collage" element={<AdminHeroCollagePage />} />
          </Route>

          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}
