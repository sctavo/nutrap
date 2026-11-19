// App móvil — registro de peso (opcional, solo en el día de hoy)
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { C } from '../../constants/theme';
import type { ConsumoDiario, UserProfile } from '../../types/models';
import { ConsumoService } from '../../services/firestoreService';
import { m } from './ui';
import { fechaLarga } from './fechas';

const kg = (n: number) => n.toLocaleString('es-CL', { maximumFractionDigits: 1 });

export function PesoCard({ user, consumo, editable }: { user: UserProfile; consumo: ConsumoDiario; editable: boolean }) {
  const [valor, setValor] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<{ text: string; ok: boolean } | null>(null);

  const guardar = async () => {
    const n = parseFloat(valor.replace(',', '.'));
    if (!isFinite(n) || n < 25 || n > 300) { setAviso({ text: 'Ingresa un peso entre 25 y 300 kg.', ok: false }); return; }
    setGuardando(true); setAviso(null);
    try {
      await ConsumoService.registrarPeso(user.uid, Math.round(n * 10) / 10);
      setValor('');
      setAviso({ text: '✓ Peso guardado. Tu nutricionista ya puede verlo.', ok: true });
    } catch (e: any) {
      setAviso({ text: 'No se pudo guardar: ' + (e.message ?? ''), ok: false });
    } finally { setGuardando(false); }
  };

  // Día anterior: solo lectura
  if (!editable) {
    return (
      <View style={[m.card, m.row]}>
        <Text style={m.label}>PESO</Text>
        <Text style={consumo.pesoKg ? [m.valueLime, { fontSize: 14 }] : m.dim}>
          {consumo.pesoKg ? `${kg(consumo.pesoKg)} KG` : 'Sin registro este día'}
        </Text>
      </View>
    );
  }

  return (
    <View style={m.card}>
      <View style={m.row}>
        <Text style={m.label}>PESO <Text style={{ color: C.dim, fontWeight: '700' }}>· OPCIONAL</Text></Text>
        {user.pesoActual ? <Text style={[m.valueLime, { fontSize: 14 }]}>{kg(user.pesoActual)} KG</Text> : null}
      </View>
      <Text style={m.dim}>
        {consumo.pesoKg
          ? 'Ya registraste tu peso hoy. Puedes corregirlo si quieres.'
          : user.pesoActual && user.pesoFecha
            ? `Último registro: ${fechaLarga(user.pesoFecha)}. ¿Quieres registrar tu peso de hoy?`
            : 'Si quieres, registra tu peso para que tu nutricionista vea tu evolución.'}
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput
          value={valor}
          onChangeText={t => setValor(t.replace(/[^0-9.,]/g, '').slice(0, 5))}
          placeholder="Ej: 72,5"
          placeholderTextColor={C.dim}
          keyboardType="decimal-pad"
          style={{ flex: 1, minWidth: 0, color: C.white, backgroundColor: C.panel2, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14 }}
        />
        <Pressable disabled={guardando || !valor} onPress={guardar} style={[m.btnLime, { paddingHorizontal: 18, opacity: !valor || guardando ? 0.5 : 1 }]}>
          <Text style={m.btnLimeText}>{guardando ? '...' : consumo.pesoKg ? 'CORREGIR' : 'GUARDAR'}</Text>
        </Pressable>
      </View>
      {aviso && <Text style={{ color: aviso.ok ? C.lime : C.red, fontSize: 11, fontWeight: '700' }}>{aviso.text}</Text>}
    </View>
  );
}
