import { ref } from "vue";

export const notifications = ref([]);

let nextNotificationId = 1;

export function showNotification(message, { color = "#c49cff", textColor = "#fff", duration = 4000 } = {}) {
    const notification = {
        id: nextNotificationId++,
        message,
        color,
        textColor,
        duration,
    };
    notifications.value.push(notification);
    window.setTimeout(() => {
        const index = notifications.value.findIndex(({ id }) => id === notification.id);
        if (index !== -1) notifications.value.splice(index, 1);
    }, duration);
}
