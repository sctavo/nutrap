// Portal web — constructor de la dieta semanal del plan activo de un paciente
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { C, styles } from '../../constants/theme';
import { Title, Card, Button } from '../../components';
import { PlanService } from '../../services/firestoreService';
import type { PlanNutricional, DietaSemanal, ComidaPlanificada, TipoComida } from '../../types/models';
import { Aviso } from '../shared';

const DIAS = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO'];
const TIPOS: TipoComida[] = ['DESAYUNO', 'COLACIÓN', 'ALMUERZO', 'ONCE', 'CENA'];
type Dia = '0' | '1' | '2' | '3' | '4' | '5' | '6';

const ordenar = (lista: ComidaPlanificada[]) =>
  [...lista].sort((a, b) => (a.hora || '99').localeCompare(b.hora || '99') || TIPOS.indexOf(a.tipo) - TIPOS.indexOf(b.tipo));

const totalDia = (lista?: ComidaPlanificada[]) => (lista ?? []).reduce((s, c) => s + c.kcal, 0);

export function ConstructorDieta({ plan }: { plan: PlanNutricional | null }) {
  const [dia, setDia] = useState<Dia>('0');
  const [dieta, setDieta] = useState<DietaSemanal>({});
  const [cambios, setCambios] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState({ text: '', ok: false });

  // Formulario de nueva comida
  const [tipo, setTipo] = useState<TipoComida>('DESAYUNO');
  const [hora, setHora] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [kcal, setKcal] = useState('');

  // Al cambiar de paciente/plan se carga su dieta guardada
  useEffect(() => {
    setDieta(plan?.dieta ?? {});
    setCambios(false);
    setAviso({ text: '', ok: false });
  }, [plan?.id]);

  if (!plan) {
    return (
      <Card>
        <Title dark>CONSTRUCTOR DE DIETAS</Title>
        <Text style={styles.body}>Selecciona un paciente con un plan asignado para armar su dieta semanal.</Text>
      </Card>
    );
  }

  const comidas = ordenar(dieta[dia] ?? []);
  const total = totalDia(comidas);
  const diferencia = plan.calorias > 0 ? Math.abs(total - plan.calorias) / plan.calorias : 1;

  const actualizar = (nueva: DietaSemanal) => { setDieta(nueva); setCambios(true); setAviso({ text: '', ok: false }); };

  const anadir = () => {
    const k = parseInt(kcal, 10);
    if (!descripcion.trim()) { setAviso({ text: 'Describe la comida.', ok: false }); return; }
    if (!k || k <= 0 || k > 3000) { setAviso({ text: 'Indica las kcal de la comida (1 a 3000).', ok: false }); return; }
    if (hora && !/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) { setAviso({ text: 'La hora debe ser HH:MM, por ejemplo 08:30.', ok: false }); return; }
    const nueva: ComidaPlanificada = { id: `${Date.now()}`, tipo, descripcion: descripcion.trim(), kcal: k, ...(hora ? { hora } : {}) };
    actualizar({ ...dieta, [dia]: [...(dieta[dia] ?? []), nueva] });
    setDescripcion(''); setKcal(''); setHora('');
  };

  const quitar = (id: string) => actualizar({ ...dieta, [dia]: (dieta[dia] ?? []).filter(c => c.id !== id) });

  const copiarATodaLaSemana = () => {
    const copia: DietaSemanal = {};
    (['0', '1', '2', '3', '4', '5', '6'] as Dia[]).forEach(d => {
      copia[d] = comidas.map((c, i) => ({ ...c, id: `${Date.now()}_${d}_${i}` }));
    });
    actualizar(copia);
    setAviso({ text: `Comidas del ${DIAS[Number(dia)].toLowerCase()} copiadas a toda la semana. Recuerda guardar.`, ok: true });
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      await PlanService.guardarDieta(plan, dieta);
      setCambios(false);
      setAviso({ text: `✓ Dieta guardada. ${plan.pacienteNombre} ya la ve en su app.`, ok: true });
    } catch (e: any) {
      setAviso({ text: 'Error al guardar la dieta: ' + (e.message ?? ''), ok: false });
    } finally { setGuardando(false); }
  };

  return (
    <Card>
      <View style={styles.row}>
        <View>
          <Title dark>CONSTRUCTOR DE DIETAS</Title>
          <Text style={styles.body}>{plan.pacienteNombre} · {plan.nombre} · semana tipo (se repite cada semana)</Text>
        </View>
        <View style={styles.row}>
          <Button label="COPIAR DÍA A TODA LA SEMANA" onPress={copiarATodaLaSemana} ghost/>
          <Button label={guardando ? 'GUARDANDO...' : cambios ? 'GUARDAR DIETA •' : 'GUARDAR DIETA'} onPress={guardar}/>
        </View>
      </View>

      {/* Días */}
      <View style={styles.week}>
        {DIAS.map((nombre, i) => {
          const d = String(i) as Dia;
          const activo = d === dia;
          const n = dieta[d]?.length ?? 0;
          return (
            <Pressable key={d} onPress={() => setDia(d)} style={[styles.day, activo && styles.dayActive, { gap: 2 }]}>
              <Text style={[styles.dayText, activo && { color: '#000' }]}>{nombre}</Text>
              <Text style={[styles.dayText, { color: activo ? '#000' : n ? C.lime : C.dim }]}>{n ? `${n} comidas` : 'vacío'}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Comidas del día */}
      {comidas.length === 0 && <Text style={styles.listLine}>Sin comidas para el {DIAS[Number(dia)].toLowerCase()}. Añade la primera abajo.</Text>}
      {comidas.map(c => (
        <View key={c.id} style={styles.meal}>
          <View style={styles.row}>
            <Text style={styles.mealTitle}>{c.tipo}{c.hora ? ` · ${c.hora}` : ''}</Text>
            <View style={styles.row}>
              <Text style={styles.tableValue}>{c.kcal} kcal</Text>
              <Pressable onPress={() => quitar(c.id)}><Text style={{ color: C.red, fontSize: 11, fontWeight: '800' }}>QUITAR</Text></Pressable>
            </View>
          </View>
          <Text style={styles.body}>{c.descripcion}</Text>
        </View>
      ))}
      <Text style={[styles.cardLabel, { color: comidas.length === 0 ? C.muted : diferencia <= 0.1 ? C.lime : C.red }]}>
        TOTAL DEL {DIAS[Number(dia)]}: {total} / {plan.calorias} KCAL DEL PLAN
        {comidas.length > 0 && diferencia > 0.1 ? (total > plan.calorias ? ' · SE PASA DE LA META' : ' · BAJO LA META') : ''}
      </Text>

      {/* Nueva comida */}
      <View style={[styles.meal, { gap: 12 }]}>
        <Text style={styles.cardLabel}>AÑADIR COMIDA AL {DIAS[Number(dia)]}</Text>
        <View style={[styles.row, { justifyContent: 'flex-start', flexWrap: 'wrap', gap: 8 }]}>
          {TIPOS.map(t => (
            <Pressable key={t} onPress={() => setTipo(t)} style={[styles.button, { paddingVertical: 7 }, tipo !== t && styles.buttonGhost]}>
              <Text style={[styles.buttonText, { fontSize: 10 }, tipo !== t && { color: C.white }]}>{t}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.fields}>
          <View style={[styles.field, { flex: 0.6 }]}>
            <Text style={styles.cardLabel}>HORA (OPCIONAL)</Text>
            <TextInput value={hora} onChangeText={t => setHora(t.replace(/[^0-9:]/g, '').slice(0, 5))} placeholder="08:30" placeholderTextColor={C.dim} style={styles.input}/>
          </View>
          <View style={[styles.field, { flex: 2 }]}>
            <Text style={styles.cardLabel}>DESCRIPCIÓN</Text>
            <TextInput value={descripcion} onChangeText={setDescripcion} placeholder="Ej: Avena con leche descremada y plátano" placeholderTextColor={C.dim} style={styles.input}/>
          </View>
          <View style={[styles.field, { flex: 0.6 }]}>
            <Text style={styles.cardLabel}>KCAL</Text>
            <TextInput value={kcal} onChangeText={t => setKcal(t.replace(/\D/g, '').slice(0, 4))} keyboardType="numeric" placeholder="450" placeholderTextColor={C.dim} style={styles.input}/>
          </View>
        </View>
        <Button label="AÑADIR" onPress={anadir}/>
      </View>
      <Aviso text={aviso.text} ok={aviso.ok}/>
    </Card>
  );
}
