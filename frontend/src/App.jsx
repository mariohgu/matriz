import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Páginas o componentes de ejemplo
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DashboardDepartamentos from './pages/DashboardDepartamentos';
import CalendarioCompromisos from './pages/CalendarioCompromisos';
import MunicipalidadesList from './components/municipalidades/MunicipalidadesList';
import ContactosList from './components/contactos/ContactosList';
import TipoReunionList from './components/tipos-reunion/TipoReunionList';
import EventosList from './components/eventos/EventosList';
import EstadoSeguimientosList from './components/estado-seguimiento/EstadoSeguimientosList';
import OficiosList from './components/oficios/OficiosList';
import ConveniosList from './components/convenios/ConveniosList';
import EstadosList from './components/estados/EstadoList';
import EstadoConvenioList from './components/estados-convenios/EstadoConvenioList';
import ConvenioSeguimientoList from './components/convenio-seguimiento/ConvenioSeguimientoList';
import SectorList from './components/sectores/SectorList';
import DireccionLineaList from './components/direcciones-linea/DireccionLineaList';
import UserList from './components/usuarios/UserList';
import ProfileView from './components/usuarios/ProfileView';
import UnauthorizedPage from './pages/UnauthorizedPage';
import DashboardLista from './pages/DashboardLista';
import ImportarPresupuestoPage from './pages/presupuesto/ImportarPresupuestoPage';
import AreasEjecutorasList from './components/presupuesto/AreasEjecutorasList';
import CategoriasList from './components/presupuesto/CategoriasList';
import ClasificadoresList from './components/presupuesto/ClasificadoresList';
import EjecucionMensualList from './components/presupuesto/EjecucionMensualList';
import ResumenPresupuestoList from './components/presupuesto/PresupuestosList';

// Componentes comunes
import Sidebar from './components/common/Sidebar';
import Header from './components/common/Header';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Context/Auth
import { AuthProvider, useAuth } from './context/AuthContext';

/** 
 * Layout principal que contiene Sidebar + Header + contenido.
 * Ajustado para no forzar overflow, de modo que no recorte el contenido.
 */
function MainLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  /** 
   * Estilos básicos:
   * - display: 'flex' para que Sidebar y contenido estén en columnas.
   * - minHeight: '100vh' se asegura de ocupar toda la pantalla.
   * - overflowX: 'hidden' evita scroll horizontal en caso de animaciones del sidebar.
   */
  const rootStyle = {
    display: 'flex',
    minHeight: '100vh',
    width: '100%',
    backgroundColor: 'rgb(243, 244, 246)', // opcional
    overflowX: 'hidden',
    overflowY: 'hidden', // Importante: evita scroll en el contenedor principal
  };

  /**
   * El "wrapper" del contenido (excluyendo el Sidebar).
   * - flex: 1 para que ocupe todo el espacio restante.
   * - display: 'flex' y 'flexDirection: column' para que el Header esté arriba y el contenido debajo.
   */
  const contentWrapperStyle = {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    height: '100vh', // Importante: altura completa para el contenedor
    overflow: 'hidden', // Importante: evita scroll en este nivel
  };

  /**
   * El área principal donde van las páginas.
   * - flex: 1 para que crezca y ocupe todo el espacio vertical debajo del Header.
   * - overflowY: 'auto' permite que si hay mucho contenido, se haga scroll en esta área.
   */
  const mainContentStyle = {
    flex: 1,
    width: '100%',
    overflowY: 'auto', // Importante: permite scroll solo aquí
    padding: '1rem'
  };

  return (
    <div style={rootStyle}>
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
      <div style={contentWrapperStyle}>
        <Header onMenuClick={toggleSidebar} />
        <main style={mainContentStyle}>
          {children}
        </main>
      </div>
    </div>
  );
}

/** 
 * Si el usuario está logueado, redirige a /dashboard;
 * si no, a /login. Esto para la ruta "/". 
 */
function RootRedirect() {
  const { auth, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }
  return auth ? <Navigate replace to="/dashboard" /> : <Navigate replace to="/login" />;
}

/** 
 * Rutas de la aplicación.
 * - Rutas públicas: /login, /register, ...
 * - Rutas privadas: /dashboard, /municipalidades, etc. (envueltas en <ProtectedRoute />).
 */
function AppRoutes() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Rutas privadas / protegidas */}
      <Route element={<ProtectedRoute />}>
        {/* Dashboard principal */}
        <Route
          path="/dashboard"
          element={
            <MainLayout>
              <Dashboard />
            </MainLayout>
          }
        />
        <Route
          path="/dashboard/departamentos"
          element={
            <MainLayout>
              <DashboardDepartamentos />
            </MainLayout>
          }
        />
        <Route
          path="/dashboard/lista"
          element={
            <MainLayout>
              <DashboardLista />
            </MainLayout>
          }
        />
        <Route
          path="/dashboard/calendario-compromisos"
          element={
            <MainLayout>
              <CalendarioCompromisos />
            </MainLayout>
          }
        />

        {/* Ejemplos de Items */}
        <Route
          path="/municipalidades"
          element={
            <MainLayout>
              <MunicipalidadesList />
            </MainLayout>
          }
        />
        <Route
          path="/contactos"
          element={
            <MainLayout>
              <ContactosList />
            </MainLayout>
          }
        />
        <Route
          path="/tipos-reunion"
          element={
            <MainLayout>
              <TipoReunionList />
            </MainLayout>
          }
        />
        <Route
          path="/estados"
          element={
            <MainLayout>
              <EstadosList />
            </MainLayout>
          }
        />

        {/* Eventos */}
        <Route
          path="/eventos"
          element={
            <MainLayout>
              <EventosList />
            </MainLayout>
          }
        />

        {/* Seguimiento */}
        <Route
          path="/estado-seguimiento"
          element={
            <MainLayout>
              <EstadoSeguimientosList />
            </MainLayout>
          }
        />
        <Route
          path="/oficios"
          element={
            <MainLayout>
              <OficiosList />
            </MainLayout>
          }
        />
        <Route
          path="/convenios"
          element={
            <MainLayout>
              <ConveniosList />
            </MainLayout>
          }
        />
        
        <Route
          path="/estados-convenios"
          element={
            <MainLayout>
              <EstadoConvenioList />
            </MainLayout>
          }
        />

        <Route
          path="/convenio-seguimiento"
          element={
            <MainLayout>
              <ConvenioSeguimientoList />
            </MainLayout>
          }
        />

        <Route
          path="/sectores"
          element={
            <MainLayout>
              <SectorList />
            </MainLayout>
          }
        />

        {/* Presupuesto */}
        <Route element={<ProtectedRoute requiredRole={['super-admin', 'analista']} />}>
        <Route
          path="/presupuesto/importar"
          element={
            <MainLayout>
              <ImportarPresupuestoPage />
            </MainLayout>
          }
        />
        </Route>
        
        <Route element={<ProtectedRoute requiredRole={['super-admin', 'analista']} />}>
        <Route
          path="/presupuesto/areas-ejecutoras"
          element={
            <MainLayout>              
                <AreasEjecutorasList />             
            </MainLayout>
          }
        />
        </Route>
        
        <Route element={<ProtectedRoute requiredRole={['super-admin', 'analista']} />}>
        <Route
          path="/presupuesto/categorias"
          element={
            <MainLayout>            
                <CategoriasList />           
            </MainLayout>
          }
        />
        </Route>
        
        <Route element={<ProtectedRoute requiredRole={['super-admin', 'analista']} />}>
        <Route
          path="/presupuesto/clasificadores"
          element={
            <MainLayout>            
                <ClasificadoresList />
            </MainLayout>
          }
        />
        </Route>

        <Route element={<ProtectedRoute requiredRole={['super-admin', 'analista']} />}>
        <Route
          path="/presupuesto/ejecuciones"
          element={
            <MainLayout>
                <EjecucionMensualList />
            </MainLayout>
          }
        /> 
        </Route>
        {/* Manejo de Permisos
        <Route element={<ProtectedRoute requiredPermissions={'ver-presupuesto'} />}>*/}
        <Route element={<ProtectedRoute requiredRole={['super-admin', 'analista']} />}>
        <Route
          path="/presupuesto/resumen"
          element={
            <MainLayout>
                <ResumenPresupuestoList />
            </MainLayout>
          }
        />
        </Route>
        <Route
          path="/direcciones-linea"
          element={
            <MainLayout>
              <DireccionLineaList />
            </MainLayout>
          }
        />

        {/* Configuración - Perfil (accesible para todos los usuarios) */}
        <Route
          path="/perfil"
          element={
            <MainLayout>
              <ProfileView />
            </MainLayout>
          }
        />

        {/* Rutas protegidas solo para administradores */}
        <Route element={<ProtectedRoute requiredRole="super-admin" />}>
          {/* Configuración - Usuarios (solo administradores) */}
          <Route
            path="/usuarios"
            element={
              <MainLayout>
                <UserList />
              </MainLayout>
            }
          />
        </Route>

      </Route>

      {/* Ruta raíz => Redirección según estado auth */}
      <Route path="/" element={<RootRedirect />} />

      {/* Cualquier otra ruta no definida => Redirige a / */}
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  );
}

/** 
 * Componente principal de la app.
 * Envuelve todo con el AuthProvider (contexto de autenticación).
 */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
