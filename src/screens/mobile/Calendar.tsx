// App móvil — calendario: semana actual, consumo semanal, resumen y consistencia del mes
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { C } from '../../constants/theme';
import type { Screen } from '../../types';
import type { UserProfile } from '../../types/models';
import { ConsumoService, hoy } from '../../services/firestoreService';
import { m, Header, BottomNav, AMARILLO } from './ui';
import { META_REFERENCIA } from './useConsumoHoy';
import { sumarDias, diaSemana, DIAS_CORTOS as DIAS } from './fechas';


/** Un día está "en meta" si quedó a ±10% de las calorías objetivo */
const TOLERANCIA = 0.10;
const ALTO_GRAFICO = 120;

export function Calendar({ go, user }: { go: (s: Screen) => void; user: UserProfile }) {
  const meta = (user.meta ?? META_REFERENCIA).caloriasObjetivo;
  const hoyStr = hoy();
  const lunes = sumarDias(hoyStr, -diaSemana(hoyStr));
  const semana = Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));
  const inicioMes = hoyStr.slice(0, 8) + '01';
  const [anio, mes] = hoyStr.split('-').map(Number);
  const diasDelMes = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  const diaHoy = Number(hoyStr.slice(8));

  const [kcalPorDia, setKcalPorDia] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    const desde = lunes < inicioMes ? lunes : inicioMes;
    ConsumoService.getDesde(user.uid, desde).then(dias => {
      const mapa: Record<string, number> = {};
      dias.forEach(d => { if (d.registros.length > 0) mapa[d.fecha] = d.totalCalorias; });
      setKcalPorDia(mapa);
    });
  }, [user.uid, lunes, inicioMes]);

  const enMeta = (kcal?: number) => kcal !== undefined && Math.abs(kcal - meta) / meta <= TOLERANCIA;

  const resumen = useMemo(() => {
    if (!kcalPorDia) return null;
    const fechasMes = Array.from({ length: diaHoy }, (_, i) => `${hoyStr.slice(0, 8)}${String(i + 1).padStart(2, '0')}`);
    const registrados = fechasMes.filter(f => kcalPorDia[f] !== undefined);
    const promedio = registrados.length ? Math.round(registrados.reduce((s, f) => s + kcalPorDia[f], 0) / registrados.length) : 0;
    const enMetaCount = fechasMes.filter(f => enMeta(kcalPorDia[f])).length;
    let racha = 0, mejor = 0;
    fechasMes.forEach(f => { racha = enMeta(kcalPorDia[f]) ? racha + 1 : 0; mejor = Math.max(mejor, racha); });
    return { promedio, enMetaCount, mejor };
  }, [kcalPorDia, meta]);

  const escala = meta * 1.4; // la línea de meta queda a ~70% del alto del gráfico

  return (
    <View style={m.screen}>
      <Header user={user} go={go}/>
      <ScrollView contentContainerStyle={m.content}>
        <Text style={m.title}>CALENDARIO</Text>

        {/* Semana actual */}
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {semana.map((f, i) => {
            const esHoy = f === hoyStr;
            return (
              <View key={f} style={{ flex: 1, alignItems: 'center', gap: 4, paddingVertical: 8, borderRadius: 8, backgroundColor: esHoy ? C.lime : C.panel2 }}>
                <Text style={{ fontSize: 8, fontWeight: '800', color: esHoy ? '#000' : C.muted }}>{DIAS[i]}</Text>
                <Text style={{ fontSize: 15, fontWeight: '900', color: esHoy ? '#000' : C.white }}>{Number(f.slice(8))}</Text>
              </View>
            );
          })}
        </View>

        {!kcalPorDia || !resumen ? <ActivityIndicator color={C.lime} style={{ marginTop: 24 }}/> : (
          <>
            {/* Consumo de la semana */}
            <View style={m.card}>
              <View style={m.row}>
                <Text style={m.label}>CONSUMO DIARIO (ESTA SEMANA)</Text>
                <Text style={{ color: C.muted, fontSize: 8, fontWeight: '700' }}>META: {meta} KCAL</Text>
              </View>
              <View style={{ height: ALTO_GRAFICO, flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 8 }}>
                {/* línea punteada de la meta */}
                <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: (meta / escala) * ALTO_GRAFICO, flexDirection: 'row', justifyContent: 'space-between' }}>
                  {Array.from({ length: 28 }, (_, i) => <View key={i} style={{ width: 5, height: 1, backgroundColor: C.muted }}/>)}
                </View>
                {semana.map(f => {
                  const kcal = kcalPorDia[f] ?? 0;
                  const alto = Math.max(3, Math.min(1, kcal / escala) * ALTO_GRAFICO);
                  const color = kcal === 0 ? C.panel2 : kcal > meta * (1 + TOLERANCIA) ? AMARILLO : C.lime;
                  return <View key={f} style={{ flex: 1, height: alto, backgroundColor: color, borderTopLeftRadius: 3, borderTopRightRadius: 3 }}/>;
                })}
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                  <Text key={i} style={{ flex: 1, textAlign: 'center', color: C.muted, fontSize: 9, fontWeight: '700' }}>{d}</Text>
                ))}
              </View>
            </View>

            {/* Resumen del mes */}
            <Text style={m.sectionMuted}>RESUMEN MENSUAL</Text>
            <View style={[m.card, { paddingVertical: 2, gap: 0 }]}>
              <View style={m.rowLine}><Text style={m.labelSm}>Promedio diario</Text><Text style={m.valueLime}>{resumen.promedio.toLocaleString('es-CL')} KCAL</Text></View>
              <View style={m.rowLine}><Text style={m.labelSm}>Días en meta</Text><Text style={m.valueLime}>{resumen.enMetaCount}/{diaHoy}</Text></View>
              <View style={[m.rowLine, { borderBottomWidth: 0 }]}><Text style={m.labelSm}>Mejor racha</Text><Text style={m.valueLime}>{resumen.mejor} {resumen.mejor === 1 ? 'DÍA' : 'DÍAS'}</Text></View>
            </View>

            {/* Consistencia del mes */}
            <View style={m.card}>
              <Text style={{ color: C.muted, fontSize: 9, fontWeight: '800', letterSpacing: 0.6 }}>REGISTRO DE CONSISTENCIA</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 10 }}>
                {Array.from({ length: diasDelMes }, (_, i) => {
                  const f = `${hoyStr.slice(0, 8)}${String(i + 1).padStart(2, '0')}`;
                  const kcal = kcalPorDia[f];
                  const ok = enMeta(kcal);
                  const futuro = i + 1 > diaHoy;
                  return (
                    <View key={f} style={{ width: `${100 / 7}%`, alignItems: 'center' }}>
                      <View style={{
                        width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center',
                        borderWidth: ok ? 1.5 : 0, borderColor: C.lime,
                        backgroundColor: ok ? 'transparent' : futuro ? 'transparent' : C.panel2,
                      }}>
                        <Text style={{ fontSize: 9, fontWeight: '800', color: ok ? C.lime : futuro ? C.dim : C.muted }}>{i + 1}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
              <Text style={m.dim}>Círculo verde: día en meta (±10% de tus calorías objetivo).</Text>
            </View>
          </>
        )}
      </ScrollView>
      <BottomNav active="calendar" go={go}/>
    </View>
  );
}
