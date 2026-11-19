// App móvil — consumo de agua del día (8 vasos de 250 ml)
import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { C } from '../../constants/theme';
import type { ConsumoDiario } from '../../types/models';
import { ConsumoService, META_AGUA_ML, VASO_ML } from '../../services/firestoreService';
import { m } from './ui';

const ml = (n: number) => n.toLocaleString('es-CL');

/** Vaso dibujado con View; `lleno` va de 0 a 1 */
function Vaso({ lleno }: { lleno: number }) {
  return (
    <View style={{ width: 22, height: 30, borderWidth: 1.5, borderTopWidth: 0, borderColor: lleno > 0 ? C.lime : C.dim, borderBottomLeftRadius: 5, borderBottomRightRadius: 5, justifyContent: 'flex-end', overflow: 'hidden' }}>
      <View style={{ height: `${lleno * 100}%`, backgroundColor: C.lime, opacity: 0.85 }}/>
    </View>
  );
}

export function AguaCard({ uid, consumo, editable }: { uid: string; consumo: ConsumoDiario; editable: boolean }) {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const agua = consumo.aguaMl ?? 0;
  const vasos = META_AGUA_ML / VASO_ML;

  const cambiar = async (delta: number) => {
    setGuardando(true); setError('');
    try { await ConsumoService.agregarAgua(uid, delta); }
    catch (e: any) { setError('No se pudo guardar: ' + (e.message ?? '')); }
    finally { setGuardando(false); }
  };

  return (
    <View style={m.card}>
      <View style={m.row}>
        <Text style={m.label}>AGUA</Text>
        <Text style={m.valueLime}>{ml(agua)} / {ml(META_AGUA_ML)} ML</Text>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
        {Array.from({ length: vasos }, (_, i) => (
          <Vaso key={i} lleno={Math.max(0, Math.min(1, (agua - i * VASO_ML) / VASO_ML))}/>
        ))}
      </View>

      {agua >= META_AGUA_ML && <Text style={[m.valueLime, { fontSize: 10 }]}>✓ META DE AGUA CUMPLIDA</Text>}

      {editable && (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable disabled={guardando || agua === 0} onPress={() => cambiar(-VASO_ML)} style={[m.btnGhost, { flex: 1, opacity: agua === 0 ? 0.4 : 1 }]}>
            <Text style={m.btnGhostText}>− 1 VASO</Text>
          </Pressable>
          <Pressable disabled={guardando} onPress={() => cambiar(VASO_ML)} style={[m.btnLime, { flex: 2, opacity: guardando ? 0.6 : 1 }]}>
            <Text style={m.btnLimeText}>+ 1 VASO ({VASO_ML} ML)</Text>
          </Pressable>
        </View>
      )}
      {!!error && <Text style={{ color: C.red, fontSize: 11, fontWeight: '700' }}>{error}</Text>}
    </View>
  );
}
