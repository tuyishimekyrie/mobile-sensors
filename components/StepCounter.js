import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Pedometer } from 'expo-sensors';
import {StatusBar} from "expo-status-bar";

export default function StepCounter() {
    const [isPedometerAvailable, setIsPedometerAvailable] = useState('checking');
    const [currentStepCount, setCurrentStepCount] = useState(0);
    const [isTracking, setIsTracking] = useState(false);
    const [subscription, setSubscription] = useState(null);

    const subscribe = async () => {
        const isAvailable = await Pedometer.isAvailableAsync();
        setIsPedometerAvailable(String(isAvailable));

        if (isAvailable) {
            const subscription = Pedometer.watchStepCount((result) => {
                setCurrentStepCount(result.steps);
            });

            setSubscription(subscription);
        }
    };

    const unsubscribe = () => {
        if (subscription) {
            subscription.remove();
            setSubscription(null);
        }
    };

    useEffect(() => {
        if (isTracking) {
            subscribe();
        } else {
            unsubscribe();
        }

        return unsubscribe;
    }, [isTracking]);

    const startStopTracking = () => {
        setIsTracking(!isTracking);
        resetSteps()
    };

    const resetSteps = () => {
        setCurrentStepCount(0);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Step Counter</Text>
            <Text style={styles.subtitle}>
                Sensor status: {isPedometerAvailable ? 'Ready' : isPedometerAvailable}
            </Text>
            <View style={styles.stat}>
                <Text style={styles.statLabel}>Current Steps:</Text>
                <Text style={styles.statValue}>{currentStepCount}</Text>
            </View>
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.button}
                    onPress={startStopTracking}
                    activeOpacity={0.7}
                >
                    <Text style={styles.buttonText}>
                        {isTracking ? 'Stop Tracking' : 'Start Tracking'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.button}
                    onPress={resetSteps}
                    activeOpacity={0.7}
                >
                    <Text style={styles.buttonText}>Reset Steps</Text>
                </TouchableOpacity>
            </View>
            <StatusBar style="dark" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: "#94a3b8"
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 10,
        color: "#94a3b8"
    },
    stat: {
        // flex: 1,
        alignItems: 'center',
        marginBottom: 20,
        color: "#94a3b8"
    },
    statLabel: {
        fontSize: 16,
        marginBottom: 5,
        color: "#94a3b8"
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: "#94a3b8"
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    button: {
        backgroundColor: '#1d4ed8',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 5,
        marginHorizontal: 5,
    },
    buttonText: {
        color: '#f0f9ff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
