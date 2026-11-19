import React, { useState, useEffect } from 'react';
import { StatusBar, View, ActivityIndicator } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { C, styles } from './src/constants/theme';
import type { Screen, ProScreen } from './src/types';
import type { UserProfile } from './src/types/models';
import { AuthService } from './src/services/authService';
import { PerfilService } from './src/services/firestoreService';
import {
  Login, Register, Pending,
  Dashboard, Scanner, Calendar, Profile, Settings,
  ProDashboard, Users, Plans, Reports,
} from './src/screens';

export type { Screen, ProScreen };

function pantallaInicial(p: UserProfile): Screen {
  if (p.rol === 'PROFESIONAL') return 'pro-dashboard';
  if (p.estado === 'pendiente') return 'pending';
  return 'dashboard';
}

export default function App() {
  const [user, setUser]       = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [screen, setScreen]   = useState<Screen>('login');

  useEffect(() => {
    let dejarDeEscuchar: (() => void) | null = null;

    const unsubAuth = AuthService.onAuthChange((firebaseUser) => {
      dejarDeEscuchar?.();
      dejarDeEscuchar = null;

      if (!firebaseUser) {
        setUser(null);
        setScreen('login');
        setLoading(false);
        return;
      }

      // Perfil en tiempo real: los cambios del nutricionista (asociación,
      // plan, metas) llegan solos, sin cerrar sesión.
      let primeraCarga = true;
      dejarDeEscuchar = PerfilService.escuchar(firebaseUser.uid, (profile) => {
        setUser(profile);
        if (primeraCarga) {
          setScreen(pantallaInicial(profile));
          primeraCarga = false;
          setLoading(false);
        }
      });
    });

    return () => { dejarDeEscuchar?.(); unsubAuth(); };
  }, []);

  const go = (s: Screen) => setScreen(s);
  const logout = async () => {
    await AuthService.logout();
    setUser(null);
    setScreen('login');
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={C.lime} />
        </View>
      );
    }

    /* ── Sin sesión ── */
    if (!user) {
      if (screen === 'register') {
        return (
          <Register
            onRegistered={(p) => { setUser(p); setScreen(pantallaInicial(p)); }}
            goLogin={() => go('login')}
          />
        );
      }
      return (
        <Login
          onLogin={(p) => { setUser(p); setScreen(pantallaInicial(p)); }}
          goRegister={() => go('register')}
        />
      );
    }

    /* ── Paciente pendiente de asociación ── */
    if (user.rol === 'PACIENTE' && user.estado === 'pendiente') {
      return <Pending nombre={user.nombre} onLogout={logout} />;
    }

    /* ── Portal profesional ── */
    if (user.rol === 'PROFESIONAL') {
      const pro = { go, profesionalUid: user.uid, nombre: user.nombre };
      switch (screen as ProScreen) {
        case 'users':   return <Users   {...pro} />;
        case 'plans':   return <Plans   {...pro} />;
        case 'reports': return <Reports {...pro} />;
        default:        return <ProDashboard {...pro} />;
      }
    }

    /* ── App móvil del paciente ── */
    switch (screen) {
      case 'scanner':  return <Scanner  go={go} uid={user.uid} />;
      case 'calendar': return <Calendar go={go} />;
      case 'profile':  return <Profile  go={go} user={user} />;
      case 'settings': return <Settings go={go} onLogout={logout} />;
      default:         return <Dashboard go={go} uid={user.uid} nombre={user.nombre} meta={user.meta} />;
    }
  };

  return (
    <View style={styles.app}>
      <StatusBar barStyle="light-content" />
      {renderContent()}
      <ExpoStatusBar style="light" />
    </View>
  );
}
