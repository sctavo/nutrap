// Portal web — directorio y asociación de pacientes
import React, { useState } from 'react';
import { View, Text, TextInput, ActivityIndicator } from 'react-native';
import { C, styles } from '../../constants/theme';
import { Title, Card, Button, Stat } from '../../components';
import { ExpedienteService, kcalDeHoy } from '../../services/firestoreService';
import type { UserProfile } from '../../types/models';
import { Aviso } from '../shared';
import type { ProProps } from '../shared';
import { usePacientesEnVivo } from './usePacientesEnVivo';
import { ProShell } from './ProShell';

export function Users({ go, profesionalUid, nombre }: ProProps) {
  const { pacientes, loading } = usePacientesEnVivo(profesionalUid);
  const [email, setEmail] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [encontrado, setEncontrado] = useState<UserProfile | null>(null);
  const [aviso, setAviso] = useState<{ text: string; ok: boolean }>({ text: '', ok: false });
  const [asociando, setAsociando] = useState(false);

  const buscar = async () => {
    if (!email.trim()) return;
    setBuscando(true); setEncontrado(null); setAviso({ text: '', ok: false });
    try {
      const p = await ExpedienteService.buscarPacientePorEmail(email.trim());
      if (!p) setAviso({ text: 'No se encontró ningún paciente con ese correo.', ok: false });
      else if (p.profesionalUid === profesionalUid) setAviso({ text: 'Este paciente ya está en tu lista.', ok: false });
      else if (p.profesionalUid) setAviso({ text: 'Este paciente ya está asociado a otro nutricionista.', ok: false });
      else setEncontrado(p);
    } catch (e: any) {
      setAviso({ text: 'Error en la búsqueda: ' + (e.message ?? ''), ok: false });
    } finally { setBuscando(false); }
  };

  const asociar = async () => {
    if (!encontrado) return;
    setAsociando(true);
    try {
      await ExpedienteService.asociarPaciente(profesionalUid, encontrado);
      setAviso({ text: `✓ ${encontrado.nombre} fue agregado a tus pacientes.`, ok: true });
      setEncontrado(null); setEmail('');
    } catch (e: any) {
      setAviso({ text: 'Error al asociar: ' + (e.message ?? ''), ok: false });
    } finally { setAsociando(false); }
  };

  const altoRiesgo = pacientes.filter(p => p.estado === 'Riesgo' || p.estado === 'Crítico' || p.estado === 'Intervención Requerida').length;

  return (
    <ProShell screen="users" go={go} nombre={nombre}>
      <View style={styles.row}>
        <View><Title>DIRECTORIO DE PACIENTES</Title><Text style={styles.body}>Consulte, filtre y gestione todos los expedientes activos.</Text></View>
      </View>
      <Card>
        <Title dark>AGREGAR PACIENTE</Title>
        <Text style={styles.body}>Busca al paciente por el correo con que se registró en Nutrap.</Text>
        <View style={styles.row}>
          <TextInput value={email} onChangeText={t => { setEmail(t); setEncontrado(null); setAviso({ text: '', ok: false }); }} placeholder="paciente@email.com" placeholderTextColor={C.dim} keyboardType="email-address" autoCapitalize="none" style={[styles.input, styles.flex]}/>
          <Button label={buscando ? 'BUSCANDO...' : 'BUSCAR'} onPress={buscar}/>
        </View>
        {encontrado && (
          <View style={styles.meal}>
            <View style={styles.row}>
              <View><Text style={styles.cardTitle}>{encontrado.nombre}</Text><Text style={styles.body}>{encontrado.email} · Pendiente de asociación</Text></View>
              <Button label={asociando ? 'ASOCIANDO...' : 'ASOCIAR COMO MI PACIENTE'} onPress={asociar}/>
            </View>
          </View>
        )}
        <Aviso text={aviso.text} ok={aviso.ok}/>
      </Card>
      <View style={styles.proGrid}><Stat label="TOTAL ACTIVOS" value={String(pacientes.length)}/><Stat label="ALTO RIESGO" value={String(altoRiesgo)}/></View>
      <Card>
        {loading ? <ActivityIndicator color={C.lime}/> : pacientes.map(p => (
          <View key={p.uid} style={styles.tableRow}>
            <View><Text style={styles.cardTitle}>{p.nombre}</Text><Text style={styles.body}>{p.email}</Text></View>
            <View>
              <Text style={styles.body}>{p.estado}</Text>
              <Text style={styles.body}>Hoy: {kcalDeHoy(p)} / {p.caloriasObjetivo} kcal{p.peso ? ` · ${p.peso} kg` : ''}</Text>
            </View>
            <Text style={[styles.tableValue, p.estado !== 'Onboarding' && p.adherencia < 60 && { color: C.red }]}>
              {p.estado === 'Onboarding' ? 'SIN DATOS' : `${p.adherencia}%`}
            </Text>
          </View>
        ))}
        {!loading && pacientes.length === 0 && <Text style={styles.body}>Aún no tienes pacientes. Usa el buscador para agregar el primero.</Text>}
      </Card>
    </ProShell>
  );
}
