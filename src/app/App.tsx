import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './layouts/AppShell'
import AdminShell from './layouts/AdminShell'
import HomePage from './pages/HomePage'
import MoviesPage from './pages/MoviesPage'
import SeriesPage from './pages/SeriesPage'
import MovieDetailPage from './pages/MovieDetailPage'
import SeriesDetailPage from './pages/SeriesDetailPage'
import PersonDetailPage from './pages/PersonDetailPage'
import GenresPage from './pages/GenresPage'
import GenreDetailPage from './pages/GenreDetailPage'
import PlatformsPage from './pages/PlatformsPage'
import PlatformDetailPage from './pages/PlatformDetailPage'
import ProductionHousesPage from './pages/ProductionHousesPage'
import ProductionHouseDetailPage from './pages/ProductionHouseDetailPage'
import SearchPage from './pages/SearchPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminImportPage from './pages/admin/AdminImportPage'
import AdminHomeSectionsPage from './pages/admin/AdminHomeSectionsPage'
import AdminMoviesPage from './pages/admin/AdminMoviesPage'
import AdminGenresPage from './pages/admin/AdminGenresPage'
import AdminSeriesPage from './pages/admin/AdminSeriesPage'
import AdminPeoplePage from './pages/admin/AdminPeoplePage'
import AdminPlatformsPage from './pages/admin/AdminPlatformsPage'
import AdminProductionHousesPage from './pages/admin/AdminProductionHousesPage'
import AdminBannersPage from './pages/admin/AdminBannersPage'
import ProfilePage from './pages/ProfilePage'
import DiscoverPage from './pages/DiscoverPage'
import CollectionsPage from './pages/CollectionsPage'
import CollectionDetailPage from './pages/CollectionDetailPage'

export default function App() {
  return (
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
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

