import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import CollectionScreen from './src/screens/CollectionScreen';
import ScanScreen from './src/screens/ScanScreen';
import ConfirmMatchScreen from './src/screens/ConfirmMatchScreen';
import { initDatabase } from './src/db/database';

const Stack = createNativeStackNavigator();

export default function App() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initDatabase().then(() => setDbReady(true));
  }, []);

  if (!dbReady) {
    return null; // could render a splash/loading screen here
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Collection">
        <Stack.Screen
          name="Collection"
          component={CollectionScreen}
          options={{ title: 'My cards' }}
        />
        <Stack.Screen
          name="Scan"
          component={ScanScreen}
          options={{ title: 'Scan a card' }}
        />
        <Stack.Screen
          name="ConfirmMatch"
          component={ConfirmMatchScreen}
          options={{ title: 'Confirm match' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
