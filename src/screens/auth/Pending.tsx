// Paciente esperando que un nutricionista lo asocie
import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../../constants/theme';
import { Button, Brand } from '../../components';

export function Pending({ nombre, onLogout }: { nombre: string; onLogout: () => Promise<void> }) {
  return (
    <View style={styles.welcome}>
      <View style={styles.welcomeGlow}/>
      <Brand/>
      <Text style={styles.welcomeTitle}>CUENTA{`\n`}PENDIENTE.</Text>
      <Text style={styles.lead}>
        Hola {nombre.split(' ')[0]}, tu cuenta fue creada. Para usar Nutrap, un nutricionista debe agregarte como su paciente.
      </Text>
      <Text style={styles.lead}>Esta pantalla se actualizará sola en cuanto te asocie.</Text>
      <Button label="CERRAR SESIÓN" onPress={onLogout} ghost/>
    </View>
  );
}
