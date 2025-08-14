//---------------------------------------------------------------------------------------------------------------------------

import { useEffect } from 'react';
import { authService } from '../services/auth.service';
import { useNavigate } from 'react-router-dom';
import type { NavigateFunction } from 'react-router-dom';

//---------------------------------------------------------------------------------------------------------------------------

const useTokenExpiration = (): void => {
    const navigate: NavigateFunction = useNavigate();

    useEffect(() => {

        if (authService.checkTokenExpiration()) {
            console.log('Token expirado detectado en useTokenExpiration');
            navigate('/login')
        }

    }, [navigate]);
}; 

export { useTokenExpiration };