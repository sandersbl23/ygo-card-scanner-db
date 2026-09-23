import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import CollectionScreen from './src/screens/CollectionScreen';
import ScanScreen from './src/screens/ScanScreen';
import ConfirmMatchScreen from './src/screens/ConfirmMatchScreen';
import EditCardScreen from './src/screens/EditCardScreen';
import DecksScreen from './src/screens/DecksScreen';
import DeckDetailScreen from './src/screens/DeckDetailScreen';
import { initDatabase } from './src/db/database';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function CollectionStack() {
  return (
    <Stack.Navigator initialRouteName="Collection">
      <Stack.Screen name="Collection" component={CollectionScreen} options={{ title: 'My cards' }} />
      <Stack.Screen name="Scan" component={ScanScreen} options={{ title: 'Scan a card' }} />
      <Stack.Screen name="ConfirmMatch" component={ConfirmMatchScreen} options={{ title: 'Confirm match' }} />
      <Stack.Screen name="EditCard" component={EditCardScreen} options={{ title: 'Edit card' }} />
    </Stack.Navigator>
  );
}

function DecksStack() {
  return (
    <Stack.Navigator initialRouteName="Decks">
      <Stack.Screen name="Decks" component={DecksScreen} options={{ title: 'My decks' }} />
      <Stack.Screen name="DeckDetail" component={DeckDetailScreen} options={{ title: 'Deck' }} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initDatabase().then(() => setDbReady(true));
  }, []);

  if (!dbReady) {
    return null; // could render a splash/loading screen here
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator screenOptions={{ headerShown: false }}>
          <Tab.Screen name="CollectionTab" component={CollectionStack} options={{ title: 'Cards' }} />
          <Tab.Screen name="DecksTab" component={DecksStack} options={{ title: 'Decks' }} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
