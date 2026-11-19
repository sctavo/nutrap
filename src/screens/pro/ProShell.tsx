// Portal web — layout: barra lateral, barra superior y contenido
import React from 'react';
import { View, Text, ScrollView, TextInput, Pressable, StyleSheet } from 'react-native';
import { C, styles } from '../../constants/theme';
import type { Screen, ProScreen } from '../../types';
import { Brand } from '../../components';
import { AuthService } from '../../services/authService';
import { IconPanel, IconUsuarios, IconPlanes, IconReportes, IconBuscar, IconCampana } from './icons';

const NAV: { id: ProScreen; label: string; Icon: (p: { color: string }) => React.ReactElement }[] = [
  { id: 'pro-dashboard', label: 'PANEL PRINCIPAL', Icon: IconPanel },
  { id: 'users',         label: 'USUARIOS',        Icon: IconUsuarios },
  { id: 'plans',         label: 'PLANES',          Icon: IconPlanes },
  { id: 'reports',       label: 'REPORTES',        Icon: IconReportes },
];

const s = StyleSheet.create({
  navItem:    { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 8 },
  navText:    { color: C.muted, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  perfil:     { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.panel, borderWidth: 1, borderColor: C.line, borderRadius: 10, padding: 10 },
  avatar:     { width: 34, height: 34, borderRadius: 17, backgroundColor: C.panel2, borderWidth: 1, borderColor: C.lime, alignItems: 'center', justifyContent: 'center' },
  buscar:     { flexDirection: 'row', alignItems: 'center', gap: 8, width: 300, backgroundColor: C.panel, borderWidth: 1, borderColor: C.line, borderRadius: 8, paddingHorizontal: 12 },
  campana:    { width: 38, height: 38, borderRadius: 19, backgroundColor: C.panel, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
});

const iniciales = (n: string) => n.split(' ').filter(Boolean).map(x => x[0]).join('').toUpperCase().slice(0, 2);

export function ProShell({ screen, go, nombre, children, busqueda, onBusqueda, alertas = 0 }: {
  screen: ProScreen; go: (s: Screen) => void; nombre: string; children: React.ReactNode;
  /** Si se pasan, la barra de búsqueda filtra el contenido de la pantalla */
  busqueda?: string; onBusqueda?: (t: string) => void;
  /** Número de alertas: muestra un punto rojo en la campana */
  alertas?: number;
}) {
  return (
    <View style={styles.pro}>
      {/* Barra lateral */}
      <View style={[styles.sidebar, { gap: 0 }]}>
        <View style={{ gap: 6 }}>
          <View style={{ marginBottom: 26 }}><Brand/></View>
          {NAV.map(({ id, label, Icon }) => {
            const on = screen === id;
            return (
              <Pressable key={id} onPress={() => go(id)} style={[s.navItem, on && { backgroundColor: C.panel2 }]}>
                <Icon color={on ? C.lime : C.muted}/>
                <Text style={[s.navText, on && { color: C.lime }]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={{ gap: 8 }}>
          <View style={s.perfil}>
            <View style={s.avatar}><Text style={{ color: C.white, fontWeight: '900', fontSize: 12 }}>{iniciales(nombre)}</Text></View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ color: C.white, fontWeight: '800', fontSize: 13 }} numberOfLines={1}>{nombre}</Text>
              <Text style={{ color: C.muted, fontSize: 9, letterSpacing: 1, fontWeight: '700' }}>NUTRICIONISTA</Text>
            </View>
          </View>
          <Pressable onPress={() => AuthService.logout()} style={{ alignSelf: 'center', padding: 4 }}>
            <Text style={{ color: C.dim, fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>CERRAR SESIÓN</Text>
          </Pressable>
        </View>
      </View>

      {/* Contenido */}
      <View style={styles.proMain}>
        <View style={styles.topbar}>
          <Text style={styles.topbarText}>CONSOLA DE MONITOREO CLÍNICO</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={s.buscar}>
              <IconBuscar color={C.muted}/>
              <TextInput
                value={busqueda}
                onChangeText={onBusqueda}
                editable={!!onBusqueda}
                placeholder="Buscar paciente, plan, reporte..."
                placeholderTextColor={C.dim}
                style={{ flex: 1, minWidth: 0, color: C.white, paddingVertical: 10, fontSize: 13 }}
              />
            </View>
            <View style={s.campana}>
              <IconCampana color={C.white}/>
              {alertas > 0 && <View style={{ position: 'absolute', top: 8, right: 9, width: 7, height: 7, borderRadius: 4, backgroundColor: C.red }}/>}
            </View>
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.proContent}>{children}</ScrollView>
      </View>
    </View>
  );
}
