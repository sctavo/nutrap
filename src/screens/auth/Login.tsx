// Login — ambas plataformas
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { C, styles } from '../../constants/theme';
import { Card, Button, Brand } from '../../components';
import { AuthService } from '../../services/authService';
import type { UserProfile } from '../../types/models';
import { ES_WEB, Aviso } from '../shared';

export function Login({ onLogin, goRegister }: { onLogin: (p: UserProfile) => void; goRegister: () => void }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) { setError('Ingresa tu correo y contraseña.'); return; }
    setLoading(true); setError('');
    try {
      onLogin(await AuthService.login(email.trim(), password));
    } catch (e: any) {
      if (e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password') setError('Credenciales incorrectas.');
      else if (e.code === 'auth/user-not-found') setError('No existe una cuenta con este correo.');
      else if (e.code === 'auth/too-many-requests') setError('Demasiados intentos. Espera unos minutos.');
      else setError(e.message ?? 'Error al iniciar sesión.');
    } finally { setLoading(false); }
  };

  return (
    <View style={styles.welcome}>
      <View style={styles.welcomeGlow}/>
      <Brand/>
      <Text style={styles.welcomeTitle}>TU NUTRICIÓN,{`\n`}EN MOVIMIENTO.</Text>
      <Text style={[styles.eyebrow, { alignSelf: 'stretch' }]}>{ES_WEB ? 'PORTAL PROFESIONAL' : 'APP DEL PACIENTE'}</Text>
      <Card style={{ alignSelf: 'stretch' }}>
        <Text style={styles.cardLabel}>CORREO ELECTRÓNICO</Text>
        <TextInput value={email} onChangeText={setEmail} placeholder="tu@email.com" placeholderTextColor={C.dim} keyboardType="email-address" autoCapitalize="none" style={styles.input}/>
        <Text style={styles.cardLabel}>CONTRASEÑA</Text>
        <TextInput value={password} onChangeText={setPassword} placeholder="••••••••" placeholderTextColor={C.dim} secureTextEntry style={styles.input}/>
        <Aviso text={error}/>
        <Button label={loading ? 'INICIANDO SESIÓN...' : 'ENTRAR'} onPress={handleLogin}/>
      </Card>
      <Pressable onPress={goRegister}><Text style={styles.proLink}>¿NO TIENES CUENTA? REGISTRARSE</Text></Pressable>
    </View>
  );
}
