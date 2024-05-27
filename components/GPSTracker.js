import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import MapView, {Circle, Marker, Polygon, Polyline} from 'react-native-maps';
import * as Location from 'expo-location';
import {SendPushNotification} from "./assets/Notification";
import { StatusBar } from 'expo-status-bar';

const geofenceRegions = [
    {
        id: 'home',
        latitude: -1.9626,
        longitude: 30.0475,
        radius: 100,
    },
    {
        id: 'work',
        latitude: -1.9639,
        longitude: 30.0601,
        radius: 200,
    },
    {
        id: 'ampersand',
        latitude: -1.9720,
        longitude: 30.0852,
        radius: 200,
    },
];

const GPSTracker = () => {
    const [location, setLocation] = useState(null);
    const [mapType, setMapType] = useState('standard');
    const [distance, setDistance] = useState(0);
    const [currentRegion, setCurrentRegion] = useState(null);
    let lineEdge1 = 0.001;
    let lineEdge2 = 0.001;

    useEffect(() => {
        (async () => {
            let {status} = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.error('Permission to access location was denied');
                return;
            }

            let currentLocation = await Location.getCurrentPositionAsync({});
            setLocation(currentLocation);

            const locationSubscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    distanceInterval: 10,
                },
                (newLocation) => {
                    setLocation(newLocation);
                    checkGeofenceRegions(newLocation.coords);
                }
            );

            return () => {
                locationSubscription.remove();
            };
        })();
    }, []);

    const toggleMapType = () => {
        setMapType(mapType === 'standard' ? 'hybrid' : 'standard');
    };

    const calculateDistance = (coordinates) => {
        let totalDistance = 0;
        for (let i = 0; i < coordinates.length - 1; i++) {
            const lat1 = coordinates[i].latitude;
            const lon1 = coordinates[i].longitude;
            const lat2 = coordinates[i + 1].latitude;
            const lon2 = coordinates[i + 1].longitude;
            const distanceBetweenPoints = calculateDistanceBetweenPoints(lat1, lon1, lat2, lon2);
            totalDistance += distanceBetweenPoints;
        }
        return totalDistance;
    };


    const [nearbyRegion, setNearbyRegion] = useState(null);

    const checkGeofenceRegions = (coords) => {
        geofenceRegions.forEach((region) => {
            const distance = calculateDistanceBetweenPoints(
                coords.latitude,
                coords.longitude,
                region.latitude,
                region.longitude
            );

            if (distance <= region.radius) {
                if (currentRegion !== region.id) {
                    setCurrentRegion(region.id);
                    const message = `Entered ${region.id} region`
                    SendPushNotification('Sensors App - Map Location', message)
                }
            } else if (distance <= region.radius + 100) {
                if (nearbyRegion !== region.id) {
                    setNearbyRegion(region.id);
                    const message = `Near ${region.id} region`
                    SendPushNotification('Sensors App - Map Location', message)
                }
            } else {
                if (currentRegion === region.id) {
                    setCurrentRegion(null);
                    const message = `Left ${region.id} region`
                    SendPushNotification('Sensors App - Map Location', message)
                }
                if (nearbyRegion === region.id) {
                    setNearbyRegion(null);
                }
            }
        });
    };

    const calculateDistanceBetweenPoints = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3;
        const q1 = lat1 * (Math.PI / 180);
        const q2 = lat2 * (Math.PI / 180);
        const Dq = (lat2 - lat1) * (Math.PI / 180);
        const Dr = (lon2 - lon1) * (Math.PI / 180);

        const a = Math.sin(Dq / 2) * Math.sin(Dq / 2) +
            Math.cos(q1) * Math.cos(q2) *
            Math.sin(Dr / 2) * Math.sin(Dr / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    };

    useEffect(() => {
        if (location) {
            const coordinates = [
                {latitude: location.coords.latitude, longitude: location.coords.longitude},
                {latitude: location.coords.latitude + lineEdge1, longitude: location.coords.longitude + lineEdge2},
            ];
            const calculatedDistance = calculateDistance(coordinates);
            setDistance(calculatedDistance);
        }
    }, [location]);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>GPS Tracker</Text>
            <Text>Line Distance: {distance.toFixed(2)} meters</Text>
            {location && (
                <MapView
                    style={styles.map}
                    initialRegion={{
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        latitudeDelta: 0.0922,
                        longitudeDelta: 0.0421,
                    }}
                    mapType={mapType}
                >
                    <Marker
                        coordinate={{
                            latitude: location.coords.latitude,
                            longitude: location.coords.longitude,
                        }}
                        title="You are here"
                        description={`Your current location: (${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)})`}
                    />
                    <Circle
                        center={{
                            latitude: location.coords.latitude,
                            longitude: location.coords.longitude,
                        }}
                        radius={100} // in meters
                        strokeColor="rgba(0, 0, 255, 0.5)"
                        fillColor="rgba(0, 0, 255, 0.2)"
                    />
                    <Polygon
                        coordinates={[
                            {latitude: location.coords.latitude + 0.001, longitude: location.coords.longitude - 0.001},
                            {latitude: location.coords.latitude - 0.001, longitude: location.coords.longitude - 0.001},
                            {latitude: location.coords.latitude - 0.001, longitude: location.coords.longitude + 0.001},
                            {latitude: location.coords.latitude + 0.001, longitude: location.coords.longitude + 0.001},
                        ]}
                        strokeColor="rgba(255, 0, 0, 0.5)"
                        fillColor="rgba(255, 0, 0, 0.2)"
                    />
                    <Polyline
                        coordinates={[
                            {latitude: location.coords.latitude, longitude: location.coords.longitude},
                            {
                                latitude: location.coords.latitude + lineEdge1,
                                longitude: location.coords.longitude + lineEdge2
                            },
                        ]}
                        strokeColor="#ff0000"
                        strokeWidth={2}
                    />
                </MapView>
            )}
            <TouchableOpacity onPress={toggleMapType} style={styles.toggleButton}>
                <Text>Switch to {mapType === 'standard' ? 'Satellite View' : 'Standard View'}</Text>
            </TouchableOpacity>
            <StatusBar style="dark" />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: '10%',
        backgroundColor:"#e2e8f0"
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    map: {
        width: '100%',
        height: '75%',
    },
    toggleButton: {
        padding: 10,
        backgroundColor: '#fff',
        borderRadius: 5,
        marginTop: 5,
        marginBottom: 5,
    },
});

export default GPSTracker;
