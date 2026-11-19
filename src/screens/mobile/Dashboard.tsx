// App móvil — dashboard del paciente (navegable por día)
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { C } from '../../constants/theme';
import type { Screen } from '../../types';
import type { UserProfile, RegistroAlimento } from '../../types/models';
import { hoy } from '../../services/firestoreService';
import { m, Header, BottomNav, KcalRing, MacroCard, AMARILLO } from './ui';
import { useConsumoDia, META_REFERENCIA } from './useConsumoHoy';
import { sumarDias, etiquetaDia, fechaLarga, hora } from './fechas';
import { AguaCard } from './AguaCard';
import { PesoCard } from './PesoCard';
import { ComidasPlanificadas } from './ComidasPlanificadas';

/** Cuántos días hacia adelante se pueden ver las comidas planificadas */
const DIAS_FUTUROS = 6;

function Flecha({ texto, onPress, disabled = false }: { texto: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[m.iconBtn, { opacity: disabled ? 0.25 : 1 }]}>
      <Text style={{ color: C.lime, fontSize: 20, fontWeight: '900', marginTop: -2 }}>{texto}</Text>
    </Pressable>
  );
}

function Alimento({ r }: { r: RegistroAlimento }) {
  return (
    <View style={[m.card, m.row]}>
      <Text style={{ color: C.muted, fontSize: 10, fontWeight: '800', width: 36 }}>{hora(r.timestamp)}</Text>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={m.label} numberOfLines={1}>{r.nombre.toUpperCase()}</Text>
        <Text style={m.dim}>P {r.proteina}g · C {r.carbohidratos}g · G {r.grasas}g</Text>
      </View>
      <Text style={[m.valueLime, { fontSize: 13 }]}>{r.calorias} KCAL</Text>
    </View>
  );
}

export function Dashboard({ go, user }: { go: (s: Screen) => void; user: UserProfile }) {
  const hoyStr = hoy();
  const [fecha, setFecha] = useState(hoyStr);
  const esHoy = fecha === hoyStr;
  const esFuturo = fecha > hoyStr;
  const limite = sumarDias(hoyStr, DIAS_FUTUROS);
  const consumo = useConsumoDia(user.uid, fecha);
  const meta = user.meta ?? META_REFERENCIA;
  const alimentos = [...(consumo?.registros ?? [])].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <View style={m.screen}>
      <Header user={user} go={go}/>
      <ScrollView contentContainerStyle={m.content}>
        {/* Selector de día */}
        <View style={m.row}>
          <Flecha texto="‹" onPress={() => setFecha(f => sumarDias(f, -1))}/>
          <View style={{ alignItems: 'center', gap: 2 }}>
            <Text style={m.title}>{etiquetaDia(fecha, hoyStr)}</Text>
            <Text style={m.dim}>{fechaLarga(fecha)}</Text>
          </View>
          <Flecha texto="›" onPress={() => setFecha(f => sumarDias(f, 1))} disabled={fecha >= limite}/>
        </View>
        {fecha !== hoyStr && (
          <Pressable onPress={() => setFecha(hoyStr)} style={{ alignSelf: 'center', marginTop: -6 }}>
            <Text style={[m.valueLime, { fontSize: 10 }]}>VOLVER A HOY</Text>
          </Pressable>
        )}

        {esFuturo ? (
          <>
            <Text style={m.section}>COMIDAS PLANIFICADAS</Text>
            <Text style={m.dim}>Así se ve tu día según la dieta de tu nutricionista.</Text>
            <ComidasPlanificadas user={user} fecha={fecha}/>
          </>
        ) : !consumo ? <ActivityIndicator color={C.lime} style={{ marginVertical: 120 }}/> : (
          <>
            <View style={{ alignItems: 'center', paddingVertical: 12 }}>
              <KcalRing value={consumo.totalCalorias} meta={meta.caloriasObjetivo} size={250}/>
            </View>

            <Text style={m.section}>MACROS</Text>
            <MacroCard label="PROTEÍNA"      actual={consumo.totalProteina}      meta={meta.proteinaObjetivo}      color={C.lime}/>
            <MacroCard label="CARBOHIDRATOS" actual={consumo.totalCarbohidratos} meta={meta.carbohidratosObjetivo} color={AMARILLO}/>
            <MacroCard label="GRASAS"        actual={consumo.totalGrasas}        meta={meta.grasasObjetivo}        color={C.lime}/>
            {!user.meta && <Text style={m.dim}>Tu nutricionista aún no te asigna un plan. Se muestran metas de referencia.</Text>}

            <Text style={m.section}>COMIDAS PLANIFICADAS</Text>
            <ComidasPlanificadas user={user} fecha={fecha}/>

            <View style={[m.row, { marginTop: 6 }]}>
              <Text style={[m.section, { marginTop: 0 }]}>ALIMENTOS {esHoy ? 'DE HOY' : 'DEL DÍA'}</Text>
              {alimentos.length > 0 && <Text style={m.dim}>{alimentos.length} {alimentos.length === 1 ? 'registro' : 'registros'}</Text>}
            </View>
            {alimentos.map(r => <Alimento key={r.id} r={r}/>)}
            {alimentos.length === 0 && (
              <View style={[m.card, { alignItems: 'center', paddingVertical: 18 }]}>
                <Text style={m.dim}>{esHoy ? 'Aún no registras alimentos hoy.' : 'No registraste alimentos este día.'}</Text>
              </View>
            )}
            {esHoy && (
              <Pressable onPress={() => go('scanner')} style={m.btnGhost}>
                <Text style={[m.btnGhostText, { color: C.lime }]}>+ REGISTRAR ALIMENTO</Text>
              </Pressable>
            )}

            <Text style={m.section}>HIDRATACIÓN Y PESO</Text>
            <AguaCard uid={user.uid} consumo={consumo} editable={esHoy}/>
            <PesoCard user={user} consumo={consumo} editable={esHoy}/>
          </>
        )}
      </ScrollView>
      <BottomNav active="dashboard" go={go}/>
    </View>
  );
}
