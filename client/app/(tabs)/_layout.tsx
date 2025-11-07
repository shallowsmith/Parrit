import { Tabs, Redirect } from 'expo-router';
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/AuthContext';
import { AppColors } from '@/constants/theme';

export default function TabLayout() {
  const { isAuthenticated } = useAuth();
  const [isVoicePressed, setIsVoicePressed] = React.useState(false);

  // Protect tabs - redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  const handleVoicePress = () => {
    // Voice input functionality will be implemented here
    console.log('Voice button pressed');
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#83917f', 
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: '#1f251d',
          borderTopWidth: 0,
          paddingBottom: 15,  
          paddingTop: 10,
          paddingHorizontal: 10,
          height: 90,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
          fontFamily: 'ui-sans-serif',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="camera.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="voice"
        options={{
          title: '',
          tabBarIcon: () => (
            <TouchableOpacity 
              style={styles.voiceButton}
              onPress={handleVoicePress}
              activeOpacity={0.8}
            >
              <MaterialIcons name="mic" size={36} color="#FFFFFF" />
            </TouchableOpacity>
          ),
          tabBarButton: (props) => (
            <View style={styles.voiceButtonContainer}>
              <TouchableOpacity 
                style={[
                  styles.voiceButton,
                  isVoicePressed && styles.voiceButtonPressed
                ]}
                onPress={handleVoicePress}
                onPressIn={() => setIsVoicePressed(true)}
                onPressOut={() => setIsVoicePressed(false)}
                activeOpacity={1}
              >
                <MaterialIcons 
                  name="mic" 
                  size={36} 
                  color={isVoicePressed ? '#D0D0D0' : '#FFFFFF'} 
                />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="help"
        options={{
          title: 'Help',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="questionmark.circle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  voiceButtonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    top: -20,
  },
  voiceButton: {
    width: 73,
    height: 73,
    borderRadius: 36,
    backgroundColor: AppColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  voiceButtonPressed: {
    backgroundColor: '#5A8F4D', // Darker green when pressed
  },
});
