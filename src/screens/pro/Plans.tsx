// Portal web — planes nutricionales
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { C, styles } from '../../constants/theme';
import { Title, Card, Button, Macro } from '../../components';
import { PlanService } from '../../services/firestoreService';
import type { ExpedientePaciente, PlanNutricional } from '../../types/models';
import { Aviso } from '../shared';
import type { ProProps } from '../shared';
import { usePacientesEnVivo } from './usePacientesEnVivo';
import { ProShell } from './ProShell';
import { ConstructorDieta } from './ConstructorDieta';

// ── Planes ────────────────────────────────────────────────────────────────
const KCAL_POR_GRAMO = { proteina: 4, carbohidratos: 4, grasas: 9 } as const;
const num = (s: string) => parseInt(s.replace(/\D/g, ''), 10) || 0;
const gramos = (kcal: number, porcentaje: number, kcalPorGramo: number) => Math.round((kcal * porcentaje) / 100 / kcalPorGramo);

function MacroInput({ label, descripcion, rango, kcalPorGramo, value, onChange, kcalTotal }: {
  label: string; descripcion: string; rango: string; kcalPorGramo: number;
  value: string; onChange: (v: string) => void; kcalTotal: number;
}) {
  const p = num(value);
  const kcalMacro = Math.round((kcalTotal * p) / 100);
  return (
    <View style={styles.meal}>
      <View style={styles.row}>
        <Text style={styles.mealTitle}>{label}</Text>
        <Text style={styles.cardLabel}>{kcalPorGramo} KCAL POR GRAMO</Text>
      </View>
      <Text style={styles.body}>{descripcion}</Text>
      <Text style={styles.cardLabel}>RANGO HABITUAL: {rango} DE LAS CALORÍAS</Text>
      <View style={styles.fields}>
        <View style={styles.field}>
          <Text style={styles.cardLabel}>PORCENTAJE (%)</Text>
          <TextInput value={value} onChangeText={t => onChange(t.replace(/\D/g, '').slice(0, 3))} keyboardType="numeric" placeholder="0" placeholderTextColor={C.dim} style={styles.input}/>
        </View>
        <View style={styles.field}>
          <Text style={styles.cardLabel}>EQUIVALE A</Text>
          <Text style={styles.statValue}>{gramos(kcalTotal, p, kcalPorGramo)} g · {kcalMacro} kcal</Text>
        </View>
      </View>
    </View>
  );
}

export function Plans({ go, profesionalUid, nombre }: ProProps) {
  const { pacientes, loading } = usePacientesEnVivo(profesionalUid);
  const [planes, setPlanes] = useState<PlanNutricional[]>([]);

  const [seleccionado, setSeleccionado] = useState<ExpedientePaciente | null>(null);
  const [nombrePlan, setNombrePlan] = useState('');
  const [kcal, setKcal] = useState('');
  const [proteina, setProteina] = useState('30');
  const [carbohidratos, setCarbohidratos] = useState('45');
  const [grasas, setGrasas] = useState('25');
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<{ text: string; ok: boolean }>({ text: '', ok: false });

  useEffect(() => PlanService.escucharPorProfesional(profesionalUid, setPlanes), [profesionalUid]);

  const kcalTotal = num(kcal);
  const pP = num(proteina), pC = num(carbohidratos), pG = num(grasas);
  const suma = pP + pC + pG;

  const asignar = async () => {
    if (!seleccionado) { setAviso({ text: 'Selecciona un paciente.', ok: false }); return; }
    if (kcalTotal < 800 || kcalTotal > 6000) { setAviso({ text: 'Las calorías totales deben estar entre 800 y 6000 kcal.', ok: false }); return; }
    if (suma !== 100) { setAviso({ text: `Los porcentajes deben sumar 100% (ahora suman ${suma}%).`, ok: false }); return; }
    setGuardando(true); setAviso({ text: '', ok: false });
    try {
      await PlanService.asignar({
        nombre: nombrePlan.trim() || `PLAN ${seleccionado.nombre.toUpperCase()}`,
        pacienteUid: seleccionado.uid,
        pacienteNombre: seleccionado.nombre,
        profesionalUid,
        calorias: kcalTotal,
        proteinaPct: pP, carbohidratosPct: pC, grasasPct: pG,
        proteinaG:      gramos(kcalTotal, pP, KCAL_POR_GRAMO.proteina),
        carbohidratosG: gramos(kcalTotal, pC, KCAL_POR_GRAMO.carbohidratos),
        grasasG:        gramos(kcalTotal, pG, KCAL_POR_GRAMO.grasas),
      });
      setAviso({ text: `✓ Plan asignado a ${seleccionado.nombre}.`, ok: true });
      setNombrePlan(''); setKcal('');
    } catch (e: any) {
      setAviso({ text: 'Error al asignar el plan: ' + (e.message ?? ''), ok: false });
    } finally { setGuardando(false); }
  };

  const activos = planes.filter(p => p.activo);

  return (
    <ProShell screen="plans" go={go} nombre={nombre}>
      <View style={styles.row}>
        <View><Title>GESTIÓN DE PLANES ALIMENTICIOS</Title><Text style={styles.body}>Creación y asignación de pautas nutricionales personalizadas.</Text></View>
        <Button label={guardando ? 'ASIGNANDO...' : 'ASIGNAR A PACIENTE'} onPress={asignar}/>
      </View>
      <Aviso text={aviso.text} ok={aviso.ok}/>

      {/* 1 · Paciente */}
      <Card>
        <Title dark>1 · SELECCIONAR PACIENTE</Title>
        {loading ? <ActivityIndicator color={C.lime}/> : pacientes.length === 0 ? (
          <Text style={styles.body}>Aún no tienes pacientes asociados. Agrégalos desde USUARIOS.</Text>
        ) : pacientes.map(p => {
          const activo = seleccionado?.uid === p.uid;
          return (
            <Pressable key={p.uid} onPress={() => setSeleccionado(p)} style={[styles.tableRow, activo && { borderColor: C.lime }]}>
              <View><Text style={[styles.cardTitle, activo && { color: C.lime }]}>{p.nombre}</Text><Text style={styles.body}>{p.email}</Text></View>
              <Text style={styles.body}>{p.planActivoId ? `Plan actual: ${p.caloriasObjetivo} kcal` : 'Sin plan'}</Text>
              <Text style={styles.tableValue}>{activo ? 'SELECCIONADO' : 'ELEGIR'}</Text>
            </Pressable>
          );
        })}
      </Card>

      {/* 2 · Calorías */}
      <Card>
        <Title dark>2 · CALORÍAS TOTALES</Title>
        <Text style={styles.body}>Energía total que el paciente debe consumir al día. Las macros se calculan a partir de este número.</Text>
        <View style={styles.fields}>
          <View style={styles.field}>
            <Text style={styles.cardLabel}>PACIENTE</Text>
            <Text style={styles.statValue}>{seleccionado ? seleccionado.nombre : '—'}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.cardLabel}>NOMBRE DEL PLAN (OPCIONAL)</Text>
            <TextInput value={nombrePlan} onChangeText={setNombrePlan} placeholder="Ej: PROTOCOLO HIPERTROFIA V2" placeholderTextColor={C.dim} style={styles.input}/>
          </View>
          <View style={styles.field}>
            <Text style={styles.cardLabel}>CALORÍAS OBJETIVO (KCAL)</Text>
            <TextInput value={kcal} onChangeText={t => setKcal(t.replace(/\D/g, '').slice(0, 4))} keyboardType="numeric" placeholder="2800" placeholderTextColor={C.dim} style={styles.input}/>
          </View>
        </View>
      </Card>

      <View style={styles.split}>
        {/* 3 · Macros */}
        <Card style={styles.flex}>
          <Title dark>3 · DISTRIBUCIÓN DE MACROS</Title>
          <Text style={styles.body}>
            Los macronutrientes son los tres nutrientes que aportan energía. Indica qué porcentaje de las calorías totales vendrá de cada uno; deben sumar 100%.
          </Text>
          <MacroInput
            label="PROTEÍNA" kcalPorGramo={KCAL_POR_GRAMO.proteina} rango="10–35%"
            descripcion="Construye y repara músculos y tejidos; forma enzimas y hormonas. Clave en planes de hipertrofia o recuperación. Ej: carnes, huevo, legumbres, lácteos."
            value={proteina} onChange={setProteina} kcalTotal={kcalTotal}
          />
          <MacroInput
            label="CARBOHIDRATOS" kcalPorGramo={KCAL_POR_GRAMO.carbohidratos} rango="45–65%"
            descripcion="Principal fuente de energía del cuerpo, sobre todo del cerebro y durante el ejercicio. Ej: arroz, avena, pan, frutas, papas."
            value={carbohidratos} onChange={setCarbohidratos} kcalTotal={kcalTotal}
          />
          <MacroInput
            label="GRASAS" kcalPorGramo={KCAL_POR_GRAMO.grasas} rango="20–35%"
            descripcion="Energía concentrada; necesarias para producir hormonas y absorber las vitaminas A, D, E y K. Ej: aceite de oliva, palta, frutos secos."
            value={grasas} onChange={setGrasas} kcalTotal={kcalTotal}
          />
          <Macro label="TOTAL DISTRIBUIDO" now={`${suma}%`} goal="100%" percent={Math.min(100, suma)}/>
          {suma !== 100 && <Aviso text={suma > 100 ? `Sobran ${suma - 100}% — ajusta los valores.` : `Faltan ${100 - suma}% por distribuir.`}/>}
        </Card>

        {/* Planes activos */}
        <Card style={styles.activePlans}>
          <Title dark>PLANES ACTIVOS</Title>
          {activos.length === 0 && !loading && <Text style={styles.body}>Aún no has asignado planes.</Text>}
          {activos.map(p => (
            <View key={p.id} style={styles.meal}>
              <Text style={styles.mealTitle}>{p.nombre.toUpperCase()}</Text>
              <Text style={styles.body}>Asignado a {p.pacienteNombre} · {p.calorias} kcal</Text>
              <Text style={styles.body}>P {p.proteinaPct}% ({p.proteinaG}g) · C {p.carbohidratosPct}% ({p.carbohidratosG}g) · G {p.grasasPct}% ({p.grasasG}g)</Text>
              {(() => {
                const n = Object.values(p.dieta ?? {}).reduce((s, d) => s + (d?.length ?? 0), 0);
                return n > 0
                  ? <Text style={[styles.cardLabel, { color: C.lime }]}>DIETA: {n} COMIDAS / SEMANA</Text>
                  : <Text style={[styles.cardLabel, { color: C.red }]}>⚠ SIN DIETA ASIGNADA</Text>;
              })()}
            </View>
          ))}
        </Card>
      </View>

      {/* 4 · Dieta semanal del plan activo del paciente seleccionado */}
      <ConstructorDieta plan={seleccionado ? activos.find(p => p.pacienteUid === seleccionado.uid) ?? null : null}/>
    </ProShell>
  );
}
