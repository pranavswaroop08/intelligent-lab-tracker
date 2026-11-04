import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('lab_user');
    return saved ? JSON.parse(saved) : {
      id: 1,
      srn_or_emp_id: 'PES2UG24CS365',
      name: 'Pranav Swaroop S',
      email: 'pranav.swaroop@pes.edu',
      role_name: 'Admin',
      role_id: 1,
      department: 'Computer Science & Engineering'
    };
  });

  const [availableUsers, setAvailableUsers] = useState([]);

  useEffect(() => {
    api.getUsers()
      .then(users => setAvailableUsers(users))
      .catch(err => console.log('Notice loading users:', err.message));
  }, []);

  const switchUser = (user) => {
    setCurrentUser(user);
    localStorage.setItem('lab_user', JSON.stringify(user));
  };

  const login = async (identifier, password) => {
    const res = await api.login({ identifier, password });
    if (res.user) {
      setCurrentUser(res.user);
      localStorage.setItem('lab_user', JSON.stringify(res.user));
    }
    return res;
  };

  return (
    <AuthContext.Provider value={{ currentUser, availableUsers, switchUser, login }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
