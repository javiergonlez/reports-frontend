//---------------------------------------------------------------------------------------------------------------------------

import { useEffect } from 'react'
import { isTokenExpired, clearAuth } from '../services/auth.service'
import { useNavigate } from 'react-router-dom'

//---------------------------------------------------------------------------------------------------------------------------

const useTokenExpiration = (): void => {
  const navigate = useNavigate()

  useEffect(() => {
    if (isTokenExpired()) {
      
      clearAuth()
      navigate('/login')
    }
  }, [navigate])
}

export { useTokenExpiration }