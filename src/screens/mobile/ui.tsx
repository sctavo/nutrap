// App móvil — piezas visuales compartidas (header, barra inferior, anillo, macros, íconos)
import React, { useRef, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { C } from '../../constants/theme';
import type { Screen } from '../../types';
import type { UserProfile } from '../../types/models';

import { AMARILLO } from '../shared';
export { AMARILLO };
/** Fondo de la pestaña activa (mismo tono oliva que welcomeGlow del tema) */
export const OLIVA = '#203000';

export const iniciales = (nombre: string) =>
  nombre.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2);

// ─── Estilos ──────────────────────────────────────────────────────────────────
export const m = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: C.bg },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 110, gap: 14 },

  header:      { height: 64, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerBrand: { color: C.lime, fontSize: 22, fontWeight: '900', letterSpacing: 2 },
  avatar:      { width: 36, height: 36, borderRadius: 18, backgroundColor: C.panel2, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  avatarText:  { color: C.white, fontWeight: '900', fontSize: 12 },
  iconBtn:     { width: 36, height: 36, borderRadius: 10, backgroundColor: C.panel2, alignItems: 'center', justifyContent: 'center' },

  title:        { color: C.white, fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  section:      { color: C.white, fontSize: 15, fontWeight: '900', letterSpacing: 1, marginTop: 6 },
  sectionLime:  { color: C.lime, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginTop: 6 },
  sectionMuted: { color: C.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginTop: 6 },

  card:      { backgroundColor: C.panel, borderRadius: 10, padding: 14, gap: 10 },
  row:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  rowLine:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderColor: C.line },
  label:     { color: C.white, fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  labelSm:   { color: C.white, fontSize: 13 },
  valueLime: { color: C.lime, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  muted:     { color: C.muted, fontSize: 12 },
  dim:       { color: C.dim, fontSize: 11, lineHeight: 15 },

  bar:     { height: 5, backgroundColor: C.panel2, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 5, borderRadius: 3 },

  btnLime:     { backgroundColor: C.lime, borderRadius: 8, paddingVertical: 13, alignItems: 'center' },
  btnLimeText: { color: '#000', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  btnGhost:     { borderWidth: 1, borderColor: C.line, borderRadius: 8, paddingVertical: 13, alignItems: 'center' },
  btnGhostText: { color: C.muted, fontSize: 11, fontWeight: '900', letterSpacing: 1 },

  nav:         { position: 'absolute', left: 0, right: 0, bottom: 0, height: 76, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: C.bg, borderTopWidth: 1, borderColor: C.line },
  navItem:     { alignItems: 'center', gap: 5, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12 },
  navActive:   { backgroundColor: OLIVA },
  navText:     { fontSize: 8, fontWeight: '800', letterSpacing: 0.8, color: C.muted },
});

// ─── Íconos dibujados con View (sin librerías extra) ─────────────────────────
export function IconGrid({ color }: { color: string }) {
  const sq = { width: 6, height: 6, borderWidth: 1.5, borderColor: color, borderRadius: 1 };
  return (
    <View style={{ width: 14, height: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 2 }}>
      <View style={sq}/><View style={sq}/><View style={sq}/><View style={sq}/>
    </View>
  );
}

export function IconBarcode({ color }: { color: string }) {
  return (
    <View style={{ height: 14, flexDirection: 'row', alignItems: 'stretch', gap: 1.5 }}>
      {[2, 1, 2.5, 1, 1, 2, 1, 2].map((w, i) => <View key={i} style={{ width: w, backgroundColor: color }}/>)}
    </View>
  );
}

export function IconCalendar({ color }: { color: string }) {
  return (
    <View style={{ width: 14, height: 14, borderWidth: 1.5, borderTopWidth: 4, borderColor: color, borderRadius: 2 }}/>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
export function Header({ user, go }: { user: UserProfile; go: (s: Screen) => void }) {
  return (
    <View style={m.header}>
      <Pressable onPress={() => go('profile')} style={m.avatar}>
        <Text style={m.avatarText}>{iniciales(user.nombre)}</Text>
      </Pressable>
      <Text style={m.headerBrand}>NUTRAP</Text>
      <Pressable onPress={() => go('settings')} style={m.iconBtn}>
        <Text style={{ color: C.muted, fontSize: 17 }}>{'⚙︎'}</Text>
      </Pressable>
    </View>
  );
}

// ─── Barra inferior ──────────────────────────────────────────────────────────
const TABS: { id: Screen; label: string; Icon: (p: { color: string }) => React.ReactElement }[] = [
  { id: 'dashboard', label: 'DASHBOARD',  Icon: IconGrid },
  { id: 'scanner',   label: 'SCANNER',    Icon: IconBarcode },
  { id: 'calendar',  label: 'CALENDARIO', Icon: IconCalendar },
];

export function BottomNav({ active, go }: { active?: Screen; go: (s: Screen) => void }) {
  return (
    <View style={m.nav}>
      {TABS.map(({ id, label, Icon }) => {
        const on = active === id;
        return (
          <Pressable key={id} onPress={() => go(id)} style={[m.navItem, on && m.navActive]}>
            <Icon color={on ? C.lime : C.muted}/>
            <Text style={[m.navText, on && { color: C.lime }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Anillo de calorías (se llena según el avance) ───────────────────────────
/**
 * Anillo de progreso hecho solo con View (sin SVG):
 *   - una pista gris de fondo
 *   - dos medias circunferencias lima, cada una recortada en su mitad,
 *     que giran: la derecha cubre 0–50% y la izquierda 50–100%.
 * Si el paciente pasa su meta en más de 10%, el anillo se pinta amarillo.
 *
 * grande:   consumido (lima) sobre la meta (gris), como el dashboard del diseño.
 * compacto: consumido (blanco) sobre "META KCAL" pequeño, como el perfil.
 */
export function KcalRing({ value, meta, size, compacto = false }: { value: number; meta: number; size: number; compacto?: boolean }) {
  const grosor = size * 0.07;
  const big = size * 0.16;
  const progreso = meta > 0 ? Math.min(1, value / meta) : 0;
  const color = meta > 0 && value > meta * 1.1 ? AMARILLO : C.lime;

  // 0 → 360 grados, animado cada vez que cambia el consumo
  const grados = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(grados, { toValue: progreso * 360, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== 'web' }).start();
  }, [progreso]);

  // El arco (bordes superior + derecho) va de 315° a 135°; girado +45° cubre la mitad derecha (0°–180°).
  //  - mitad derecha:   parte escondida a la izquierda (-135°) y gira hasta 45° → muestra 0–50%
  //  - mitad izquierda: parte escondida a la derecha (45°) y gira hasta 225°   → muestra 50–100%
  const giroDerecha   = grados.interpolate({ inputRange: [0, 180, 360], outputRange: ['-135deg', '45deg', '45deg'] });
  const giroIzquierda = grados.interpolate({ inputRange: [0, 180, 360], outputRange: ['45deg', '45deg', '225deg'] });
  // Cada mitad se oculta mientras no le toca (evita una línea fina en el borde por el antialiasing)
  const verDerecha   = grados.interpolate({ inputRange: [0, 0.5, 360], outputRange: [0, 1, 1] });
  const verIzquierda = grados.interpolate({ inputRange: [0, 180, 180.5, 360], outputRange: [0, 0, 1, 1] });

  // Circunferencia con solo el borde superior y derecho pintados = arco de 180°
  const arco = {
    position: 'absolute' as const, top: 0, width: size, height: size, borderRadius: size / 2, borderWidth: grosor,
    borderTopColor: color, borderRightColor: color, borderBottomColor: 'transparent', borderLeftColor: 'transparent',
  };
  const mitad = { position: 'absolute' as const, top: 0, width: size / 2, height: size, overflow: 'hidden' as const };

  return (
    <View style={{ width: size, height: size }}>
      {/* pista */}
      <View style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: grosor, borderColor: C.panel2 }}/>
      {/* 0–50%: mitad derecha */}
      <View style={[mitad, { left: size / 2 }]}>
        <Animated.View style={[arco, { left: -size / 2, opacity: verDerecha, transform: [{ rotate: giroDerecha }] }]}/>
      </View>
      {/* 50–100%: mitad izquierda */}
      <View style={[mitad, { left: 0 }]}>
        <Animated.View style={[arco, { left: 0, opacity: verIzquierda, transform: [{ rotate: giroIzquierda }] }]}/>
      </View>

      {/* contenido */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3 }}>
          <Text style={{ color: compacto ? C.white : color, fontSize: big, fontWeight: '900' }}>{Math.round(value)}</Text>
          {!compacto && <Text style={{ color, fontSize: 10, fontWeight: '800', marginBottom: big * 0.18 }}>KCAL</Text>}
        </View>
        <View style={{ width: size * 0.5, height: 1, backgroundColor: C.dim }}/>
        {compacto ? (
          <Text style={{ color: C.muted, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>{meta} KCAL</Text>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3 }}>
            <Text style={{ color: C.muted, fontSize: big, fontWeight: '900' }}>{meta}</Text>
            <Text style={{ color: C.muted, fontSize: 10, fontWeight: '800', marginBottom: big * 0.18 }}>KCAL</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Tarjeta de macro ────────────────────────────────────────────────────────
export function MacroCard({ label, actual, meta, color }: { label: string; actual: number; meta: number; color: string }) {
  const pct = meta > 0 ? Math.min(100, (actual / meta) * 100) : 0;
  return (
    <View style={m.card}>
      <View style={m.row}>
        <Text style={m.label}>{label}</Text>
        <Text style={m.valueLime}>{Math.round(actual)} / {meta}G</Text>
      </View>
      <View style={m.bar}><View style={[m.barFill, { width: `${pct}%`, backgroundColor: color }]}/></View>
    </View>
  );
}
