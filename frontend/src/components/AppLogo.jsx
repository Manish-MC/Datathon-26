import React from 'react';
import logoUrl from '../assets/KSP_logo.svg';

const AppLogo = ({ className = '', size = 32 }) => {
  return (
    <img 
      src={logoUrl} 
      alt="KSP Logo" 
      className={className}
      style={{ width: size, height: size, objectFit: 'contain' }}
    />
  );
};

export default AppLogo;
