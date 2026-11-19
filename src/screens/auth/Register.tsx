// Registro — nutricionista en web, paciente en móvil
import React, { useState } from 'react';
import { Text, ScrollView, TextInput, Pressable } from 'react-native';
import { C, styles } from '../../constants/theme';
import { Title, Card, Button, Brand } from '../../components';
import { AuthService } from '../../services/authService';
import type { DatosRegistro } from '../../services/authService';
import type { UserProfile } from '../../types/models';
import { ES_WEB, ROL_DE_PLATAFORMA, Aviso } from '../shared';

export function Register({ onRegistered, goLogin }: { onRegistered: (p: UserProfile) => void; goLogin: () => void }) {
  const rol = ROL_DE_PLATAFORMA; // web → nutricionista, móvil → paciente
  const [nombre, setNombre]     = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [rut, setRut]           = useState('');
  const [codigo, setCodigo]     = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleRegister = async () => {
    setError('');
    if (!nombre.trim() || !email.trim() || !password.trim()) { setError('Completa todos los campos obligatorios.'); return; }
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return; }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return; }
    if (rol === 'PROFESIONAL') {
      if (!rut.trim()) { setError('Ingresa tu RUT.'); return; }
      if (!/^\d{6}$/.test(codigo.trim())) { setError('El código identificador debe tener exactamente 6 dígitos.'); return; }
    }
    setLoading(true);
    try {
      const datos: DatosRegistro = rol === 'PROFESIONAL'
        ? { nombre: nombre.trim(), rol, rut: rut.trim(), codigoIdentificador: codigo.trim() }
        : { nombre: nombre.trim(), rol };
      onRegistered(await AuthService.register(email.trim(), password, datos));
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') setError('Ya existe una cuenta con este correo.');
      else if (e.code === 'auth/invalid-email') setError('El correo no es válido.');
      else setError(e.message ?? 'Error al crear la cuenta.');
    } finally { setLoading(false); }
  };

  return (
    <ScrollView contentContainerStyle={styles.mobileContent}>
      <Brand/>
      <Text style={styles.eyebrow}>{ES_WEB ? 'PORTAL PROFESIONAL' : 'APP DEL PACIENTE'}</Text>
      <Title dark>{ES_WEB ? 'CREAR CUENTA DE NUTRICIONISTA' : 'CREAR CUENTA'}</Title>
      <Card>
        <Text style={styles.cardLabel}>NOMBRE COMPLETO</Text>
        <TextInput value={nombre} onChangeText={setNombre} placeholder="Tu nombre" placeholderTextColor={C.dim} style={styles.input}/>
        <Text style={styles.cardLabel}>CORREO ELECTRÓNICO</Text>
        <TextInput value={email} onChangeText={setEmail} placeholder="tu@email.com" placeholderTextColor={C.dim} keyboardType="email-address" autoCapitalize="none" style={styles.input}/>
        <Text style={styles.cardLabel}>CONTRASEÑA</Text>
        <TextInput value={password} onChangeText={setPassword} placeholder="Mínimo 6 caracteres" placeholderTextColor={C.dim} secureTextEntry style={styles.input}/>
        <Text style={styles.cardLabel}>CONFIRMAR CONTRASEÑA</Text>
        <TextInput value={confirm} onChangeText={setConfirm} placeholder="Repite tu contraseña" placeholderTextColor={C.dim} secureTextEntry style={styles.input}/>
        {rol === 'PROFESIONAL' && (
          <>
            <Text style={styles.cardLabel}>RUT</Text>
            <TextInput value={rut} onChangeText={setRut} placeholder="12.345.678-9" placeholderTextColor={C.dim} style={styles.input}/>
            <Text style={styles.cardLabel}>CÓDIGO IDENTIFICADOR (6 DÍGITOS)</Text>
            <TextInput value={codigo} onChangeText={t => setCodigo(t.replace(/\D/g, '').slice(0, 6))} placeholder="123456" placeholderTextColor={C.dim} keyboardType="numeric" maxLength={6} style={styles.input}/>
          </>
        )}
        <Aviso text={error}/>
        <Button label={loading ? 'CREANDO CUENTA...' : 'REGISTRARME'} onPress={handleRegister}/>
      </Card>
      <Card>
        <Text style={styles.cardLabel}>IMPORTANTE</Text>
        <Text style={styles.body}>
          {ES_WEB
            ? 'El portal web es exclusivo para nutricionistas. Si eres paciente, regístrate desde la app móvil de Nutrap.'
            : 'Tu cuenta quedará pendiente hasta que un nutricionista te agregue como su paciente. Si eres nutricionista, regístrate desde el portal web.'}
        </Text>
      </Card>
      <Pressable onPress={goLogin} style={{ alignItems: 'center' }}><Text style={styles.proLink}>¿YA TIENES CUENTA? INICIAR SESIÓN</Text></Pressable>
    </ScrollView>
  );
}
