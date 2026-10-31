import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useAuth } from '../contexts/AuthContext';

// Patient / General Screens
import HomeScreen from '../screens/HomeScreen';
import DoctorsScreen from '../screens/DoctorsScreen';
import DoctorDetailScreen from '../screens/DoctorDetailScreen';
import BookingScreen from '../screens/BookingScreen';
import AppointmentsScreen from '../screens/AppointmentsScreen';
import ChatbotScreen from '../screens/ChatbotScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

// Doctor Screens
import DoctorOverviewScreen from '../screens/doctor/DoctorOverviewScreen';
import DoctorAppointmentsScreen from '../screens/doctor/DoctorAppointmentsScreen';
import DoctorShiftsScreen from '../screens/doctor/DoctorShiftsScreen';
import DoctorProfileScreen from '../screens/doctor/DoctorProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Patient / Guest Tab Navigator
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color }) => {
          let iconName: any = 'home';
          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'DoctorsTab') {
            iconName = focused ? 'medkit' : 'medkit-outline';
          } else if (route.name === 'AppointmentsTab') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'ChatbotTab') {
            iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ tabBarLabel: 'Trang chủ' }}
      />
      <Tab.Screen
        name="DoctorsTab"
        component={DoctorsScreen}
        options={{ tabBarLabel: 'Bác sĩ' }}
      />
      <Tab.Screen
        name="AppointmentsTab"
        component={AppointmentsScreen}
        options={{ tabBarLabel: 'Lịch khám' }}
      />
      <Tab.Screen
        name="ChatbotTab"
        component={ChatbotScreen}
        options={{ tabBarLabel: 'Trợ lý AI' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Hồ sơ' }}
      />
    </Tab.Navigator>
  );
}

// Doctor Tab Navigator
function DoctorTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color }) => {
          let iconName: any = 'grid';
          if (route.name === 'DoctorOverviewTab') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'DoctorAppointmentsTab') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'DoctorShiftsTab') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'DoctorProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="DoctorOverviewTab"
        component={DoctorOverviewScreen}
        options={{ tabBarLabel: 'Tổng quan' }}
      />
      <Tab.Screen
        name="DoctorAppointmentsTab"
        component={DoctorAppointmentsScreen}
        options={{ tabBarLabel: 'Lịch hẹn' }}
      />
      <Tab.Screen
        name="DoctorShiftsTab"
        component={DoctorShiftsScreen}
        options={{ tabBarLabel: 'Ca khám' }}
      />
      <Tab.Screen
        name="DoctorProfileTab"
        component={DoctorProfileScreen}
        options={{ tabBarLabel: 'Hồ sơ' }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { user } = useAuth();

  const getInitialRouteName = () => {
    if (!user) return 'Login';
    return user.userType === 'Doctor' ? 'DoctorTabs' : 'MainTabs';
  };

  return (
    <NavigationContainer>
      <Stack.Navigator
        key={user ? `auth-${user.userType}-${user.id}` : 'guest'}
        initialRouteName={getInitialRouteName()}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        <Stack.Screen name="DoctorTabs" component={DoctorTabNavigator} />
        <Stack.Screen
          name="DoctorDetail"
          component={DoctorDetailScreen}
          options={{ presentation: 'card' }}
        />
        <Stack.Screen
          name="BookingModal"
          component={BookingScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ presentation: 'card' }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ presentation: 'card' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
