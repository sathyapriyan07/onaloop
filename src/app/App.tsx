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
import PlatformsPage from './pages/PlatformsPage'
import SearchPage from './pages/SearchPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminImportPage from './pages/admin/AdminImportPage'
import AdminHomeSectionsPage from './pages/admin/AdminHomeSectionsPage'
import AdminMoviesPage from './pages/admin/AdminMoviesPage'
import AdminSeriesPage from './pages/admin/AdminSeriesPage'
import AdminPeoplePage from './pages/admin/AdminPeoplePage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="/movies" element={<MoviesPage />} />
        <Route path="/series" element={<SeriesPage />} />
        <Route path="/movie/:id" element={<MovieDetailPage />} />
        <Route path="/series/:id" element={<SeriesDetailPage />} />
        <Route path="/person/:id" element={<PersonDetailPage />} />
        <Route path="/genres" element={<GenresPage />} />
        <Route path="/platforms" element={<PlatformsPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route element={<AdminShell />}>
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/import" element={<AdminImportPage />} />
        <Route path="/admin/home" element={<AdminHomeSectionsPage />} />
        <Route path="/admin/movies" element={<AdminMoviesPage />} />
        <Route path="/admin/series" element={<AdminSeriesPage />} />
        <Route path="/admin/people" element={<AdminPeoplePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

