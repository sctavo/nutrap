// App móvil — configuración
import React, { useState } from 'react';
import { View, Text, ScrollView, Switch, Pressable } from 'react-native';
import { C } from '../../constants/theme';
import type { Screen } from '../../types';
import type { UserProfile } from '../../types/models';
import { m, Header, BottomNav } from './ui';

const interruptor = (value: boolean, onChange: (v: boolean) => void) => (
  <Switch value={value} onValueChange={onChange} trackColor={{ true: C.lime, false: C.panel2 }} thumbColor={value ? C.bg : C.muted}/>
);

export function Settings({ go, user, onLogout }: { go: (s: Screen) => void; user: UserProfile; onLogout: () => Promise<void> }) {
  const [oscuro, setOscuro] = useState(true);
  const [push, setPush]     = useState(true);

  return (
    <View style={m.screen}>
      <Header user={user} go={go}/>
      <ScrollView contentContainerStyle={m.content}>
        <Text style={m.title}>CONFIGURACIÓN</Text>

        <Text style={m.sectionLime}>APARIENCIA</Text>
        <View style={[m.card, m.row, { paddingVertical: 10 }]}>
          <Text style={m.label}>MODO OSCURO / CLARO</Text>
          {interruptor(oscuro, setOscuro)}
        </View>

        <Text style={m.sectionMuted}>PREFERENCIAS</Text>
        <View style={[m.card, { paddingVertical: 2, gap: 0 }]}>
          <View style={m.rowLine}>
            <Text style={m.labelSm}>Notificaciones push</Text>
            {interruptor(push, setPush)}
          </View>
          <View style={m.rowLine}>
            <Text style={m.labelSm}>Unidades de medida</Text>
            <Text style={m.valueLime}>MÉTRICO (KG)  ›</Text>
          </View>
          <View style={[m.rowLine, { borderBottomWidth: 0 }]}>
            <Text style={m.labelSm}>Idioma</Text>
            <Text style={m.muted}>Español  ›</Text>
          </View>
        </View>

        <Text style={m.sectionMuted}>SOPORTE</Text>
        <View style={m.card}>
          <View style={m.row}>
            <Text style={m.labelSm}>NutriTrack Pro</Text>
            <Text style={m.muted}>v2.4.1</Text>
          </View>
          <Text style={m.dim}>Desarrollado bajo estándares urbanos industriales de alto rendimiento. Todos los derechos reservados.</Text>
        </View>

        <Pressable onPress={onLogout} style={[m.btnGhost, { marginTop: 8 }]}>
          <Text style={m.btnGhostText}>CERRAR SESIÓN</Text>
        </Pressable>
      </ScrollView>
      <BottomNav go={go}/>
    </View>
  );
}
