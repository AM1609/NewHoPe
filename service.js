import React from "react";
import { useState } from 'react';
import firestore from '@react-native-firebase/firestore';
import { List, IconButton, Colors } from 'react-native-paper';

function Service({ id, title, price }) {
    const [completed, setCompleted] = useState(false);

    async function toggleComplete() {
        await firestore()
            .collection('Services')
            .doc(id)
            .update({
                completed: !completed
            });
        setCompleted(!completed);
    }

    return (
        <List.Item
            title={title}
            description={`Price: ${price}`}
            right={() => (
                <IconButton
                    icon={completed ? 'check' : 'checkbox-blank-outline'}
                    color={completed ? Colors.green500 : Colors.grey500}
                    onPress={() => toggleComplete()}
                />
            )}
        />
    )
}

export default Service;
