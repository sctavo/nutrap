// App móvil — comidas que el nutricionista planificó para un día
import React from 'react';
import { View, Text } from 'react-native';
import { C } from '../../constants/theme';
import type { UserProfile, ComidaPlanificada } from '../../types/models';
import { m } from './ui';
import { diaSemana } from './fechas';

const ORDEN = ['DESAYUNO', 'COLACIÓN', 'ALMUERZO', 'ONCE', 'CENA'];

function Aviso({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <View style={[m.card, { flexDirection: 'row', gap: 12, borderWidth: 1, borderColor: C.line }]}>
      <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: C.muted, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: C.muted, fontSize: 12, fontWeight: '900' }}>i</Text>
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={m.label}>{titulo}</Text>
        <Text style={m.dim}>{texto}</Text>
      </View>
    </View>
  );
}

export function ComidasPlanificadas({ user, fecha }: { user: UserProfile; fecha: string }) {
  const tieneDieta = Object.values(user.dieta ?? {}).some(d => (d?.length ?? 0) > 0);

  if (!tieneDieta) {
    return (
      <Aviso
        titulo="AÚN NO TIENES UNA DIETA"
        texto="Tu nutricionista todavía no te asigna comidas planificadas. Cuando lo haga, aquí verás qué comer cada día."
      />
    );
  }

  const clave = String(diaSemana(fecha)) as keyof NonNullable<UserProfile['dieta']>;
  const comidas: ComidaPlanificada[] = [...(user.dieta?.[clave] ?? [])]
    .sort((a, b) => (a.hora || '99').localeCompare(b.hora || '99') || ORDEN.indexOf(a.tipo) - ORDEN.indexOf(b.tipo));

  if (comidas.length === 0) {
    return <Aviso titulo="SIN COMIDAS PLANIFICADAS" texto="Tu nutricionista no planificó comidas para este día."/>;
  }

  const total = comidas.reduce((s, c) => s + c.kcal, 0);
  return (
    <>
      {comidas.map(c => (
        <View key={c.id} style={[m.card, { gap: 6 }]}>
          <View style={m.row}>
            <Text style={[m.valueLime, { fontSize: 10 }]}>{c.tipo}{c.hora ? `  ·  ${c.hora}` : ''}</Text>
            <Text style={[m.label, { color: C.muted }]}>{c.kcal} KCAL</Text>
          </View>
          <Text style={m.labelSm}>{c.descripcion}</Text>
        </View>
      ))}
      <Text style={[m.dim, { textAlign: 'right' }]}>Total planificado: {total.toLocaleString('es-CL')} kcal</Text>
    </>
  );
}
