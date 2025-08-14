//---------------------------------------------------------------------------------------------------------------------------

import './App.css';
import { Link } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useS3Data } from './hooks/useS3Data';
import { useTokenExpiration } from './hooks/useTokenExpiration';
import dashboardsData from './dashboardFileMap.json';
import reportsData from './reportFileMap.json';
import { MoonLoader } from 'react-spinners';
import type { User } from './types';

//---------------------------------------------------------------------------------------------------------------------------

const App = (): React.JSX.Element => {
  const { user }: { user: User | null } = useAuth();
  const { data, isLoading, error, fetchS3Data } = useS3Data(false); // autoFetch = false, NO fetch automático

  // Verificar expiración del token
  useTokenExpiration();

  const handleRefetch = (): void => {
    fetchS3Data();
  };

  const dashboards: { key: string; value: string; }[] = Object.entries(dashboardsData).map(([key, value]: [string, string]) => ({ key, value }));
  const reports: { key: string; value: string; }[] = Object.entries(reportsData).map(([key, value]: [string, string]) => ({ key, value }));

  console.log(data?.data);

  return (
    <main className="main-container">

      {error && (
        <div style={{
          padding: '1rem',
          margin: '0 1rem 1rem 1rem',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#dc2626'
        }}>
          Error al cargar datos: {error}
        </div>
      )}

      <section className="section-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 className="h3-subtitle">Reportes</h3>
          <button
            onClick={handleRefetch}
            className='button'
            style={{
              height: '2.5rem',
              minWidth: '9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              borderRadius: '0.5rem'
            }}
          >
            {isLoading ? (
              <>
                <MoonLoader size={20} color="#139bd1" />
                Actualizando...
              </>
            ) : (
              'Actualizar Datos'
            )}
          </button>
        </div>
        <div className="grid-container">

          {reports.map((report: { key: string; value: string }): React.JSX.Element => (
            <div key={report.key}>
              <Link
                to={`/reportes/${report.value.toLowerCase()}`}
                className='background-image'
              >
                <img src={`/${report.key}.png`} alt={`${report.key}`} />
              </Link>
              <p style={{ padding: '0.5rem', fontSize: '1.5rem', fontWeight: '500' }}>{report.value}</p>
            </div>
          ))}
        </div>
      </section>

      {
        user?.role === 'director' ? (
          <section className="section-container" style={{ marginTop: '2rem' }}>
            <h3 className="h3-subtitle" style={{ marginBottom: '1rem' }}>Tableros</h3>
            <div className="grid-container">

              {dashboards.map((dashboard: { key: string; value: string }): React.JSX.Element => (
                <div key={dashboard.key}>
                  <Link
                    to={`/tableros/${dashboard.value.toLowerCase()}`}
                    className='background-image'
                  >
                    <img src={`/${dashboard.key}.png`} alt={`${dashboard.value}`} />
                  </Link>
                  <p style={{ padding: '0.5rem', fontSize: '1.5rem', fontWeight: '500' }}>{dashboard.value}</p>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <></>
        )
      }
    </main>
  );
}

export { App };
