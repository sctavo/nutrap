// Utilidades compartidas por las pantallas
import React from 'react';
import { Text, Platform } from 'react-native';
import { C } from '../constants/theme';
import type { Screen } from '../types';

/**
 * Cada plataforma tiene un solo tipo de usuario:
 *   web   → portal del NUTRICIONISTA
 *   móvil → app del PACIENTE
 */
export const ES_WEB = Platform.OS === 'web';
export const ROL_DE_PLATAFORMA: 'PROFESIONAL' | 'PACIENTE' = ES_WEB ? 'PROFESIONAL' : 'PACIENTE';

/** Acento amarillo de los diseños en Figma (carbohidratos, alertas intermedias) */
export const AMARILLO = '#ffc400';

/** Props comunes de las pantallas del portal profesional */
export type ProProps = { go: (s: Screen) => void; profesionalUid: string; nombre: string };

/** Texto de error / éxito con los colores del tema */
export function Aviso({ text, ok = false }: { text: string; ok?: boolean }) {
  if (!text) return null;
  return <Text style={{ color: ok ? C.lime : C.red, fontWeight: '800', fontSize: 12 }}>{text}</Text>;
}
