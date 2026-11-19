// App móvil — perfil del paciente
import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { C } from '../../constants/theme';
import type { Screen } from '../../types';
import type { UserProfile } from '../../types/models';
import { m, Header, BottomNav, KcalRing, iniciales } from './ui';
import { useConsumoHoy, META_REFERENCIA } from './useConsumoHoy';

function Stat({ label, value, destacado = false }: { label: string; value: string; destacado?: boolean }) {
  return (
    <View style={[m.card, { flex: 1, padding: 10, gap: 6, borderWidth: 1, borderColor: destacado ? C.lime : C.panel }]}>
      <Text style={{ color: C.muted, fontSize: 8, fontWeight: '800', letterSpacing: 0.6 }}>{label}</Text>
      <Text style={{ color: C.white, fontSize: 15, fontWeight: '900' }}>{value}</Text>
    </View>
  );
}

export function Profile({ go, user }: { go: (s: Screen) => void; user: UserProfile }) {
  const consumo = useConsumoHoy(user.uid);
  const meta = user.meta ?? META_REFERENCIA;
  const kcal = consumo?.totalCalorias ?? 0;
  const pct = Math.round((kcal / meta.caloriasObjetivo) * 100);

  return (
    <View style={m.screen}>
      <Header user={user} go={go}/>
      <ScrollView contentContainerStyle={m.content}>
        <View style={{ alignItems: 'center', gap: 6, paddingVertical: 8 }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: C.lime, backgroundColor: C.panel2, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <Text style={{ color: C.white, fontSize: 30, fontWeight: '900' }}>{iniciales(user.nombre)}</Text>
          </View>
          <Text style={m.title}>{user.nombre.toUpperCase()}</Text>
          <Text style={m.dim}>{user.email}</Text>
        </View>

        <View style={[m.card, { paddingBottom: 22 }]}>
          <View style={m.row}>
            <Text style={m.label}>MI META DIARIA</Text>
            <Text style={[m.valueLime, { fontSize: 9 }]}>{pct}% COMPLETADO</Text>
          </View>
          <View style={{ alignItems: 'center', paddingTop: 10 }}>
            <KcalRing value={kcal} meta={meta.caloriasObjetivo} size={170} compacto/>
          </View>
        </View>

        <Text style={m.sectionMuted}>ESTADÍSTICAS CLAVE</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Stat label="PROTEÍNA META" value={`${meta.proteinaObjetivo} G`}/>
          <Stat label="CARBS META"    value={`${meta.carbohidratosObjetivo} G`} destacado/>
          <Stat label="GRASAS META"   value={`${meta.grasasObjetivo} G`}/>
        </View>

        <Pressable onPress={() => go('settings')} style={[m.btnLime, { marginTop: 4 }]}>
          <Text style={m.btnLimeText}>EDITAR PERFIL</Text>
        </Pressable>
      </ScrollView>
      <BottomNav go={go}/>
    </View>
  );
}
