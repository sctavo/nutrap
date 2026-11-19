// Portal web — panel principal (consola de monitoreo clínico)
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { C } from '../../constants/theme';
import { PlanService, hoy, fechaHace, kcalDeHoy } from '../../services/firestoreService';
import type { ExpedientePaciente, PlanNutricional } from '../../types/models';
import { AMARILLO, type ProProps } from '../shared';
import { usePacientesEnVivo } from './usePacientesEnVivo';
import { ProShell } from './ProShell';

const s = StyleSheet.create({
  panel:     { backgroundColor: C.panel, borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 18 },
  statLabel: { color: C.muted, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  statValue: { fontSize: 30, fontWeight: '900' },
  statSub:   { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  titulo:    { color: C.lime, fontSize: 15, fontWeight: '900', letterSpacing: 1 },
  th:        { color: C.dim, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  fila:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderTopWidth: 1, borderColor: C.line },
  avatar:    { width: 30, height: 30, borderRadius: 15, backgroundColor: C.panel2, alignItems: 'center', justifyContent: 'center' },
  barra:     { flex: 1, height: 5, backgroundColor: C.panel2, borderRadius: 3, overflow: 'hidden' },
  btn:       { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 6, alignItems: 'center', minWidth: 96 },
  evento:    { backgroundColor: C.panel2, borderRadius: 8, padding: 12, gap: 6 },
});

const COL = { nombre: 2.2, analisis: 1.6, adherencia: 2.2, accion: 1.1 };
const H48 = 48 * 3_600_000;
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const enAlerta = (p: ExpedientePaciente) => p.estado === 'Riesgo' || p.estado === 'Crítico' || p.estado === 'Intervención Requerida';
const sinRegistro48h = (p: ExpedientePaciente) => !!p.ultimoRegistroTs && Date.now() - p.ultimoRegistroTs > H48;
const colorAdherencia = (a: number) => (a >= 80 ? C.lime : a >= 60 ? AMARILLO : C.red);
const iniciales = (n: string) => n.split(' ').filter(Boolean).map(x => x[0]).join('').toUpperCase().slice(0, 2);

/** "Hoy, 08:30 AM" · "Ayer, 04:12 PM" · "15 Nov, 11:20 AM" */
function ultimoAnalisis(ts?: number): string {
  if (!ts) return 'Sin registros';
  const d = new Date(ts);
  const fecha = d.toLocaleDateString('sv-SE', { timeZone: 'America/Santiago' });
  const h = d.getHours();
  const horaTxt = `${String(h % 12 || 12).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
  const dia = fecha === hoy() ? 'Hoy' : fecha === fechaHace(1) ? 'Ayer' : `${Number(fecha.slice(8))} ${MESES[Number(fecha.slice(5, 7)) - 1]}`;
  return `${dia}, ${horaTxt}`;
}

type Evento = { tipo: 'alerta' | 'logro' | 'sistema'; texto: string };

/** Registro del sistema: se arma con los datos en vivo de pacientes y planes */
function eventos(pacientes: ExpedientePaciente[], planes: PlanNutricional[]): Evento[] {
  const lista: Evento[] = [];
  pacientes.forEach(p => {
    if (sinRegistro48h(p)) {
      const horas = Math.floor((Date.now() - (p.ultimoRegistroTs ?? 0)) / 3_600_000);
      lista.push({ tipo: 'alerta', texto: `${p.nombre} no ha registrado comidas por ${horas >= 72 ? `${Math.floor(horas / 24)} días` : `${horas} horas`} consecutivas.` });
    }
    if (p.estado === 'Crítico' || p.estado === 'Intervención Requerida') {
      lista.push({ tipo: 'alerta', texto: `${p.nombre} tiene adherencia crítica (${p.adherencia}%). Revisa su plan.` });
    }
  });
  pacientes.forEach(p => {
    if (p.estado !== 'Onboarding' && p.adherencia >= 95) lista.push({ tipo: 'logro', texto: `${p.nombre} alcanzó ${p.adherencia}% de adherencia a su plan.` });
    const kcal = kcalDeHoy(p);
    if (kcal > 0 && Math.abs(kcal - p.caloriasObjetivo) / p.caloriasObjetivo <= 0.1) lista.push({ tipo: 'logro', texto: `${p.nombre} ya cumplió su meta calórica de hoy (${kcal} kcal).` });
  });
  pacientes.filter(p => !p.ultimoRegistroTs).forEach(p => lista.push({ tipo: 'sistema', texto: `${p.nombre} aún no registra su primera comida.` }));
  planes.filter(p => p.activo && !Object.values(p.dieta ?? {}).some(d => (d?.length ?? 0) > 0))
    .forEach(p => lista.push({ tipo: 'sistema', texto: `El plan de ${p.pacienteNombre} no tiene dieta asignada.` }));
  lista.push({ tipo: 'sistema', texto: `Sincronizado en tiempo real · ${pacientes.length} ${pacientes.length === 1 ? 'paciente monitoreado' : 'pacientes monitoreados'}.` });
  return lista;
}

const ESTILO_EVENTO = {
  alerta:  { color: C.red,   etiqueta: 'ALERTA CRÍTICA' },
  logro:   { color: C.lime,  etiqueta: 'LOGRO' },
  sistema: { color: C.muted, etiqueta: 'SISTEMA' },
};

function StatCard({ label, value, color, sub, subColor }: { label: string; value: string; color: string; sub: string; subColor: string }) {
  return (
    <View style={[s.panel, { flex: 1, minWidth: 170, gap: 10, padding: 14 }]}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={[s.statSub, { color: subColor }]}>{sub}</Text>
    </View>
  );
}

export function ProDashboard({ go, profesionalUid, nombre }: ProProps) {
  const { pacientes, loading } = usePacientesEnVivo(profesionalUid);
  const [planes, setPlanes] = useState<PlanNutricional[]>([]);
  const [busqueda, setBusqueda] = useState('');
  useEffect(() => PlanService.escucharPorProfesional(profesionalUid, setPlanes), [profesionalUid]);

  // ── Indicadores ──
  const mes = hoy().slice(0, 7);
  const nuevosMes = pacientes.filter(p => p.fechaIngreso?.startsWith(mes)).length;
  const criticos = pacientes.filter(p => p.estado === 'Crítico' || p.estado === 'Intervención Requerida');
  const desviados = pacientes.filter(enAlerta).length;
  const pctCritico = pacientes.length ? Math.round((criticos.length / pacientes.length) * 100) : 0;
  const planesActivos = planes.filter(p => p.activo);
  const sinDieta = planesActivos.filter(p => !Object.values(p.dieta ?? {}).some(d => (d?.length ?? 0) > 0)).length;
  const conDatos = pacientes.filter(p => p.estado !== 'Onboarding');
  const adherencia = conDatos.length ? Math.round(conDatos.reduce((a, p) => a + p.adherencia, 0) / conDatos.length) : 0;

  // ── Tabla: primero quienes necesitan intervención, luego por nombre ──
  const q = busqueda.trim().toLowerCase();
  const filas = pacientes
    .filter(p => !q || p.nombre.toLowerCase().includes(q) || p.email.toLowerCase().includes(q))
    .sort((a, b) => Number(enAlerta(b) || sinRegistro48h(b)) - Number(enAlerta(a) || sinRegistro48h(a)) || a.nombre.localeCompare(b.nombre));

  const registro = eventos(pacientes, planes);
  const alertas = registro.filter(e => e.tipo === 'alerta').length;

  return (
    <ProShell screen="pro-dashboard" go={go} nombre={nombre} busqueda={busqueda} onBusqueda={setBusqueda} alertas={alertas}>
      <View style={{ flexDirection: 'row', gap: 24, alignItems: 'stretch' }}>
        {/* Columna principal */}
        <View style={{ flex: 1, minWidth: 0, gap: 24 }}>
          <View style={{ flexDirection: 'row', gap: 14, flexWrap: 'wrap' }}>
            <StatCard label="TOTAL PACIENTES ACTIVOS" value={String(pacientes.length)} color={C.lime}
              sub={`+${nuevosMes} este mes`} subColor={C.lime}/>
            <StatCard label="CUMPLIMIENTO CRÍTICO" value={`${pctCritico}%`} color={pctCritico > 0 ? C.red : C.white}
              sub={`${desviados} ${desviados === 1 ? 'paciente desviado' : 'pacientes desviados'}`} subColor={desviados ? C.red : C.muted}/>
            <StatCard label="PROTOCOLOS ACTIVOS" value={String(planesActivos.length)} color={C.white}
              sub={sinDieta ? `${sinDieta} sin dieta asignada` : 'Todos con dieta'} subColor={sinDieta ? AMARILLO : C.lime}/>
            <StatCard label="ADHERENCIA PROMEDIO" value={conDatos.length ? `${adherencia}%` : '—'} color={C.white}
              sub={!conDatos.length ? 'Sin datos aún' : adherencia >= 80 ? 'Sistema óptimo' : 'Requiere atención'} subColor={!conDatos.length ? C.muted : colorAdherencia(adherencia)}/>
          </View>

          <View style={s.panel}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={s.titulo}>LISTADO DE PACIENTES</Text>
              <Text style={{ color: C.muted, fontSize: 11 }}>Adherencia en tiempo real</Text>
            </View>
            <View style={{ flexDirection: 'row', paddingBottom: 10 }}>
              <Text style={[s.th, { flex: COL.nombre }]}>ID / NOMBRE</Text>
              <Text style={[s.th, { flex: COL.analisis }]}>ÚLTIMO REGISTRO</Text>
              <Text style={[s.th, { flex: COL.adherencia }]}>ADHERENCIA</Text>
              <Text style={[s.th, { flex: COL.accion, textAlign: 'right' }]}>ACCIÓN</Text>
            </View>

            {loading && <ActivityIndicator color={C.lime} style={{ margin: 20 }}/>}
            {!loading && pacientes.length === 0 && (
              <Text style={{ color: C.muted, fontSize: 13, paddingVertical: 16 }}>Aún no tienes pacientes. Agrégalos desde USUARIOS.</Text>
            )}
            {!loading && pacientes.length > 0 && filas.length === 0 && (
              <Text style={{ color: C.muted, fontSize: 13, paddingVertical: 16 }}>Ningún paciente coincide con "{busqueda}".</Text>
            )}

            {filas.map(p => {
              const intervenir = enAlerta(p) || sinRegistro48h(p);
              const sinDatos = p.estado === 'Onboarding';
              return (
                <View key={p.uid} style={s.fila}>
                  <View style={{ flex: COL.nombre, flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <View style={s.avatar}><Text style={{ color: C.muted, fontSize: 10, fontWeight: '900' }}>{iniciales(p.nombre)}</Text></View>
                    <View style={{ minWidth: 0 }}>
                      <Text style={{ color: C.white, fontWeight: '800', fontSize: 13 }} numberOfLines={1}>{p.nombre}</Text>
                      <Text style={{ color: C.dim, fontSize: 9, letterSpacing: 0.5 }}>PT-{p.uid.slice(0, 4).toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={{ flex: COL.analisis, color: p.ultimoRegistroTs ? C.muted : C.dim, fontSize: 12 }}>{ultimoAnalisis(p.ultimoRegistroTs)}</Text>
                  <View style={{ flex: COL.adherencia, flexDirection: 'row', alignItems: 'center', gap: 10, paddingRight: 16 }}>
                    <View style={s.barra}>
                      {!sinDatos && <View style={{ width: `${p.adherencia}%`, height: 5, borderRadius: 3, backgroundColor: colorAdherencia(p.adherencia) }}/>}
                    </View>
                    <Text style={{ width: 66, fontSize: 11, fontWeight: '800', color: sinDatos ? C.dim : colorAdherencia(p.adherencia) }}>
                      {sinDatos ? 'SIN DATOS' : `${p.adherencia}%`}
                    </Text>
                  </View>
                  <View style={{ flex: COL.accion, alignItems: 'flex-end' }}>
                    {intervenir ? (
                      <Pressable onPress={() => go('plans')} style={[s.btn, { borderWidth: 1, borderColor: AMARILLO }]}>
                        <Text style={{ color: AMARILLO, fontSize: 9, fontWeight: '900', letterSpacing: 1 }}>INTERVENIR</Text>
                      </Pressable>
                    ) : (
                      <Pressable onPress={() => go('users')} style={[s.btn, { backgroundColor: C.panel2 }]}>
                        <Text style={{ color: C.white, fontSize: 9, fontWeight: '900', letterSpacing: 1 }}>VER</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Registro del sistema */}
        <View style={[s.panel, { width: 300, gap: 12, minHeight: 560 }]}>
          <Text style={[s.titulo, { marginBottom: 6 }]}>REGISTRO DEL SISTEMA</Text>
          {registro.slice(0, 10).map((e, i) => {
            const st = ESTILO_EVENTO[e.tipo];
            return (
              <View key={i} style={s.evento}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: st.color }}/>
                  <Text style={{ color: st.color, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 }}>{st.etiqueta}</Text>
                </View>
                <Text style={{ color: C.white, fontSize: 12, lineHeight: 17 }}>{e.texto}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </ProShell>
  );
}
