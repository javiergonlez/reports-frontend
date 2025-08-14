//---------------------------------------------------------------------------------------------------------------------------

import { useNavigate, type NavigateFunction } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../App.css';

//---------------------------------------------------------------------------------------------------------------------------

const LogoutButton = (): React.JSX.Element => {

  const navigate: NavigateFunction = useNavigate();
  const { logout } = useAuth();

  const handleLogout: () => Promise<void> = async (): Promise<void> => {
    try {
      console.log('Iniciando logout...');
      await logout();
      console.log('Logout exitoso...');
      navigate('/login');
    } catch (error) {
      console.error('Error en logout:', error);
      // aun asi redirigir a login
      navigate('/login');
    }
  };

  return (
    <button
      className="logout-button"
      onClick={handleLogout}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
      >
        <path stroke="none" d="M0 0h24v24H0z" />
        <path d="M14 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2" />
        <path d="M9 12h12l-3 -3" />
        <path d="M18 15l3 -3" />
      </svg>
      Cerrar Sesión
    </button>
  );
}

export { LogoutButton };