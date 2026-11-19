/**
 * src/screens  –  Índice de pantallas
 * ────────────────────────────────────
 *   auth/    Login, registro y avisos de acceso (ambas plataformas)
 *   mobile/  App del PACIENTE (Expo Go / celular)
 *   pro/     Portal del NUTRICIONISTA (web)
 */
export { ES_WEB, ROL_DE_PLATAFORMA } from './shared';

export { Login } from './auth/Login';
export { Register } from './auth/Register';
export { Pending } from './auth/Pending';
export { PlataformaIncorrecta } from './auth/PlataformaIncorrecta';

export { Welcome } from './mobile/Welcome';
export { Dashboard } from './mobile/Dashboard';
export { Scanner } from './mobile/Scanner';
export { Calendar } from './mobile/Calendar';
export { Profile } from './mobile/Profile';
export { Settings } from './mobile/Settings';

export { ProShell } from './pro/ProShell';
export { ProDashboard } from './pro/ProDashboard';
export { Users } from './pro/Users';
export { Plans } from './pro/Plans';
export { Reports } from './pro/Reports';
